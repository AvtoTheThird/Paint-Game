const express = require("express");
const http = require("http");
const cors = require("cors");
const redisClient = require("./utils/redisClient");
const words = require("./words");
// const { getAvailablePublicRoom, calculateScore } = require("./utils/utils.js");
const app = express();
const server = http.createServer(app);
const rooms = {};
const publicRooms = {};
let activeUsers = 0;
const DEFAULT_SCORE = 10;

app.use(cors({ origin: "*", methods: ["GET", "POST"], credentials: true }));
// const io = new Server(server, {
//   cors: { origin: "*",
//      methods: ["GET", "POST"], credentials: false },
// });
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.static("public"));

let totalReceivedBytes = 0;
let totalEmittedBytes = 0;
const selectRandomWord = () => words[Math.floor(Math.random() * words.length)];
redisClient.client.on("connect", () => {
  console.log("Redis is connected. Starting server...");
});

redisClient.client.on("error", (err) => {
  console.error("Redis connection error:", err);
});
const flushAllRedisData = async () => {
  try {
    await redisClient.client.flushAll(); // Delete all keys in Redis
    console.log("All Redis data has been wiped clean.");
  } catch (err) {
    console.error("Failed to flush Redis data:", err);
  }
};

const getRoom = async (roomId) => {
  const roomData = await redisClient.hgetall(`room:${roomId}`);

  if (!roomData || Object.keys(roomData).length === 0) return null;

  // Parse with proper type conversion
  return {
    name: roomData.name,
    maxPlayers: parseInt(roomData.maxPlayers, 10) || 8, // Fallback to default
    maxRounds: parseInt(roomData.maxRounds, 10) || 8,
    users: JSON.parse(roomData.users || "[]"),
    time: parseInt(roomData.time, 10) || 90,
    currentDrawerIndex: parseInt(roomData.currentDrawerIndex, 10) || 0,
    currentRound: parseInt(roomData.currentRound, 10) || 0,
    handsPlayed: parseInt(roomData.handsPlayed, 10) || 0,
    currentDrawer: roomData.currentDrawer || null,
    currentWord: roomData.currentWord || null,
    isGameStarted: roomData.isGameStarted === "true",
    isPublic: roomData.isPublic === "true",
  };
};

const saveRoom = async (roomId, roomData) => {
  try {
    await redisClient.hset(`room:${roomId}`, {
      maxPlayers: roomData.maxPlayers.toString(),
      maxRounds: roomData.maxRounds.toString(),
      users: JSON.stringify(roomData.users), // Convert array to string
      time: roomData.time.toString(),
      currentDrawerIndex: roomData.currentDrawerIndex.toString(),
      currentRound: roomData.currentRound.toString(),
      handsPlayed: roomData.handsPlayed.toString(),
      currentDrawer: roomData.currentDrawer
        ? roomData.currentDrawer.toString()
        : "", // Handle null
      currentWord: roomData.currentWord || "", // Handle null
      isGameStarted: roomData.isGameStarted.toString(),
      isPublic: roomData.isPublic.toString(),
    });
  } catch (error) {
    console.error(`Redis SET Error (Key: room:${roomId}):`, error);
  }
};

const deleteRoom = async (roomId) => {
  await redisClient.del(`room:${roomId}`);
};
const getAvailablePublicRoom = async () => {
  try {
    // Fetch all keys matching the pattern "room:public-*"
    const roomKeys = await redisClient.client.keys("room:public-*");
    // console.log("Room keys:", roomKeys);

    // Check each room to find one with available slots
    for (const key of roomKeys) {
      const room = await redisClient.hgetall(key);
      // console.log("Room data from Redis:", room);

      if (!room) {
        console.log("Room data is empty or invalid:", key);
        continue;
      }

      // Parse the users field (stored as a JSON string)
      if (room.users) {
        room.users = JSON.parse(room.users);
      } else {
        console.log("No users field in room:", key);
        continue;
      }

      // Ensure maxPlayers is a number
      room.maxPlayers = parseInt(room.maxPlayers, 10);

      // Check if the room has available slots
      if (room.users.length < room.maxPlayers) {
        console.log("Available room found:", key);
        return key.replace("room:", ""); // Return room ID without the "room:" prefix
      }
    }

    // If no available room, create a new one
    console.log("No available rooms found. Creating a new room...");
    return await createPublicRoom();
  } catch (err) {
    console.error("Error in getAvailablePublicRoom:", err);
    return null;
  }
};
const calculateScore = (maxTime, timeOfGuessing) => {
  return timeOfGuessing >= maxTime * 0.9
    ? DEFAULT_SCORE * 10
    : DEFAULT_SCORE *
        Math.floor(9 - ((maxTime - timeOfGuessing) / maxTime) * 8);
};
app.get("/allRooms", (req, res) => {
  res.json({ rooms, publicRooms });
});
app.get("/dataRate", (req, res) => {
  res.json({ totalReceivedBytes, totalEmittedBytes });
});
app.get("/activeUsers", (req, res) => {
  res.json({ activeUsers });
});

const createPublicRoom = async () => {
  const id = `public-${Date.now()}`;
  const roomData = {
    name: `Public Room ${id}`,
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
    isPublic: true,
  };

  await saveRoom(id, roomData);
  return id;
};

// const ensurePublicRoomAvailable = () => {
//   if (!Object.keys(publicRooms).length) createPublicRoom();
// };
const ensurePublicRoomAvailable = async () => {
  try {
    // Fetch all keys matching the pattern "room:public-*"
    const roomKeys = await redisClient.client.keys("room:public-*");

    // If no public rooms exist, create one
    if (roomKeys.length === 0) {
      await createPublicRoom();
    }
  } catch (err) {
    console.error("Error in ensurePublicRoomAvailable:", err);
  }
};
const changeDrawer = async (roomId) => {
  if (activeTimers.has(roomId)) {
    clearTimeout(activeTimers.get(roomId));
    activeTimers.delete(roomId);
  }
  const room = await getRoom(roomId);
  if (!room) return;

  const oldWord = room.currentWord;
  room.handsPlayed++;
  room.currentRound = Math.floor(room.handsPlayed / room.users.length);
  room.currentDrawerIndex = (room.currentDrawerIndex + 1) % room.users.length;
  room.currentDrawer = room.users[room.currentDrawerIndex]?.id;
  room.currentWord = selectRandomWord();

  room.users.map((user) => {
    user.hasGuessed = false;
  });

  await saveRoom(roomId, room);

  io.to(room.currentDrawer).emit("newWord", room.currentWord);
  const secretWord = room.currentWord.replace(/[^-\s]/g, "_");

  io.to(roomId).emit("handEnded", {
    currentDrawer: room.users[room.currentDrawerIndex]?.name,
    Word: oldWord,
  });

  setTimeout(async () => {
    io.to(roomId).emit("newDrawer", {
      currentDrawer: room.users[room.currentDrawerIndex]?.name,
      currentDrawerId: room.currentDrawer,
      secretWord: secretWord,
      time: room.time,
      currentRound: room.currentRound,
    });

    await startTurnTimer(roomId);
  }, 5000);
};
const startGame = async (roomId) => {
  const room = await getRoom(roomId);
  if (!room) return;

  room.currentRound = 0;
  room.handsPlayed = 0;
  room.isGameStarted = true;
  room.currentDrawerIndex = 0;
  room.currentDrawer = room.users[0]?.id;
  room.currentWord = selectRandomWord();

  await saveRoom(roomId, room);

  io.to(room.currentDrawer).emit("newWord", room.currentWord);
  const secretWord = room.currentWord.replace(/[^-\s]/g, "_");

  io.to(roomId).emit("updateUserList", room.users);
  // ================================NEEDS TO BE PROPERLY IMPLEMENTED, SETTIMEOUT IS A TEMPORARY SOLUTION================================
  setTimeout(() => {
    io.to(roomId).emit("gameStarted", {
      currentDrawer: room.users[0]?.name,
      currentDrawerId: room.currentDrawer,
      maxRounds: room.maxRounds,
      secretWord: secretWord,

      time: room.time,
      currentRound: room.currentRound,
    });
  }, 500);

  io.to(roomId).emit("newDrawer", {
    currentDrawer: room.users[0]?.name,
    currentDrawerId: room.currentDrawer,
    secretWord: secretWord,

    time: room.time,
    currentRound: room.currentRound,
  });
  await startTurnTimer(roomId);
};

const activeTimers = new Map();
const startTurnTimer = async (roomId, isPublic = false) => {
  try {
    const room = await getRoom(roomId);
    if (!room) return;

    if (room.currentRound >= room.maxRounds) {
      room.isGameStarted = false;
      await saveRoom(roomId, room);

      io.to(roomId).emit("MaxRoundsReached");
      room.users.map((user) => {
        user.hasGuessed = false;
        user.score = 0;
      });
      if (isPublic) {
        setTimeout(async () => {
          await startGame(roomId);
        }, 5000);
      }
      return;
    }

    // Clear existing timer if any
    if (activeTimers.has(roomId)) {
      clearTimeout(activeTimers.get(roomId));
      activeTimers.delete(roomId);
    }

    // Create new timer
    const timer = setTimeout(async () => {
      try {
        await changeDrawer(roomId, isPublic);
        activeTimers.delete(roomId);
      } catch (error) {
        console.error("Timer callback error:", error);
      }
    }, room.time * 1000);

    // Store timer reference
    activeTimers.set(roomId, timer);

    // Update room state without timer reference
    room.turnTimer = true; // Just mark that a timer is active
    await saveRoom(roomId, room);
  } catch (error) {
    console.error("startTurnTimer error:", error);
  }
};

const handleLateJoin = async (roomId, id) => {
  // console.log("gotta handleLateJoin");
  const room = await getRoom(roomId);

  if (room)
    io.to(room.currentDrawer).emit("requestCanvasDataFromClient", roomId, id);
};

io.on("connection", (socket) => {
  ensurePublicRoomAvailable();
  activeUsers++;
  io.emit("activeUsersUpdate", { activeUsers });
  socket.on("join_public_room", async ({ name, avatarID }) => {
    const roomId = await getAvailablePublicRoom();
    const room = await getRoom(roomId);

    const userData = {
      id: socket.id,
      name,
      roomId,
      score: 0,
      hasGuessed: false,
      avatarID,
    };

    room.users.push(userData);
    await saveRoom(roomId, room);

    socket.join(roomId);
    if (room.users.length >= 2 && !room.isGameStarted) await startGame(roomId);
    if (room.isGameStarted) await handleLateJoin(roomId, socket.id);
    setTimeout(() => io.to(roomId).emit("updateUserList", room.users), 500);

    io.to(roomId).emit("userJoined", userData);
    socket.emit("joined_public_room", {
      roomId,
      userId: socket.id,
      name,
    });
  });

  socket.on("create_room", async ({ id, maxPlayers, time, maxRounds }) => {
    const existingRoom = await getRoom(id);
    if (existingRoom) {
      return socket.emit("roomError", { error: "Room ID already exists." });
    }

    const roomData = {
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
      isPublic: false,
    };

    await saveRoom(id, roomData);
    socket.emit("roomCreated", { id, maxPlayers, time });
  });

  // Modified join_room handler
  socket.on("join_room", async ({ roomId, name, avatarID }) => {
    const room = await getRoom(roomId);

    if (!room) {
      return socket.emit("roomError", { error: "Room does not exist." });
    }

    if (room.users.length >= room.maxPlayers) {
      return socket.emit("roomError", { error: "Room is full." });
    }

    const userData = {
      id: socket.id,
      name,

      roomId,
      score: 0,
      hasGuessed: false,
      avatarID,
    };

    room.users.push(userData);

    await saveRoom(roomId, room);

    socket.join(roomId);
    if (room.isGameStarted) handleLateJoin(roomId, socket.id);

    setTimeout(() => io.to(roomId).emit("updateUserList", room.users), 500);
    io.to(roomId).emit("userJoined", userData);
  });

  socket.on("startGame", ({ roomId, isPublic = false }) =>
    startGame(roomId, isPublic)
  );

  socket.on("leaveRoom", async ({ roomId, userId }) => {
    const room = await getRoom(roomId);
    if (!room) return;

    const userIndex = room.users.findIndex((user) => user.id === userId);
    if (userIndex === -1) return;

    const [userData] = room.users.splice(userIndex, 1);
    await saveRoom(roomId, room);

    socket.leave(roomId);
    io.to(roomId).emit("userLeft", userData);
    io.to(roomId).emit("updateUserList", room.users);
    socket.emit("leftRoom", { roomId, success: true });

    if (room.users.length === 0) {
      await deleteRoom(roomId);
    } else if (room.currentDrawer === userId) {
      await changeDrawer(roomId);
    }
  });

  socket.on("message", ({ roomId, message, userName }) => {
    if (message !== rooms[roomId]?.currentWord) {
      io.to(roomId).emit("message", { message, userName });
    }
  });
  socket.on("guess", async ({ roomId, guess, timeLeft }) => {
    const room = await getRoom(roomId);
    if (!room) return;

    const guesser = room.users.find((user) => user.id === socket.id);
    if (!guesser) return;

    if (guess === room.currentWord) {
      io.to(roomId).emit("correctGuess", {
        guesser: guesser.name,
        guesserId: guesser.id,
        word: guess,
      });

      if (!guesser.hasGuessed) {
        io.to(roomId).emit("message", {
          message: `${guesser.name}-მ გამოიცნო`,
          userName: "game",
        });
      }

      guesser.hasGuessed = true;
      const score = calculateScore(room.time, timeLeft);
      guesser.score += score;

      const drawer = room.users.find((user) => user.id === room.currentDrawer);
      if (drawer) drawer.score += Math.floor(0.2 * score);

      await saveRoom(roomId, room);
      io.to(roomId).emit("updateUserList", room.users);

      const allGuessed = room.users.every(
        (user) => user.hasGuessed || user.id === room.currentDrawer
      );
      // console.log(room.users);

      if (allGuessed) {
        await changeDrawer(roomId);
        room.handsPlayed++;
        room.users.forEach((user) => (user.hasGuessed = false));
        io.to(roomId).emit("allGuessed");
      }
    } else {
      io.to(roomId).emit("message", {
        message: guess,
        userName: guesser.name,
      });
      // io.to(roomId).emit("incorrectGuess", { guesser: guesser.name, guess });
    }

    if (room.currentRound >= room.maxRounds) {
      if (room.isPublic) {
        room.currentRound = 0;
        room.handsPlayed = 0;
        room.users.forEach((user) => (user.score = 0));
        await saveRoom(roomId, room);
        io.to(roomId).emit("gameReset", {
          message: "Game has been reset. Starting a new game!",
        });
        await startGame(roomId);
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
  socket.on("skipTurn", async ({ roomId }) => await changeDrawer(roomId));
  socket.on("fill", ({ roomId, startX, startY, fillColor }) =>
    io.to(roomId).emit("fill", { startX, startY, fillColor })
  );
  socket.on("sendCanvasDataToServer", async ({ base64Image, id, roomId }) => {
    const room = await getRoom(roomId);

    const secretWord = room.currentWord.replace(/[^-\s]/g, "_");
    const dataForClient = {
      currentDrawer: room.currentDrawer,
      currentDrawerId: room.users[room.currentDrawerIndex].id,
      secretWord: secretWord,
      base64Image: base64Image,
      time: room.time,
      currentRound: room.currentRound,
      maxRounds: room.maxRounds,
    };

    io.to(id).emit("SendCanvasDataToClient", dataForClient);
  });
  socket.on("kickPlayer", async ({ roomId, playerId }) => {
    const room = await getRoom(roomId);
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
      await changeDrawer(roomId);
    }
  });

  socket.on("disconnect", async () => {
    activeUsers--;
    io.emit("activeUsersUpdate", { activeUsers });

    const allRoomsKeys = await redisClient.scan("room:*");
    for (const roomKey of allRoomsKeys) {
      const roomId = roomKey.replace("room:", "");
      const room = await getRoom(roomId);
      const userIndex = room.users.findIndex((user) => user.id === socket.id);

      if (userIndex !== -1) {
        const [userData] = room.users.splice(userIndex, 1);
        await saveRoom(roomId, room);

        io.to(roomId).emit("userDisconnected", userData);
        io.to(roomId).emit("updateUserList", room.users);

        if (room.users.length === 0) {
          await deleteRoom(roomId);
        } else if (room.currentDrawer === socket.id) {
          await changeDrawer(roomId);
        }
        break;
      }
    }
    await ensurePublicRoomAvailable();
  });
});

const PORT = 3000;
(async () => {
  await flushAllRedisData(); // Clean up Redis data
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    createPublicRoom(); // Create an initial public room
  });
})();
