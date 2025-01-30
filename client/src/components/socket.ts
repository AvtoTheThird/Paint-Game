// socket.ts
import { io } from "socket.io-client";

const socket = io(
  "https://7d3f-2a0b-6204-4e3-1500-793c-1f22-3860-38a9.ngrok-free.app",
  {
    transports: ["websocket"], // Force WebSocket transport
    secure: true, // Use HTTPS
    reconnection: true,
    reconnectionAttempts: 5, // Number of retry attempts
    reconnectionDelay: 1000, // Delay in ms between retries
  }
);
console.log("socket", socket);

// https://paint-game.onrender.com
// http://localhost:3000
// https://654d-2a0b-6204-4e3-1500-719c-d6be-8dad-6aa1.ngrok-free.app
export default socket;
