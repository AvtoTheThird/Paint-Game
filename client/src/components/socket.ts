// socket.ts
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
  // Consider adding logic here if specific actions are needed on explicit disconnects
  // The library handles automatic reconnection attempts.
});

// More comprehensive event handlers
socket.on("connect", () => {
  console.log("Connected to server");
  // isConnected = true; // Removed
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
  // You could notify the user here
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected from server:", reason);
  // isConnected = false; // Removed

  // If the server disconnected us, try to reconnect
  // Note: The library handles most reconnection logic automatically based on config.
  // Explicitly calling connect() might interfere or be redundant depending on the reason.
  // if (reason === "io server disconnect") {
  //   socket.connect(); 
  // }
});

console.log("socket", socket);
//https://xelovniki.zapto.org
// http://195.238.122.103:3000
// https://paint-game.onrender.com
// http://localhost:3000
// https://654d-2a0b-6204-4e3-1500-719c-d6be-8dad-6aa1.ngrok-free.app
export default socket;
// export { isReallyConnected }; // Removed export
