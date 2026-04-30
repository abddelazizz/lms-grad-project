import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as chatService from "../services/chatService.js";

const onlineUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || "https://learn.evolvesight.com",
        "http://localhost:5173",
        "http://localhost:3000",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

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

  io.on("connection", (socket) => {
    const userId = socket.user.user_id;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    socket.join(`user_${userId}`);

    io.emit("online_status", {
      userId,
      isOnline: true,
    });

    // ─── Join a conversation room ────────────────────────────
    socket.on("join_conversation", async (data) => {
      try {
        const { conversationId } = data;
        const conversation = await chatService.verifyParticipant(conversationId, userId);
        if (!conversation) {
          socket.emit("error", { message: "Not a participant in this conversation" });
          return;
        }
        socket.join(`conversation_${conversationId}`);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ─── Leave a conversation room ───────────────────────────
    socket.on("leave_conversation", (data) => {
      const { conversationId } = data;
      socket.leave(`conversation_${conversationId}`);
    });

    // ─── Send a message ─────────────────────────────────────
    socket.on("send_message", async (data) => {
      try {
        const { conversationId, content } = data;

        if (!conversationId || !content || typeof content !== "string" || !content.trim()) {
          socket.emit("error", { message: "conversationId and content are required" });
          return;
        }

        if (content.length > 2000) {
          socket.emit("error", { message: "Message content exceeds 2000 characters" });
          return;
        }

        const conversation = await chatService.verifyParticipant(conversationId, userId);
        if (!conversation) {
          socket.emit("error", { message: "Not a participant in this conversation" });
          return;
        }

        const savedMessage = await chatService.saveMessage(conversationId, userId, content.trim());

        const messagePayload = {
          message_id: savedMessage.message_id,
          conversation_id: conversationId,
          sender_id: savedMessage.sender_id,
          sender: savedMessage.sender,
          content: savedMessage.content,
          is_read: savedMessage.is_read,
          created_at: savedMessage.created_at,
        };

        io.to(`conversation_${conversationId}`).emit("new_message", messagePayload);

        const otherUserId =
          conversation.student_id === userId
            ? conversation.instructor_id
            : conversation.student_id;

        const updatedConversation = await chatService.getConversationById(conversationId);
        const otherUser =
          updatedConversation.student_id === otherUserId
            ? updatedConversation.student?.user
            : updatedConversation.instructor?.user;

        const conversationPayload = {
          conversation_id: conversationId,
          lastMessage: { content: savedMessage.content, created_at: savedMessage.created_at, sender_id: savedMessage.sender_id },
          otherUser,
        };

        io.to(`user_${otherUserId}`).emit("conversation_updated", conversationPayload);
      } catch (err) {
        socket.emit("error", { message: err.message || "Failed to send message" });
      }
    });

    // ─── Typing indicator ────────────────────────────────────
    socket.on("typing", async (data) => {
      try {
        const { conversationId } = data;
        const conversation = await chatService.verifyParticipant(conversationId, userId);
        if (!conversation) return;

        socket.to(`conversation_${conversationId}`).emit("typing", {
          conversationId,
          userId,
        });
      } catch (err) {
        // silently ignore typing errors
      }
    });

    // ─── Stop typing indicator ────────────────────────────────
    socket.on("stop_typing", async (data) => {
      try {
        const { conversationId } = data;
        const conversation = await chatService.verifyParticipant(conversationId, userId);
        if (!conversation) return;

        socket.to(`conversation_${conversationId}`).emit("stop_typing", {
          conversationId,
          userId,
        });
      } catch (err) {
        // silently ignore typing errors
      }
    });

    // ─── Mark messages as read ───────────────────────────────
    socket.on("mark_read", async (data) => {
      try {
        const { conversationId } = data;
        const updatedCount = await chatService.markAsRead(conversationId, userId);

        if (updatedCount > 0) {
          io.to(`conversation_${conversationId}`).emit("messages_read", {
            conversationId,
            readBy: userId,
            count: updatedCount,
          });
        }
      } catch (err) {
        socket.emit("error", { message: err.message || "Failed to mark as read" });
      }
    });

    // ─── Disconnect ──────────────────────────────────────────
    socket.on("disconnect", () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit("online_status", {
            userId,
            isOnline: false,
          });
        }
      }
    });
  });

  return io;
};

export { onlineUsers };
export default initializeSocket;