// socket.ts
import { io } from "socket.io-client";

const socket = io("https://xelovniki.zapto.org", {
  transports: ["websocket"], // Force WebSocket transport
  secure: true, // Use HTTPS
  reconnection: true,
  reconnectionAttempts: 5, // Number of retry attempts
  reconnectionDelay: 1000, // Delay in ms between retries
});
console.log("socket", socket);
//https://xelovniki.zapto.org
// http://195.238.122.103:3000
// https://paint-game.onrender.com
// http://localhost:3000
// https://654d-2a0b-6204-4e3-1500-719c-d6be-8dad-6aa1.ngrok-free.app
export default socket;
