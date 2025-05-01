const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const cors = require("cors");
const redisClient = require("./utils/redisClient");
const words = require("./words");
const adminRoutes = require('./admin/routes');
// const { getAvailablePublicRoom, calculateScore } = require("./utils/utils.js");
const app = express();

// Define paths for certificate files
const keyPath = '/etc/letsencrypt/live/api.khelovniki.com/privkey.pem';
const certPath = '/etc/letsencrypt/live/api.khelovniki.com/fullchain.pem';

let server;

// Check if certificate files exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  // Production environment (or local with certs): Use HTTPS
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
  server = https.createServer(options, app);
  console.log("Starting server with HTTPS.");
} else {
  // Development environment (or local without certs): Use HTTP
  server = http.createServer(app);
  console.log("Certificate files not found. Starting server with HTTP.");
}

const rooms = {};
let activeUsers = 0;
const DEFAULT_SCORE = 10;
let socketConnectionCount = 0;
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
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

app.use(express.static("public"));

// Add Redis client to request object for admin routes
app.use((req, res, next) => {
  req.redisClient = redisClient.client;
  next();
});

// Add io to app for admin routes
app.set('io', io);

// Mount admin routes
app.use('/hospital', adminRoutes);

let totalOutgoing = 0;
let totalIncoming = 0;
const selectRandomWord = () => words[Math.floor(Math.random() * words.length)];
redisClient.client.on("connect", () => {
  console.log("Redis is connected. Starting server...");
});

redisClient.client.on("error", (err) => {
  console.error("Redis connection error:", err);
});

// --- BEGIN: Redis Lock Implementation ---
const LOCK_TIMEOUT_SECONDS = 10; // Time in seconds before a lock automatically expires
const MAX_LOCK_RETRIES = 3; // Maximum number of times to retry acquiring a lock
const LOCK_RETRY_DELAY = 1000; // Delay between lock retries in milliseconds

/**
 * Attempts to acquire a lock for a specific room ID.
 * @param {string} roomId The ID of the room to lock.
 * @returns {Promise<boolean>} True if the lock was acquired, false otherwise.
 */
const acquireLock = async (roomId, retries = MAX_LOCK_RETRIES) => {
  const lockKey = `lock:room:${roomId}`;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // SET key value NX EX seconds
      // NX -- Only set the key if it does not already exist.
      // EX seconds -- Set the specified expire time, in seconds.
      const result = await redisClient.client.set(lockKey, 'locked', {
        NX: true,       // Only set if the key doesn't exist
        EX: LOCK_TIMEOUT_SECONDS // Set an automatic expiration
      });
      
      // SET with NX returns 'OK' on success, null if the key already exists
      if (result === 'OK') {
        return true;
      }
      
      // If we didn't get the lock and have retries left, wait before trying again
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, LOCK_RETRY_DELAY));
      }
    } catch (error) {
      console.error(`Error acquiring lock for room ${roomId} (attempt ${attempt + 1}):`, error);
      // Only wait between retries if we have more attempts left
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, LOCK_RETRY_DELAY));
      }
    }
  }
  
  return false; // Lock acquisition failed after all retries
};

/**
 * Releases the lock for a specific room ID.
 * @param {string} roomId The ID of the room whose lock should be released.
 */
const releaseLock = async (roomId) => {
  const lockKey = `lock:room:${roomId}`;
  try {
    await redisClient.client.del(lockKey);
  } catch (error) {
    // Log error but don't prevent operation from potentially continuing
    // Releasing a non-existent lock is okay, but other errors should be logged.
    console.error(`Error releasing lock for room ${roomId}:`, error);
  }
};
// --- END: Redis Lock Implementation ---

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

  try {
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
  } catch (error) {
    console.log(error);
  }
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
  try {
    await redisClient.del(`room:${roomId}`);
  } catch (error) {
    console.log("error deleting room", error);
  }
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
// Add this endpoint with other routes (around line 78)
app.get("/activeRooms", async (req, res) => {
  try {
    // Get all room keys from Redis
    const roomKeys = await redisClient.client.keys("room:*");

    // Fetch and parse data for each room
    const activeRooms = [];
    for (const key of roomKeys) {
      const roomId = key.replace("room:", "");
      const room = await getRoom(roomId);
      if (room) {
        activeRooms.push({
          id: roomId,
          name: room.name,
          players: room.users.length,
          maxPlayers: room.maxPlayers,
          isPublic: room.isPublic,
          isGameStarted: room.isGameStarted,
          currentRound: room.currentRound,
          maxRounds: room.maxRounds,
        });
      }
    }

    res.json({
      activeUsers,
      socketConnectionCount,
      success: true,
      rooms: activeRooms,
    });
  } catch (err) {
    console.error("Error fetching active rooms:", err);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve rooms",
    });
  }
});
app.get("/dataRate", (req, res) => {
  res.json({ totalOutgoing, totalIncoming });
});
app.get("/activeUsers", (req, res) => {
  res.json({ activeUsers });
});

const createPublicRoom = async () => {
  try {
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
  } catch (error) {
    console.log("error creating public room", error);
  }
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
  // Attempt to acquire the lock before proceeding with retries
  if (!(await acquireLock(roomId))) {
    console.warn(`[changeDrawer] Could not acquire lock for room ${roomId} after all retries. Aborting operation.`);
    io.to(roomId).emit('gameError', { message: 'Failed to change drawer. Please try again.' });
    return;
  }

  let room;
  let nextTurnTimer;
  try {
    room = await getRoom(roomId);
    // If room doesn't exist (e.g., deleted between lock acquisition and getRoom), exit.
    if (!room) {
      console.log(`[changeDrawer] Room ${roomId} not found.`);
      return; // Lock will be released in finally block
    }

    // Ensure there are users left in the room
    if (room.users.length === 0) {
      console.log(`[changeDrawer] Room ${roomId} is empty. Deleting room instead of changing drawer.`);
      await deleteRoom(roomId);
      return; // Lock will be released in finally block
    }

    const oldWord = room.currentWord; // Capture state BEFORE modification
    const oldDrawerName = room.users[room.currentDrawerIndex]?.name;

    // Modify room state
    room.handsPlayed++;
    room.currentRound = Math.floor(room.handsPlayed / room.users.length);
    room.currentDrawerIndex = (room.currentDrawerIndex + 1) % room.users.length;
    room.currentDrawer = room.users[room.currentDrawerIndex]?.id;
    room.currentWord = selectRandomWord();
    room.users.forEach((user) => { user.hasGuessed = false; });

    // Save the updated state
    await saveRoom(roomId, room);

    // Release the lock before the long delay operations
    await releaseLock(roomId);

    // Emit events AFTER state is saved
    // Emit new word ONLY to the new drawer
    if (room.currentDrawer) {
      io.to(room.currentDrawer).emit("newWord", room.currentWord);
    }

    const secretWord = room.currentWord.replace(/[^-\s]/g, "_");

    // Emit handEnded to the whole room with the OLD drawer/word info
    io.to(roomId).emit("handEnded", {
      currentDrawer: oldDrawerName || 'Someone',
      Word: oldWord,
    });

    // Schedule the start of the next turn
    nextTurnTimer = setTimeout(async () => {
      // Acquire a new lock for the delayed operations
      if (!(await acquireLock(roomId))) {
        console.error(`[changeDrawer] Failed to acquire lock for delayed operations in room ${roomId}`);
        io.to(roomId).emit('gameError', { message: 'Failed to start next turn. Please try again.' });
        return;
      }

      try {
        // Re-fetch room state as it might have changed during the delay
        const updatedRoom = await getRoom(roomId);
        if (!updatedRoom) {
          console.log(`[changeDrawer] Room ${roomId} not found during delayed operations`);
          return;
        }

        const newDrawerUser = updatedRoom.users[updatedRoom.currentDrawerIndex];
        io.to(roomId).emit("newDrawer", {
          currentDrawer: newDrawerUser?.name,
          currentDrawerId: updatedRoom.currentDrawer,
          secretWord: secretWord,
          time: updatedRoom.time,
          currentRound: updatedRoom.currentRound,
        });

        await startTurnTimer(roomId);
      } catch (error) {
        console.error(`[changeDrawer] Error in delayed operations for room ${roomId}:`, error);
        io.to(roomId).emit('gameError', { message: 'An error occurred while starting the next turn.' });
      } finally {
        await releaseLock(roomId);
      }
    }, 5000);

  } catch (error) {
    console.error(`[changeDrawer] Error processing room ${roomId}:`, error);
    io.to(roomId).emit('gameError', { message: 'An error occurred while changing drawer.' });
  } finally {
    if (nextTurnTimer) {
      // Store the timer reference somewhere if you need to clear it later
      // e.g., when the game ends or room is deleted
      room.nextTurnTimer = nextTurnTimer;
    }
  }
};
const startGame = async (roomId) => {
  // First acquire the lock
  if (!(await acquireLock(roomId))) {
    console.warn(`[startGame] Could not acquire lock for room ${roomId}`);
    io.to(roomId).emit('gameError', { message: 'Failed to start game. Please try again.' });
    return;
  }

  try {
    // Get fresh room data after acquiring lock
    const room = await getRoom(roomId);
    if (!room) {
      console.warn(`[startGame] Room ${roomId} not found after acquiring lock`);
      io.to(roomId).emit('gameError', { message: 'Game room not found.' });
      return;
    }

    // Validate room state
    if (room.isGameStarted) {
      console.warn(`[startGame] Room ${roomId} game already started`);
      io.to(roomId).emit('gameError', { message: 'Game already in progress.' });
      return;
    }

    if (!room.users || room.users.length < 2) {
      console.warn(`[startGame] Room ${roomId} has insufficient players`);
      io.to(roomId).emit('gameError', { message: 'Not enough players to start game.' });
      return;
    }

    // Initialize game state
    room.currentRound = 0;
    room.handsPlayed = 0;
    room.isGameStarted = true;
    room.currentDrawerIndex = 0;
    room.currentDrawer = room.users[0]?.id;
    room.currentWord = selectRandomWord();

    // Save updated room state
    await saveRoom(roomId, room);

    // Release lock before delayed operations
    await releaseLock(roomId);

    // Send initial game state to players
    io.to(room.currentDrawer).emit("newWord", room.currentWord);
    const secretWord = room.currentWord.replace(/[^-\s]/g, "_");

    const gameState = {
      currentDrawer: room.users[0]?.name,
      currentDrawerId: room.currentDrawer,
      maxRounds: room.maxRounds,
      secretWord: secretWord,
      time: room.time,
      currentRound: room.currentRound,
    };

    // Emit game started event with slight delay to ensure client is ready
    setTimeout(() => {
      io.to(roomId).emit("gameStarted", gameState);
    }, 500);

    // Emit new drawer event immediately
    io.to(roomId).emit("newDrawer", {
      ...gameState,
      secretWord: secretWord,
    });

    // Start the turn timer (it handles its own locking)
    await startTurnTimer(roomId);
  } catch (error) {
    console.error(`[startGame] Error starting game for room ${roomId}:`, error);
    io.to(roomId).emit('gameError', { message: 'Failed to start game due to an error.' });
  } finally {
    // Ensure lock is released in case of error
    await releaseLock(roomId);
  }
};

const startTurnTimer = async (roomId, isPublic = false) => {
  // Acquire lock for timer operations
  if (!(await acquireLock(roomId))) {
    console.error(`[startTurnTimer] Failed to acquire lock for room ${roomId}`);
    io.to(roomId).emit('gameError', { message: 'Failed to start turn timer. Please try again.' });
    return;
  }

  try {
    const room = await getRoom(roomId);
    if (!room) {
      console.log(`[startTurnTimer] Room ${roomId} not found`);
      return;
    }

    // Clear any existing timers from Redis
    await redisClient.client.del(`timer:${roomId}`);
    await redisClient.client.del(`nextTurnTimer:${roomId}`);

    // Calculate expiration time
    const expirationTime = Date.now() + (room.time * 1000);
    
    // Store timer info in Redis
    await redisClient.client.hset(`timer:${roomId}`, {
      expirationTime: expirationTime,
      roomId: roomId,
      type: 'turn'
    });

    // Set timer for the room
    const timer = setTimeout(async () => {
      try {
        // Remove timer key from Redis when it expires
        await redisClient.client.del(`timer:${roomId}`);
        
        // Timer expiration will trigger changeDrawer which has its own locking
        await changeDrawer(roomId);
      } catch (error) {
        console.error(`[startTurnTimer] Error in timer for room ${roomId}:`, error);
        io.to(roomId).emit('gameError', { message: 'An error occurred during turn change.' });
      }
    }, room.time * 1000);

    // Keep timer reference in memory but don't save it to Redis
    room.activeTimers = room.activeTimers || {};
    room.activeTimers[`timer:${roomId}`] = timer;

    // Save room state
    await saveRoom(roomId, room);

    // Start countdown for clients
    io.to(roomId).emit("startTimer", room.time);

    // Set up timer recovery on server restart
    await redisClient.client.set(
      `timerRecovery:${roomId}`,
      JSON.stringify({
        expirationTime,
        roomId,
        timeRemaining: room.time * 1000
      }),
      'EX',
      room.time + 5 // Add 5 seconds buffer
    );
  } catch (error) {
    console.error(`[startTurnTimer] Error for room ${roomId}:`, error);
    io.to(roomId).emit('gameError', { message: 'An error occurred while starting the timer.' });
  } finally {
    await releaseLock(roomId);
  }
};

// Timer recovery on server start
const recoverTimers = async () => {
  try {
    const timerKeys = await redisClient.client.keys('timerRecovery:*');
    
    for (const key of timerKeys) {
      const timerData = JSON.parse(await redisClient.client.get(key));
      const timeLeft = timerData.expirationTime - Date.now();
      
      if (timeLeft > 0) {
        const room = await getRoom(timerData.roomId);
        if (room && room.isGameStarted) {
          console.log(`[recoverTimers] Recovering timer for room ${timerData.roomId}, ${timeLeft}ms remaining`);
          
          // Update clients with new time
          io.to(timerData.roomId).emit('startTimer', Math.ceil(timeLeft / 1000));
          
          // Set new timer with remaining time
          const timer = setTimeout(async () => {
            await changeDrawer(timerData.roomId);
          }, timeLeft);
          
          // Store new timer reference
          room.activeTimers = room.activeTimers || {};
          room.activeTimers[`timer:${timerData.roomId}`] = timer;
          await saveRoom(timerData.roomId, room);
        }
      }
      // Clean up recovery data
      await redisClient.client.del(key);
    }
  } catch (error) {
    console.error('[recoverTimers] Error recovering timers:', error);
  }
};

// Call timer recovery on server start
recoverTimers();

// Handle Redis timer expiration
redisClient.on("timerExpired", async (roomId) => {
  try {
    await changeDrawer(roomId);
  } catch (error) {
    console.error("[timerExpired] Error handling timer expiration:", error);
  }
});

const handleLateJoin = async (roomId, id) => {
  // console.log("gotta handleLateJoin");
  try {
    const room = await getRoom(roomId);

    if (room)
      io.to(room.currentDrawer).emit("requestCanvasDataFromClient", roomId, id);
  } catch (error) {
    console.log("error while handling late join", error, roomId, id);
  }
};

io.on("connection", (socket) => {
  //TEST FOR DATA THROUGHTPUT
  // const originalEmit = socket.emit;

  // socket.use((packet, next) => {
  //   const size = Buffer.byteLength(JSON.stringify(packet));
  //   totalIncoming += size;
  //   console.log(
  //     `Incoming packet: ${size} bytes (Total: ${totalIncoming} bytes)`
  //   );
  //   next();
  // });
  // socket.emit = function (event, ...args) {
  //   // Create a packet array similar to what Socket.IO sends
  //   const packet = [event, ...args];
  //   const size = Buffer.byteLength(JSON.stringify(packet));
  //   totalOutgoing += size;
  //   console.log(
  //     `Outgoing packet: ${size} bytes (Total: ${totalOutgoing} bytes)`
  //   );

  //   // Call the original emit function
  //   originalEmit.apply(socket, [event, ...args]);
  // };
  socketConnectionCount++;
  ensurePublicRoomAvailable();
  activeUsers++;
  io.emit("activeUsersUpdate", { activeUsers });
  socket.on("join_public_room", async ({ name, avatarID }) => {
    try {
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
      if (room.users.length >= 2 && !room.isGameStarted)
        await startGame(roomId);
      if (room.isGameStarted) await handleLateJoin(roomId, socket.id);
      setTimeout(() => io.to(roomId).emit("updateUserList", room.users), 500);

      io.to(roomId).emit("userJoined", userData);
      socket.emit("joined_public_room", {
        roomId,
        userId: socket.id,
        name,
      });
    } catch (error) {
      console.log("error on join_public_room");
    }
  });

  socket.on("create_room", async ({ id, maxPlayers, time, maxRounds }) => {
    try {
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
    } catch (error) {
      console.log("error while create_room");
    }
  });

  // Modified join_room handler
  socket.on("join_room", async ({ roomId, name, avatarID }) => {
    try {
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
    } catch (error) {
      console.log("error while join_room", error);
    }
  });

  socket.on("startGame", ({ roomId, isPublic = false }) =>
    startGame(roomId, isPublic)
  );

  socket.on("leaveRoom", async ({ roomId, userId }) => {
    try {
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
    } catch (error) {
      console.log("error while leaveRoom");
    }
  });

  socket.on("message", ({ roomId, message, userName }) => {
    if (message !== rooms[roomId]?.currentWord) {
      io.to(roomId).emit("message", { message, userName });
    }
  });
  socket.on("guess", async ({ roomId, guess, timeLeft }) => {
    try {
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

        const drawer = room.users.find(
          (user) => user.id === room.currentDrawer
        );
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
    } catch (error) {
      console.log("error while guess", error);
    }
  });

  socket.on("draw", ({ roomId, x0, y0, x1, y1, color }) =>
    io.to(roomId).emit("draw", { x0, y0, x1, y1, color })
  );

  // Listen for drawEnd and broadcast it
  socket.on("drawEnd", ({ roomId }) => {
    socket.broadcast.to(roomId).emit("drawEnd");
  });

  socket.on("undo", ({ roomId }) => {
    // Just broadcast the signal, no data needed
    socket.broadcast.to(roomId).emit("undo");
    console.log("undo signal broadcasted");
  });
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
    try {
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
    } catch (error) {
      console.log("error on sendCanvasDataToServer", error);
    }
  });
  socket.on("kickPlayer", async ({ roomId, playerId }) => {
    try {
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
    } catch (error) {
      console.log("error while kickPlayer", error);
    }
  });
  socket.on("ping", (_, callback) => {
    callback(); // Just respond immediately
  });
  socket.on("disconnect", async (reason) => {
    try {
      console.log(`Socket ${socket.id} disconnected. Reason: ${reason}`);
      activeUsers--;
      io.emit("activeUsersUpdate", { activeUsers });

      // TODO: Improve efficiency: Store socket.id -> roomId mapping instead of scanning all rooms.
      const allRoomsKeys = await redisClient.client.keys("room:*"); // Note: KEYS can block Redis, consider SCAN for production
      let roomFound = false; // Flag to track if we found and processed the user's room

      for (const roomKey of allRoomsKeys) {
        const roomId = roomKey.replace("room:", "");
        const room = await getRoom(roomId);

        // Skip if room data couldn't be fetched (e.g., already deleted by another process)
        if (!room) {
           console.log(`Room ${roomId} not found during disconnect cleanup for socket ${socket.id}, possibly already deleted.`);
           continue;
        }

        const userIndex = room.users.findIndex((user) => user.id === socket.id);

        if (userIndex !== -1) {
          roomFound = true; // Mark that we found the room for this socket
          const wasDrawer = room.currentDrawer === socket.id; // Check if the disconnecting user was the drawer
          const [userData] = room.users.splice(userIndex, 1); // Remove the user

          // Now check if the room is empty *after* removing the user
          if (room.users.length === 0) {
            console.log(`Room ${roomId} is empty after user ${socket.id} disconnected. Deleting room.`);
            // Emit updates before deleting, so clients know the last user left
            io.to(roomId).emit("userDisconnected", userData);
            io.to(roomId).emit("updateUserList", room.users); // Send empty list
            await deleteRoom(roomId); // Delete the empty room
          } else {
            // Room is not empty, save the state with the user removed
            console.log(`User ${socket.id} disconnected from room ${roomId}. Saving updated room state.`);
            await saveRoom(roomId, room);
            io.to(roomId).emit("userDisconnected", userData); // Inform remaining users
            io.to(roomId).emit("updateUserList", room.users); // Send updated list

            // If the disconnected user was the drawer, change drawer *after* saving
            if (wasDrawer && room.isGameStarted) { // Only change drawer if game was in progress
              console.log(`User ${socket.id} was the drawer in room ${roomId}. Changing drawer.`);
              await changeDrawer(roomId);
            }
          }
          // Found the user and handled their departure, no need to check other rooms
          break;
        }
      }

      if (!roomFound) {
        console.log(`Socket ${socket.id} disconnected but was not found in any active room.`);
      }

      // ensurePublicRoomAvailable might be better placed elsewhere or re-evaluated for purpose.
      // Calling it here ensures one exists if the last public room was just deleted.
      await ensurePublicRoomAvailable();
    } catch (error) {
      // Log the specific error for better debugging
      console.error(`Error during disconnect handler for socket ${socket.id}:`, error);
    }
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
