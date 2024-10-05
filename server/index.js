const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const words = require("./words");

const app = express();
const server = http.createServer(app);

const DEFAULT_SCORE = 10;
const rooms = {};

// Enable CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
});

app.use(express.static("public"));

function calculateScore(maxTime, timeOfGuessing) {
  if (timeOfGuessing >= maxTime * 0.9) {
    return DEFAULT_SCORE * 10;
  } else {
    const timeSpentRatio = (maxTime - timeOfGuessing) / maxTime;
    const multiplier = Math.floor(9 - timeSpentRatio * 8);
    return DEFAULT_SCORE * multiplier;
  }
}

function selectRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

function changeDrawer(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  let oldWord = room.currentWord;
  room.handsPlayed++;

  room.currentRound =
    Math.floor(room.handsPlayed / room.users.length) >= room.currentRound
      ? Math.floor(room.handsPlayed / room.users.length)
      : room.currentRound;

  room.currentDrawerIndex = (room.currentDrawerIndex + 1) % room.users.length;
  room.currentDrawer = room.users[room.currentDrawerIndex].id;
  room.currentWord = selectRandomWord();

  io.to(room.currentDrawer).emit("newWord", room.currentWord);

  const secretWord = room.currentWord.replace(/[^-\s]/g, "_");

  io.to(roomId).emit("handEnded", {
    currentDrawer: room.users[room.currentDrawerIndex]?.name,
    Word: oldWord,
  });

  setTimeout(() => {
    io.to(roomId).emit("newDrawer", {
      currentDrawer: room.users[room.currentDrawerIndex]?.name,
      currentDrawerId: room.currentDrawer,
      secretWord: secretWord,
      time: room.time,
      currentRound: room.currentRound,
    });

    startTurnTimer(roomId);
  }, 5000);
}

function startTurnTimer(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  if (room.currentRound === room.maxRounds) {
    room.isGameStarted = false;
    io.to(roomId).emit("MaxRoundsReached");
    console.log("Max rounds reached, stopping execution.");
    return;
  }
  clearTimeout(room.turnTimer);
  const timeoutDuration = room.time * 1000;

  room.turnTimer = setTimeout(() => {
    changeDrawer(roomId);
  }, timeoutDuration);
}

function handleLateJoin(roomId, id) {
  const room = rooms[roomId];
  if (!room) return;
  console.log("requested canvas data from client", roomId, id);

  io.to(room.currentDrawer).emit("requestCanvasDataFromClient", roomId, id);
}

io.on("connection", (socket) => {
  console.log("New connection established");

  socket.on("join_room", ({ roomId, name }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit("roomError", { error: "Room does not exist." });
      return;
    }

    if (room.users.length >= room.maxPlayers) {
      socket.emit("roomError", { error: "Room is full." });
      return;
    }

    const userData = {
      id: socket.id,
      name,
      roomName: room.name,
      roomId: roomId,
      score: 0,
      hasGuessed: false,
    };
    room.users.push(userData);

    socket.join(roomId);

    if (room.isGameStarted) {
      handleLateJoin(roomId, socket.id);
      console.log("someone joined late");
    }

    setTimeout(() => {
      io.to(roomId).emit("updateUserList", room.users);
    }, 500);
    io.to(roomId).emit("userJoined", userData);
  });

  socket.on("create_room", ({ name, id, maxPlayers, time, maxRounds }) => {
    if (rooms[id]) {
      socket.emit("roomError", { error: "Room ID already exists." });
      return;
    }

    rooms[id] = {
      name,
      maxPlayers,
      maxRounds: maxRounds,
      users: [],
      time,
      currentDrawerIndex: 0,
      currentRound: 0,
      handsPlayed: 0,
      currentDrawer: null,
      currentWord: null,
      isGameStarted: false,
    };

    socket.emit("roomCreated", { id, name, maxPlayers, time });
  });

  socket.on("startGame", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    room.currentRound = 0;
    room.handsPlayed = 0;
    room.isGameStarted = true;
    room.currentDrawerIndex = 0;
    room.currentDrawer = room.users[0].id;
    room.currentWord = selectRandomWord();

    io.to(room.currentDrawer).emit("newWord", room.currentWord);
    const secretWord = room.currentWord.replace(/[^-\s]/g, "_");

    io.to(roomId).emit("newDrawer", {
      currentDrawer: room.users[0].name,
      currentDrawerId: room.currentDrawer,
      secretWord: secretWord,
      time: room.time,
      currentRound: room.currentRound,
    });

    io.to(roomId).emit("updateUserList", room.users);
    io.to(roomId).emit("gameStarted", {
      currentDrawer: room.users[0].name,
      currentDrawerId: room.currentDrawer,
      maxRounds: room.maxRounds,
    });

    startTurnTimer(roomId);
  });

  socket.on("guess", ({ roomId, guess, timeLeft }) => {
    const room = rooms[roomId];
    if (!room) return;

    const guesser = room.users.find((user) => user.id === socket.id);
    if (!guesser) return;

    if (guess.toLowerCase() === room.currentWord?.toLowerCase()) {
      io.to(roomId).emit("correctGuess", {
        guesser: guesser.name,
        guesserId: guesser.id,
      });

      if (!guesser.hasGuessed) {
        io.to(roomId).emit("message", {
          message: `${guesser.name}-მ გამოიცნო`,
          userName: "game",
        });
      }

      guesser.hasGuessed = true;
      let score = calculateScore(room.time, timeLeft);
      guesser.score += score;

      const drawer = room.users.find((user) => user.id === room.currentDrawer);
      if (drawer) {
        drawer.score += Math.floor(0.2 * score);
      }

      io.to(roomId).emit("updateUserList", room.users);
      io.to(socket.id).emit("conffeti", { message: "Correct!" });

      const allGuessed = room.users.every(
        (user) => user.hasGuessed || user.id === room.currentDrawer
      );
      if (allGuessed) {
        changeDrawer(roomId);
        room.users.forEach((user) => (user.hasGuessed = false));
        io.to(roomId).emit("allGuessed");
      }
    } else {
      io.to(roomId).emit("incorrectGuess", { guesser: guesser.name, guess });
    }
  });

  socket.on("message", ({ roomId, message, userName }) => {
    if (message !== rooms[roomId]?.currentWord) {
      io.to(roomId).emit("message", { message, userName });
    }
  });

  socket.on("draw", ({ roomId, x0, y0, x1, y1, color }) => {
    io.to(roomId).emit("draw", { x0, y0, x1, y1, color });
  });

  socket.on("undo", ({ newHistory, roomId }) => {
    io.to(roomId).emit("undo", newHistory);
  });

  socket.on("lineWidthChange", ({ newLineWidth, roomId }) => {
    io.to(roomId).emit("newLineWidth", { newLineWidth });
  });

  socket.on("clear", (roomId) => {
    io.to(roomId).emit("clear");
  });

  socket.on("erace", ({ roomId, pixel }) => {
    io.to(roomId).emit("erace", { pixel });
  });
  socket.on("skipTurn", ({ roomId }) => {
    changeDrawer(roomId);
  });
  socket.on("fill", ({ roomId, startX, startY, fillColor }) => {
    io.to(roomId).emit("fill", { startX, startY, fillColor });
  });
  socket.on("sendCanvasDataToServer", (data) => {
    console.log(data);

    const room = rooms[data.roomId];
    const secretWord = room.currentWord.replace(/[^-\s]/g, "_");
    console.log(room.currentDrawerId);
    const dataForClient = {
      currentDrawer: room.currentDrawer,
      currentDrawerId: room.users[room.currentDrawerIndex].id,

      secretWord: secretWord,
      base64Image: data.base64Image,
      time: room.time,
      currentRound: room.currentRound,
      maxRounds: room.maxRounds,
    };
    console.log("Received canvas data from client:", dataForClient);
    io.to(data.id).emit("SendCanvasDataToClient", dataForClient);
  });
  socket.on("test", (history) => {
    console.log("test:", history);
  });
  socket.on("kickPlayer", ({ roomId, playerId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const playerIndex = room.users.findIndex((user) => user.id === playerId);
    if (playerIndex === -1) return;

    const userData = room.users[playerIndex];

    room.users.splice(playerIndex, 1);

    io.to(roomId).emit("userKicked", userData);
    io.to(playerId).emit("youWereKicked");
    io.sockets.sockets.get(playerId)?.disconnect(true);

    io.to(roomId).emit("updateUserList", room.users);

    if (room.users.length === 0) {
      delete rooms[roomId];
    } else if (room.currentDrawer === playerId) {
      changeDrawer(roomId);
    }
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const userIndex = room.users.findIndex((user) => user.id === socket.id);

      if (userIndex !== -1) {
        const userData = room.users[userIndex];
        room.users.splice(userIndex, 1);
        io.to(roomId).emit("userDisconnected", userData);
        io.to(roomId).emit("updateUserList", room.users);

        if (room.users.length === 0) {
          console.log("Room is empty, removing it");
          delete rooms[roomId];
        } else if (room.currentDrawer === socket.id) {
          changeDrawer(roomId);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
