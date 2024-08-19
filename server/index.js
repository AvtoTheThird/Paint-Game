const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { log } = require("console");
const words = ["one", "two"];
// import { Room } from "./classes";
const app = express();
const server = http.createServer(app);
const ActiveRooms = [];
const rooms = {};
class Room {
  constructor(name, id, owner, maxPlayers) {
    this.name = name;
    this.id = id;
    this.owner = owner;
    this.maxPlayers = maxPlayers;
    this.players = [];
  }
  addPlayer = (player) => {
    this.players.push(player);
  };
}

// Enable CORS

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
    credentials: true,
  },
});

// Serve static files or API routes here
app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("we up");

  // new join room without room_check
  socket.on("join_room", ({ roomId, name }) => {
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
    };
    room.users[socket.id] = userData;

    socket.join(roomId);

    io.to(roomId).emit("userJoined", userData);
  });
  //old join room where we checked in a major ohio L way
  // socket.on("check_room", (data) => {
  //   const { roomId, userName } = data;
  //   console.log(ActiveRooms);

  //   const existingRoom = ActiveRooms.find((room) => room.id === roomId);
  //   if (existingRoom) {
  //     // console.log(`Room with id ${roomId} already exists, joining that room`);

  //     if (existingRoom.players.length < existingRoom.maxPlayers) {
  //       socket.join(roomId);
  //       existingRoom.addPlayer(userName);
  //       // console.log(`User joined room: ${roomId}`);
  //       socket.emit("room_exist", {
  //         code: 1,
  //         message: `Room with id ${roomId} exist... joining`,
  //         name: existingRoom.name,
  //       });
  //     } else {
  //       socket.emit("room_not_exist", {
  //         code: 0,
  //         message: `Room with id ${roomId} is full`,
  //       });
  //     }

  //     // You can add additional logic here, such as joining the existing room
  //   } else {
  //     // console.log(`Room with id ${roomId} does not exist, cant join`);
  //     // You can add logic here to handle the case when the room doesn't exist
  //     socket.emit("room_not_exist", {
  //       code: 0,
  //       message: `Room with id ${roomId} does not exist`,
  //     });
  //   }
  // });
  // idk what dis iz
  // socket.on("join_room", (roomId) => {
  //   socket.join(roomId);
  //   console.log(`User joined room: ${roomId}`);
  // });

  // old room create
  // socket.on("create_room", (data) => {
  //   const { roomName, id, owner, maxPlayers } = data;
  //   const room = new Room(roomName, id, owner, maxPlayers);
  //   // console.log(roomName, id, owner, maxPlayers);

  //   ActiveRooms.push(room);
  //   io.to(id).emit("room_created", room);
  // });
  socket.on("create_room", (data) => {
    const { name, id, maxPlayers } = data;
    // console.log(data);

    if (rooms[id]) {
      socket.emit("roomError", { error: "Room ID already exists." });
      return;
    }

    rooms[id] = {
      name,
      maxPlayers,
      users: {},
    };

    socket.emit("roomCreated", { id, name, maxPlayers });
    // console.log(rooms);
  });

  socket.on("startGame", ({ roomId }) => {
    // console.log(roomId, "aaaaa");

    const room = rooms[roomId];

    if (!room) return;

    room.currentDrawerIndex = 0; // Start with the first player
    room.currentDrawer = Object.keys(room.users)[room.currentDrawerIndex];

    room.currentWord = selectRandomWord(); // Select a random word from the array

    io.to(room.currentDrawer).emit("newWord", room.currentWord); // Send the word only to the drawer
    const userNames = Object.values(room.users).map((user) => user.name);

    io.to(roomId).emit("updateUserList", userNames);
    io.to(roomId).emit("gameStarted", {
      currentDrawer: room.users[room.currentDrawer].name,
      currentDrawerId: room.users[room.currentDrawer].id,
    });
  });

  socket.on("guess", ({ roomId, guess }) => {
    const room = rooms[roomId];

    if (!room) return;

    // Check if the guess is correct (logic for correct guess goes here)
    // Assuming a correct guess, we move to the next drawer
    console.log(`guesser is ${room.users[socket.id].name}`);

    if (guess.toLowerCase() === room.currentWord.toLowerCase()) {
      io.to(roomId).emit("correctGuess", {
        guesser: room.users[socket.id].name,
      });
      changeDrawer(roomId); // Move to the next drawer if the guess is correct
    } else {
      io.to(roomId).emit("incorrectGuess", {
        guesser: room.users[socket.id].name,
        guess,
      });
    }

    // room.currentDrawerIndex =
    //   (room.currentDrawerIndex + 1) % Object.keys(room.users).length;
    // room.currentDrawer = Object.keys(room.users)[room.currentDrawerIndex];

    // io.to(roomId).emit("newDrawer", {
    //   currentDrawer: room.users[room.currentDrawer]?.name,
    //   currentDrawerId: room.users[room.currentDrawer]?.id,
    // });
  });
  socket.on("message", (data) => {
    const { roomId, message, userName } = data;
    io.to(roomId).emit("message", { message, userName });
  });
  socket.on("canvas", (canvas) => {
    // console.log("server recived canvas message and emited");

    const { col, row, roomId } = canvas;
    io.to(roomId).emit("canvas", { col, row });
  });
  socket.on("draw", (data) => {
    const { roomId, pixel, color } = data;
    io.to(roomId).emit("draw", { pixel, color });
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

        const userNames = Object.values(rooms[roomId].users).map(
          (user) => user.name
        );
        io.to(roomId).emit("updateUserList", userNames);

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
  const words = [
    "ძაღლი",
    "გუჯას არაყი",
    "სამხრეთ აზერბაიჯანი",
    "კუჭმაჭი",
    "მარტვილი",
    "გეპეი",
    "კომბინატი",
    "ჯოლოს ბოქსები",
    "რატის კრაისლერი",
  ];
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

  io.to(roomId).emit("newDrawer", {
    currentDrawer: room.users[room.currentDrawer].name,
  });

  startTurnTimer(roomId);
}
function startTurnTimer(roomId) {
  const room = rooms[roomId];

  if (!room) return;

  clearTimeout(room.turnTimer);

  room.turnTimer = setTimeout(() => {
    changeDrawer(roomId);
  }, 90000); // 90 seconds
}
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
