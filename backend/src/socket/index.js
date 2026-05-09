import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import redis from "../config/redis.js";
import * as chatService from "../services/chatService.js";
import { encryptMessage, decryptMessage } from "./encryption.js";
import { checkRateLimit, clearViolations } from "./rateLimit.js";

const onlineUsers = new Map();

const stripHtml = (str) => {
  if (typeof str !== "string") return str;
  return str.replace(/<[^>]*>/g, "").trim();
};

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || "https://learn.evolvesight.com",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const cacheKey = `user_cache:${decoded.user_id}`;
      let user = await redis.get(cacheKey);
      if (user) {
        user = JSON.parse(user);
      } else {
        user = await User.findByPk(decoded.user_id, {
          attributes: ["user_id", "role", "token_version"],
        });
        if (user) {
          const userData = user.toJSON();
          await redis.set(cacheKey, JSON.stringify(userData), "EX", 60);
          user = userData;
        }
      }

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      if (user.token_version !== decoded.token_version) {
        return next(new Error("Authentication error: Token revoked"));
      }

      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  const redisSubscriber = redis.duplicate();
  redisSubscriber.psubscribe("token_revoked:*").catch(() => {});
  redisSubscriber.on("pmessage", (pattern, channel, message) => {
    if (channel.startsWith("token_revoked:")) {
      const userId = channel.replace("token_revoked:", "");
      const userSockets = onlineUsers.get(Number(userId));
      if (userSockets) {
        for (const socketId of userSockets) {
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            socket.emit("token_revoked", { message: "Your session has been terminated. Please log in again." });
            socket.disconnect(true);
          }
        }
      }
    }
  });

  const getUserConversations = async (userId) => {
    const conversations = await chatService.getUserConversations(userId);
    return conversations || [];
  };

  io.on("connection", (socket) => {
    const userId = socket.user.user_id;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    socket.join(`user_${userId}`);

    (async () => {
      try {
        const conversations = await getUserConversations(userId);
        const participantIds = new Set();
        for (const conv of conversations) {
          if (conv.student_id) participantIds.add(conv.student_id);
          if (conv.instructor_id) participantIds.add(conv.instructor_id);
        }
        for (const pId of participantIds) {
          io.to(`user_${pId}`).emit("online_status", { userId, isOnline: true });
        }
      } catch {}
    })();

    // ─── Join a conversation room ────────────────────────────
    socket.on("join_conversation", async (data) => {
      try {
        const rateResult = await checkRateLimit(userId, "join_conversation");
        if (rateResult === "disconnect") {
          socket.disconnect(true);
          return;
        }
        if (!rateResult) {
          socket.emit("error", { message: "Rate limit exceeded. Slow down." });
          return;
        }

        const { conversationId } = data;
        if (!conversationId) {
          socket.emit("error", { message: "conversationId is required" });
          return;
        }

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
        const rateResult = await checkRateLimit(userId, "send_message");
        if (rateResult === "disconnect") {
          socket.disconnect(true);
          return;
        }
        if (!rateResult) {
          socket.emit("error", { message: "Rate limit exceeded. Slow down." });
          return;
        }

        const { conversationId, content } = data;

        if (!conversationId || !content || typeof content !== "string" || !content.trim()) {
          socket.emit("error", { message: "conversationId and content are required" });
          return;
        }

        const sanitizedContent = stripHtml(content);
        if (sanitizedContent.length > 2000) {
          socket.emit("error", { message: "Message content exceeds 2000 characters" });
          return;
        }

        const conversation = await chatService.verifyParticipant(conversationId, userId);
        if (!conversation) {
          socket.emit("error", { message: "Not a participant in this conversation" });
          return;
        }

        const savedMessage = await chatService.saveMessage(conversationId, userId, sanitizedContent);

        const encryptedContent = encryptMessage(sanitizedContent, conversationId);

        const messagePayload = {
          message_id: savedMessage.message_id,
          conversation_id: conversationId,
          sender_id: savedMessage.sender_id,
          sender: savedMessage.sender,
          content: sanitizedContent,
          encrypted_content: encryptedContent,
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
          lastMessage: { content: sanitizedContent, created_at: savedMessage.created_at, sender_id: savedMessage.sender_id },
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
        const rateResult = await checkRateLimit(userId, "typing");
        if (!rateResult) return;

        const { conversationId } = data;
        const conversation = await chatService.verifyParticipant(conversationId, userId);
        if (!conversation) return;

        socket.to(`conversation_${conversationId}`).emit("typing", {
          conversationId,
          userId,
        });
      } catch {}
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
      } catch {}
    });

    // ─── Mark messages as read ───────────────────────────────
    socket.on("mark_read", async (data) => {
      try {
        const rateResult = await checkRateLimit(userId, "mark_read");
        if (!rateResult) return;

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
    socket.on("disconnect", async () => {
      clearViolations(userId);
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);

          try {
            const conversations = await getUserConversations(userId);
            const participantIds = new Set();
            for (const conv of conversations) {
              if (conv.student_id) participantIds.add(conv.student_id);
              if (conv.instructor_id) participantIds.add(conv.instructor_id);
            }
            for (const pId of participantIds) {
              io.to(`user_${pId}`).emit("online_status", { userId, isOnline: false });
            }
          } catch {}
        }
      }
    });
  });

  return io;
};

export { onlineUsers };
export default initializeSocket;
