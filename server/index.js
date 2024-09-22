const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const app = express();
app.options("*", cors());
const server = http.createServer(app);
const ActiveRooms = [];
const rooms = {};
const words = require("./words");
const { log } = require("console");

// Enable CORS
const DEFAULT_SCORE = 10;
app.use(
  cors({
    origin: "*", // Allow any origin
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow any origin
    methods: ["GET", "POST"],
    credentials: false,
  },
});

// Serve static files or API routes here
app.use(express.static("public"));

function calculateScore(maxTime, timeOfGuessing) {
  const DEFAULT_SCORE = 10; //default score
  let multiplayer = 10;

  // If the guess is within the first 10% of the time, return the max score
  if (timeOfGuessing >= maxTime * 0.9) {
    return DEFAULT_SCORE * multiplayer;
  } else {
    let timeSpentRatio = (maxTime - timeOfGuessing) / maxTime;
    multiplayer = Math.floor(9 - timeSpentRatio * 8); // Linear gradient from 9 to 1, floored
    return DEFAULT_SCORE * multiplayer;
  }
}
io.on("connection", (socket) => {
  console.log("we up");

  // new join room without room_check
  socket.on("join_room", ({ roomId, name }) => {
    console.log("someone joined room");
    console.log(roomId, name);

    const room = rooms[roomId];
    // console.log(rooms);

    if (!room) {
      console.log("Room does not exist.");

      socket.emit("roomError", { error: "Room does not exist." });
      return;
    }

    if (Object.keys(room.users).length >= room.maxPlayers) {
      console.log("Room is full.");

      socket.emit("roomError", { error: "Room is full." });
      return;
    }
    const userId = uuidv4();

    const userData = {
      id: userId,
      name,
      roomName: room.name,
      roomId: roomId,
      score: 0,
    };
    room.users[socket.id] = userData;

    socket.join(roomId);

    io.to(roomId).emit("updateUserList", Object.values(room.users));

    io.to(roomId).emit("userJoined", userData);
  });
  socket.on("skipTurn", ({ roomId }) => {
    changeDrawer(roomId);
  });
  socket.on("create_room", (data) => {
    console.log("shot was created", data);

    const { name, id, maxPlayers, time } = data;
    // console.log(data);

    if (rooms[id]) {
      socket.emit("roomError", { error: "Room ID already exists." });
      return;
    }

    rooms[id] = {
      name,
      maxPlayers,
      users: {},
      time,
    };

    socket.emit("roomCreated", { id, name, maxPlayers, time });
    // console.log(rooms);
  });

  socket.on("startGame", ({ roomId }) => {
    console.log(roomId, "game start was emited");
    startTurnTimer(roomId);

    const room = rooms[roomId];

    if (!room) return;

    room.currentDrawerIndex = 0; // Start with the first player
    room.currentDrawer = Object.keys(room.users)[room.currentDrawerIndex];

    room.currentWord = selectRandomWord(); // Select a random word from the array
    io.to(room.currentDrawer).emit("newWord", room.currentWord); // Send the word only to the drawer
    const secretWord = room.currentWord.replace(/[^-\s]/g, "_");
    // console.log(secretWord);

    // const userNames = Object.values(room.users).map((user) => user.name);
    io.to(roomId).emit("newDrawer", {
      currentDrawer: room.users[room.currentDrawer]?.name,
      currentDrawerId: room.users[room.currentDrawer]?.id,
      secretWord: secretWord,
      time: room.time,
    });
    // console.log("zeita new drawer was emited");
    // console.log(room.users[room.currentDrawer]?.name);
    // console.log(room.users[room.currentDrawer]?.id);
    // console.log(secretWord);
    // console.log(room.time);

    io.to(roomId).emit("updateUserList", Object.values(room.users));

    io.to(roomId).emit("gameStarted", {
      currentDrawer: room.users[room.currentDrawer]?.name,
      currentDrawerId: room.users[room.currentDrawer].id,
    });
  });

  socket.on("guess", ({ roomId, guess, timeLeft }) => {
    const room = rooms[roomId];
    if (!room) return;
    // console.log(`guesser is ${room.users[socket.id].name}`);
    if (guess.toLowerCase() === room?.currentWord?.toLowerCase()) {
      io.to(roomId).emit("correctGuess", {
        guesser: room.users[socket.id]?.name,
        guesserId: room.users[socket.id].id,
      });

      if (!room.users[socket.id].hasGuessed) {
        io.to(roomId).emit("message", {
          message: `${room.users[socket.id]?.name}-მ გამოიცნო`,
          userName: "game",
        });
      }

      room.users[socket.id].hasGuessed = true;
      let score = calculateScore(room.time, timeLeft);
      console.log("correct guessshi miviget score funqciidan" + score);

      room.users[socket.id].score += score;
      room.users[room.currentDrawer].score += Math.floor(0.2 * score);
      io.to(roomId).emit("updateUserList", Object.values(room.users));

      // changeDrawer(roomId); // Move to the next drawer if the guess is correct
      console.log(room.currentDrawer);
      console.log(socket.id);

      io.to(socket.id).emit("conffeti", {
        message: "Correct!",
      });

      // Check if all users have guessed

      const usersWhoGuessed = Object.values(room.users).filter(
        (user) => user.hasGuessed
      ).length;

      if (usersWhoGuessed === Object.keys(room.users).length - 1) {
        changeDrawer(roomId);
        Object.values(room.users).forEach((user) => {
          user.hasGuessed = false;
        });
        io.to(roomId).emit("allGuessed");
      }
    } else {
      io.to(roomId).emit("incorrectGuess", {
        guesser: room.users[socket.id].name,
        guess,
      });
    }
  });
  socket.on("message", (data) => {
    const { roomId, message, userName } = data;
    if (message == rooms[roomId]?.currentWord) {
      return;
    } else {
      io.to(roomId).emit("message", { message, userName });
    }
  });
  socket.on("canvas", (canvas) => {
    // console.log("server recived canvas message and emited");

    const { col, row, roomId } = canvas;
    io.to(roomId).emit("canvas", { col, row });
  });
  socket.on("draw", (data) => {
    const { roomId, x0, y0, x1, y1, color } = data;
    // console.log(data);

    // socket.broadcast.emit("draw", data);

    io.to(roomId).emit("draw", { x0, y0, x1, y1, color });
  });
  socket.on("undo", (data) => {
    const { newHistory, roomId } = data;
    // Broadcast the undo event to all other clients
    console.log("recived undo");

    io.to(roomId).emit("undo", newHistory);
    console.log("emited undo");
  });
  socket.on("lineWidthChange", (data) => {
    // console.log("line width changed to", data);

    const { newLineWidth, roomId } = data;
    io.to(roomId).emit("newLineWidth", { newLineWidth });
  });
  socket.on("clear", (roomId) => {
    io.to(roomId).emit("clear"); // Broadcast clear event
  });
  socket.on("erace", (data) => {
    const { roomId, pixel } = data;
    io.to(roomId).emit("erace", { pixel });
  });
  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      if (rooms[roomId].users[socket.id]) {
        const userData = rooms[roomId].users[socket.id];
        delete rooms[roomId].users[socket.id];
        io.to(roomId).emit("userDisconnected", userData);

        io.to(roomId).emit(
          "updateUserList",
          Object.values(rooms[roomId].users)
        );

        // Remove the room if empty
        if (Object.keys(rooms[roomId].users).length === 0) {
          console.log("Room is empty, removing it");

          delete rooms[roomId];
        }
        break;
      }
    }
  });
});
function selectRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}
function changeDrawer(roomId) {
  const room = rooms[roomId];

  if (!room) return;

  room.currentDrawerIndex =
    (room.currentDrawerIndex + 1) % Object.keys(room.users).length;
  room.currentDrawer = Object.keys(room.users)[room.currentDrawerIndex];

  // Select a new word for the new drawer
  room.currentWord = selectRandomWord(); // Implement this function to select a word
  io.to(room.currentDrawer).emit("newWord", room.currentWord); // Send the word only to the drawer
  // console.log(room.currentDrawer);
  // Object.values(room.users).every((user) => (user.hasGuessed = false));
  const secretWord = room.currentWord.replace(/[^-\s]/g, "_");
  // console.log(secretWord);

  io.to(roomId).emit("newDrawer", {
    currentDrawer: room.users[room.currentDrawer]?.name,
    currentDrawerId: room.users[room.currentDrawer]?.id,
    secretWord: secretWord,
    time: room.time,
  });
  // console.log("qveita new drawer was emited");
  // console.log(room.users[room.currentDrawer]?.name);
  // console.log(room.users[room.currentDrawer]?.id);
  // console.log(secretWord);
  // console.log(room.time);
  startTurnTimer(roomId);
}

function startTurnTimer(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  clearTimeout(room.turnTimer);
  const timeoutDuration = room.time * 1000;
  // console.log(timeoutDuration);

  room.turnTimer = setTimeout(() => {
    changeDrawer(roomId);
  }, timeoutDuration);
}
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
