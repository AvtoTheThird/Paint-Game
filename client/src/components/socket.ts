// socket.ts
import { io } from "socket.io-client";

const socket = io("wss://51.21.219.17:3000", {
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
  setTimeout(() => {
    socket.connect();
  }, 1000);
});
let isConnected = false;

// More comprehensive event handlers
socket.on("connect", () => {
  console.log("Connected to server");
  isConnected = true;
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
  // You could notify the user here
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected from server:", reason);
  isConnected = false;

  // If the server disconnected us, try to reconnect
  if (reason === "io server disconnect") {
    socket.connect();
  }
  // Otherwise the socket will automatically try to reconnect
});

// Add a ping mechanism to detect zombie connections
setInterval(() => {
  if (isConnected) {
    const start = Date.now();

    // Send ping and measure round-trip time
    socket.emit("ping", null, () => {
      const latency = Date.now() - start;
      console.log(`Latency: ${latency}ms`);

      // If latency is extremely high, consider reconnecting
      if (latency > 5000) {
        console.warn("High latency detected, reconnecting...");
        socket.disconnect().connect();
      }
    });
  }
}, 30000); // Check every 30 seconds

// Helper method to check if socket is truly connected
const isReallyConnected = () => {
  return isConnected && socket.connected;
};
console.log("socket", socket);
//https://xelovniki.zapto.org
// http://195.238.122.103:3000
// https://paint-game.onrender.com
// http://localhost:3000
// https://654d-2a0b-6204-4e3-1500-719c-d6be-8dad-6aa1.ngrok-free.app
export default socket;
export { isReallyConnected };
