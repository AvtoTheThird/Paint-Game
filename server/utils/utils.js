const { getRoom, saveRoom, deleteRoom } = require("./redisHelpers");
const redisClient = require("./redisClient");
const words = require("../words");

const DEFAULT_SCORE = 10;

const getAvailablePublicRoom = async () => {
  try {
    const roomKeys = await redisClient.client.keys("room:public-*");

    for (const key of roomKeys) {
      const room = await redisClient.hgetall(key);

      if (!room) {
        console.log("Room data is empty or invalid:", key);
        continue;
      }

      if (room.users) {
        room.users = JSON.parse(room.users);
      } else {
        console.log("No users field in room:", key);
        continue;
      }

      room.maxPlayers = parseInt(room.maxPlayers, 10);

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
async function createRoom({ name, id, maxPlayers, time, maxRounds }) {
  const existingRoom = await getRoom(id);
  if (existingRoom) {
    return socket.emit("roomError", { error: "Room ID already exists." });
  }

  const roomData = {
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
    isPublic: false,
  };

  await saveRoom(id, roomData);
  socket.emit("roomCreated", { id, name, maxPlayers, time });
  return;
}
const selectRandomWord = () => words[Math.floor(Math.random() * words.length)];
redisClient.client.on("connect", () => {
  console.log("Redis is connected. Starting server...");
});
module.exports = {
  getAvailablePublicRoom,
  calculateScore,
  createRoom,
  selectRandomWord,
};
