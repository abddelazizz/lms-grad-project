import { ChatMessage, User } from "../models/index.js";
import { Op } from "sequelize";

/**
 * Save a new chat message to DB
 */
export const saveMessage = async (senderId, receiverId, message) => {
  return await ChatMessage.create({
    sender_id: senderId,
    receiver_id: receiverId,
    message,
  });
};

/**
 * Fetch conversation history between two users
 */
export const getChatHistory = async (user1Id, user2Id) => {
  return await ChatMessage.findAll({
    where: {
      [Op.or]: [
        { sender_id: user1Id, receiver_id: user2Id },
        { sender_id: user2Id, receiver_id: user1Id },
      ],
    },
    order: [["createdAt", "ASC"]],
    include: [
      { model: User, as: "sender", attributes: ["user_id", "name", "picture"] },
      { model: User, as: "receiver", attributes: ["user_id", "name", "picture"] },
    ],
  });
};

/**
 * Get list of people the user has chatted with
 */
export const getChatContacts = async (userId) => {
  // Find all messages involving the user
  const messages = await ChatMessage.findAll({
    where: {
      [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
    },
    order: [["createdAt", "DESC"]],
  });

  const contactIds = new Set();
  messages.forEach((msg) => {
    if (msg.sender_id !== userId) contactIds.add(msg.sender_id);
    if (msg.receiver_id !== userId) contactIds.add(msg.receiver_id);
  });

  return await User.findAll({
    where: { user_id: Array.from(contactIds) },
    attributes: ["user_id", "name", "email", "picture", "role"],
  });
};
