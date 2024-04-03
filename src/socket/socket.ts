import { Server, Socket } from "socket.io";
import http from "http";
import express, { Application } from "express";

const app: Application = express();

const server: http.Server = http.createServer(app);
const io: Server = new Server(server, {
  cors: {
    origin: ["http://192.168.1.129:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

export const getReceiverSocketId = (receiverId: string): string | undefined => {
  return userSocketMap[receiverId];
};

const userSocketMap: { [key: string]: string } = {}; // {userId: socketId}

io.on("connection", (socket: Socket) => {
  console.log("a user connected", socket.id);

  const userId: string | undefined = socket.handshake.query.userId as string;
  if (userId !== undefined) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // socket.on() is used to listen to the events. can be used both on client and server side
  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    if (userId !== undefined) delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server };
