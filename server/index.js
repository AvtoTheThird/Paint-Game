const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(
  cors({
    origin: "*", // Allow any origin
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow any origin
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Serve static files or API routes here
app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on("message", (data) => {
    const { roomId, message, userName } = data;
    io.to(roomId).emit("message", { message, userName });
  });
  socket.on("canvas", (canvas) => {
    console.log("server recived canvas message and emited");

    const { col, row, roomId } = canvas;
    io.to(roomId).emit("canvas", { col, row });
  });
  socket.on("draw", (data) => {
    const { roomId, pixel, color } = data;
    io.to(roomId).emit("draw", { pixel, color });
  });
  socket.on("erace", (data) => {
    const { roomId, pixel } = data;
    io.to(roomId).emit("erace", { pixel });
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
