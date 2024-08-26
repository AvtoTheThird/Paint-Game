// socket.ts
import { io } from "socket.io-client";

const socket = io("https://paint-game.onrender.com"); // Replace with your server URL
// https://paint-game.onrender.com
export default socket;
