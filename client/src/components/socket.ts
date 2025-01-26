// socket.ts
import { io } from "socket.io-client";

const socket = io(
  "https://654d-2a0b-6204-4e3-1500-719c-d6be-8dad-6aa1.ngrok-free.app "
); // Replace with your server URL
// https://paint-game.onrender.com
// http://localhost:3000
// https://654d-2a0b-6204-4e3-1500-719c-d6be-8dad-6aa1.ngrok-free.app
export default socket;
