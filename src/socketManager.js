import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as chatService from "./services/chatService.js";

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL || "https://learn.evolvesight.com"],
      methods: ["GET", "POST"],
    },
  });

  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error("Authentication error: Invalid token"));
      socket.user = decoded;
      next();
    });
  });

  const onlineUsers = new Map(); // userId -> socketId

  io.on("connection", (socket) => {
    const userId = socket.user.user_id;
    onlineUsers.set(userId, socket.id);
    console.log(`User connected: ${userId} (${socket.id})`);

    // Join a private room for this user
    socket.join(`user_${userId}`);

    // Listen for private messages
    socket.on("send_message", async (data) => {
      const { receiverId, message } = data;
      
      // Save to DB
      const savedMsg = await chatService.saveMessage(userId, receiverId, message);

      // Emit to receiver if online
      io.to(`user_${receiverId}`).emit("receive_message", {
        message_id: savedMsg.message_id,
        sender_id: userId,
        receiver_id: receiverId,
        message: savedMsg.message,
        createdAt: savedMsg.createdAt,
      });

      // Also confirm back to sender (useful for UI updates)
      socket.emit("message_sent", savedMsg);
    });

    // Handle typing status
    socket.on("typing", (data) => {
      const { receiverId } = data;
      io.to(`user_${receiverId}`).emit("user_typing", { senderId: userId });
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

export default initializeSocket;
