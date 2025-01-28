// socket.ts
import { io } from "socket.io-client";

const socket = io(
  "https://ddeb-2a0b-6204-4e3-1500-9d0c-2361-d688-1b33.ngrok-free.app",
  {
    transports: ["websocket"], // Force WebSocket transport
    secure: true, // Use HTTPS
  }
);
console.log("socket", socket);

// https://paint-game.onrender.com
// http://localhost:3000
// https://654d-2a0b-6204-4e3-1500-719c-d6be-8dad-6aa1.ngrok-free.app
export default socket;
