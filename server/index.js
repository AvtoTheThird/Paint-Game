const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const words = require("./words");

const app = express();
const server = http.createServer(app);
const DEFAULT_SCORE = 10;
const rooms = {};
const publicRooms = {};

app.use(cors({ origin: "*", methods: ["GET", "POST"], credentials: true }));

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"], credentials: false },
});

app.use(express.static("public"));

const calculateScore = (maxTime, timeOfGuessing) =>
  timeOfGuessing >= maxTime * 0.9
    ? DEFAULT_SCORE * 10
    : DEFAULT_SCORE *
      Math.floor(9 - ((maxTime - timeOfGuessing) / maxTime) * 8);

const createPublicRoom = () => {
  const id = `public-${Date.now()}`;
  publicRooms[id] = {
    name: `Public Room ${Object.keys(publicRooms).length + 1}`,
    maxPlayers: 8,
    maxRounds: 8,
    users: [],
    time: 90,
    currentDrawerIndex: 0,
    currentRound: 0,
    handsPlayed: 0,
    currentDrawer: null,
    currentWord: null,
    isGameStarted: false,
  };
  return id;
};

const getAvailablePublicRoom = () => {
  const availableRooms = Object.keys(publicRooms).filter(
    (id) => publicRooms[id].users.length < publicRooms[id].maxPlayers
  );
  if (availableRooms.length === 0) return createPublicRoom();
  return availableRooms.reduce((a, b) =>
    publicRooms[a].users.length > publicRooms[b].users.length ? a : b
  );
};

const ensurePublicRoomAvailable = () => {
  if (!Object.keys(publicRooms).length) createPublicRoom();
};

const selectRandomWord = () => words[Math.floor(Math.random() * words.length)];

const changeDrawer = (roomId, isPublic = false) => {
  const room = isPublic ? publicRooms[roomId] : rooms[roomId];
  if (!room) return;

  const oldWord = room.currentWord;
  room.handsPlayed++;
  room.currentRound = Math.floor(room.handsPlayed / room.users.length);
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
    startTurnTimer(roomId, isPublic);
  }, 5000);
};

const startGame = (roomId, isPublic = false) => {
  const room = isPublic ? publicRooms[roomId] : rooms[roomId];
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
    time: room.time,
    currentRound: room.currentRound,
  });

  startTurnTimer(roomId, isPublic);
};

const startTurnTimer = (roomId, isPublic = false) => {
  const room = isPublic ? publicRooms[roomId] : rooms[roomId];
  if (!room) return;

  if (room.currentRound === room.maxRounds) {
    room.isGameStarted = false;
    io.to(roomId).emit("MaxRoundsReached");
    if (isPublic) {
      setTimeout(() => {
        startGame(roomId, true);
      }, 5000);
    }
    return;
  }

  clearTimeout(room.turnTimer);
  room.turnTimer = setTimeout(
    () => changeDrawer(roomId, isPublic),
    room.time * 1000
  );
};

const handleLateJoin = (roomId, id, isPublic = false) => {
  const room = isPublic ? publicRooms[roomId] : rooms[roomId];
  if (room)
    io.to(room.currentDrawer).emit("requestCanvasDataFromClient", roomId, id);
};

io.on("connection", (socket) => {
  ensurePublicRoomAvailable();

  socket.on("join_public_room", ({ name, avatarID }) => {
    const roomId = getAvailablePublicRoom();
    const room = publicRooms[roomId];
    const userData = {
      id: socket.id,
      name,
      roomName: room.name,
      roomId,
      score: 0,
      hasGuessed: false,
      avatarID,
    };
    room.users.push(userData);

    socket.join(roomId);
    if (room.users.length >= 2) startGame(roomId, true);
    if (room.isGameStarted) handleLateJoin(roomId, socket.id, true);

    setTimeout(() => io.to(roomId).emit("updateUserList", room.users), 500);
    io.to(roomId).emit("userJoined", userData);
    socket.emit("joined_public_room", {
      roomId,
      roomName: room.name,
      userId: socket.id,
      name,
    });
    console.log("someone joined pub room: ", {
      roomId,
      roomName: room.name,
      userId: socket.id,
      name,
    });
  });

  socket.on("join_room", ({ roomId, name, avatarID }) => {
    const room = rooms[roomId];
    if (!room)
      return socket.emit("roomError", { error: "Room does not exist." });
    if (room.users.length >= room.maxPlayers)
      return socket.emit("roomError", { error: "Room is full." });

    const userData = {
      id: socket.id,
      name,
      roomName: room.name,
      roomId,
      score: 0,
      hasGuessed: false,
      avatarID,
    };
    room.users.push(userData);

    socket.join(roomId);
    if (room.isGameStarted) handleLateJoin(roomId, socket.id);

    setTimeout(() => io.to(roomId).emit("updateUserList", room.users), 500);
    io.to(roomId).emit("userJoined", userData);
  });

  socket.on("create_room", ({ name, id, maxPlayers, time, maxRounds }) => {
    if (rooms[id])
      return socket.emit("roomError", { error: "Room ID already exists." });
    rooms[id] = {
      name,
      maxPlayers,
      maxRounds,
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

  socket.on("startGame", ({ roomId, isPublic = false }) =>
    startGame(roomId, isPublic)
  );

  socket.on("leaveRoom", ({ roomId, userId }) => {
    const isPublic = roomId.startsWith("public-");
    const room = isPublic ? publicRooms[roomId] : rooms[roomId];
    if (!room) return;

    const userIndex = room.users.findIndex((user) => user.id === userId);
    if (userIndex === -1) return;

    const userData = room.users[userIndex];
    room.users.splice(userIndex, 1);

    socket.leave(roomId);
    io.to(roomId).emit("userLeft", userData);
    io.to(roomId).emit("updateUserList", room.users);
    socket.emit("leftRoom", { roomId, success: true });

    if (!room.users.length) {
      if (isPublic) {
        delete publicRooms[roomId];
        ensurePublicRoomAvailable();
      } else {
        delete rooms[roomId];
      }
    } else if (room.currentDrawer === userId) {
      changeDrawer(roomId, isPublic);
    }
  });

  socket.on("message", ({ roomId, message, userName }) => {
    if (message !== rooms[roomId]?.currentWord) {
      io.to(roomId).emit("message", { message, userName });
    }
  });

  socket.on("guess", ({ roomId, guess, timeLeft }) => {
    const isPublic = roomId.startsWith("public-");
    const room = isPublic ? publicRooms[roomId] : rooms[roomId];
    if (!room) return;

    const guesser = room.users.find((user) => user.id === socket.id);
    if (!guesser) return;

    if (guess.toLowerCase() === room.currentWord?.toLowerCase()) {
      io.to(roomId).emit("correctGuess", {
        guesser: guesser.name,
        guesserId: guesser.id,
        word: guess,
      });
      if (!guesser.hasGuessed)
        io.to(roomId).emit("message", {
          message: `${guesser.name}-მ გამოიცნო`,
          userName: "game",
        });

      guesser.hasGuessed = true;
      const score = calculateScore(room.time, timeLeft);
      guesser.score += score;

      const drawer = room.users.find((user) => user.id === room.currentDrawer);
      if (drawer) drawer.score += Math.floor(0.2 * score);

      io.to(roomId).emit("updateUserList", room.users);
      const allGuessed = room.users.every(
        (user) => user.hasGuessed || user.id === room.currentDrawer
      );

      if (allGuessed) {
        changeDrawer(roomId, isPublic);
        room.handsPlayed++;
        room.users.forEach((user) => (user.hasGuessed = false));
        io.to(roomId).emit("allGuessed");
      }
    } else {
      io.to(roomId).emit("incorrectGuess", { guesser: guesser.name, guess });
    }

    if (room.currentRound >= room.maxRounds) {
      if (isPublic) {
        room.currentRound = 0;
        room.handsPlayed = 0;
        room.users.forEach((user) => (user.score = 0));
        io.to(roomId).emit("gameReset", {
          message: "Game has been reset. Starting a new game!",
        });
        startGame(roomId, true);
      } else {
        io.to(roomId).emit("gameEnded", {
          message: "Game has ended. Final scores:",
          scores: room.users.map((u) => ({ name: u.name, score: u.score })),
        });
      }
    }
  });

  socket.on("draw", ({ roomId, x0, y0, x1, y1, color }) =>
    io.to(roomId).emit("draw", { x0, y0, x1, y1, color })
  );
  socket.on("undo", ({ newHistory, roomId }) =>
    io.to(roomId).emit("undo", newHistory)
  );
  socket.on("lineWidthChange", ({ newLineWidth, roomId }) =>
    io.to(roomId).emit("newLineWidth", { newLineWidth })
  );
  socket.on("clear", (roomId) => io.to(roomId).emit("clear"));
  socket.on("erace", ({ roomId, pixel }) =>
    io.to(roomId).emit("erace", { pixel })
  );
  socket.on("skipTurn", ({ roomId }) => changeDrawer(roomId));
  socket.on("fill", ({ roomId, startX, startY, fillColor }) =>
    io.to(roomId).emit("fill", { startX, startY, fillColor })
  );
  socket.on("sendCanvasDataToServer", (data) => {
    const room = rooms[data.roomId] || publicRooms[data.roomId];
    const secretWord = room.currentWord.replace(/[^-\s]/g, "_");
    const dataForClient = {
      currentDrawer: room.currentDrawer,
      currentDrawerId: room.users[room.currentDrawerIndex].id,
      secretWord: secretWord,
      base64Image: data.base64Image,
      time: room.time,
      currentRound: room.currentRound,
      maxRounds: room.maxRounds,
    };
    io.to(data.id).emit("SendCanvasDataToClient", dataForClient);
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

    if (!room.users.length) {
      delete rooms[roomId];
    } else if (room.currentDrawer === playerId) {
      changeDrawer(roomId);
    }
  });

  socket.on("disconnect", () => {
    for (const roomId in { ...rooms, ...publicRooms }) {
      const isPublic = roomId in publicRooms;
      const room = isPublic ? publicRooms[roomId] : rooms[roomId];
      const userIndex = room.users.findIndex((user) => user.id === socket.id);

      if (userIndex !== -1) {
        const userData = room.users[userIndex];
        room.users.splice(userIndex, 1);
        io.to(roomId).emit("userDisconnected", userData);
        io.to(roomId).emit("updateUserList", room.users);

        if (!room.users.length) {
          if (isPublic) {
            delete publicRooms[roomId];
            ensurePublicRoomAvailable();
          } else {
            delete rooms[roomId];
          }
        } else if (room.currentDrawer === socket.id) {
          changeDrawer(roomId, isPublic);
        }
        break;
      }
    }
    ensurePublicRoomAvailable();
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  createPublicRoom();
});
