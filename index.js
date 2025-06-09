const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + "/"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  const playerId = Math.floor(Math.random() * 100) + 1;
  console.log(`${playerId} connected`);

  socket.on("joined", (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId); // get room info- all room-info in room
    const numClients = room ? room.size : 0;

    //validating no. of players
    if (numClients < 2) {
      socket.join(roomId);
      socket.roomId = roomId;
      const color = numClients === 0 ? "white" : "black"; //first player will get white

      socket.emit("player", {
        playerId,
        players: numClients + 1,
        color,
        roomId,
      });

      // Notify other player in room
      socket.to(roomId).emit("message", `Player ${playerId} joined the room`); //only for existing player in the room

      console.log(`Player ${playerId} joined room ${roomId} as ${color}`);
    } else {
      socket.emit("full", roomId);
      console.log(`Room ${roomId} is full`);
    }

    socket.on("move", function (msg) {
      if (socket.roomId) {
        socket.to(socket.roomId).emit("move", msg); // ✅ ONLY TO OTHER PLAYER IN SAME ROOM
      }
    });

    socket.on("play", (msg) => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit("play", msg);
        console.log(`Player ${playerId} ready: ${msg}`);
      }
    });

    socket.on("disconnecting", () => {
      if (socket.roomId) {
        socket
          .to(socket.roomId)
          .emit("message", `Player ${playerId} disconnected`);
      }
    });

    socket.on("disconnect", () => {
      socket.roomId = null;
      console.log(`${playerId} disconnected`);
    });
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

/*socket.on("joined", (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const numClients = room ? room.size : 0;

    if (numClients < 2) {
        socket.join(roomId);
        socket.roomId = roomId; // ✅ Add this line

        const color = numClients === 0 ? "white" : "black";

        socket.emit("player", {
            playerId,
            players: numClients + 1,
            color,
            roomId,
        });

        socket.to(roomId).emit("message", `Player ${playerId} joined the room`);

        console.log(`Player ${playerId} joined room ${roomId} as ${color}`);
    } else {
        socket.emit("full", roomId);
        console.log(`Room ${roomId} is full`);
    }
});

socket.on('move', function (msg) {
    if (socket.roomId) {
        socket.to(socket.roomId).emit('move', msg); // ✅ Works now
    }
});
*/
