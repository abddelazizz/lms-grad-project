import { Conversation, ChatMessage, User, Enrollment, Course, Student, Instructor } from "../models/index.js";
import { Op, Sequelize } from "sequelize";
import AppError from "../utils/AppError.js";

export const createOrGetConversation = async (userId, role, otherUserId) => {
  if (userId === otherUserId) {
    throw new AppError("Cannot start a conversation with yourself", 400);
  }

  const otherUser = await User.findByPk(otherUserId, { attributes: ["user_id", "role", "name", "picture"] });
  if (!otherUser) {
    throw new AppError("User not found", 404);
  }

  let studentId, instructorId;
  if (role === "student" && otherUser.role === "instructor") {
    studentId = userId;
    instructorId = otherUserId;
  } else if (role === "instructor" && otherUser.role === "student") {
    studentId = otherUserId;
    instructorId = userId;
  } else {
    throw new AppError("Conversations are only between students and instructors", 400);
  }

  const studentProfile = await Student.findByPk(studentId);
  const instructorProfile = await Instructor.findByPk(instructorId);
  if (!studentProfile || !instructorProfile) {
    throw new AppError("Student or instructor profile not found", 404);
  }

  const enrollment = await Enrollment.findOne({
    where: { student_id: studentId, status: "active" },
    include: [{ model: Course, where: { instructor_id: instructorId }, attributes: [] }],
  });
  if (!enrollment) {
    throw new AppError("You can only chat with instructors whose courses you are enrolled in", 403);
  }

  const [conversation, created] = await Conversation.findOrCreate({
    where: { student_id: studentId, instructor_id: instructorId },
    defaults: { student_id: studentId, instructor_id: instructorId },
  });

  const otherUserData = {
    user_id: otherUser.user_id,
    name: otherUser.name,
    picture: otherUser.picture,
    role: otherUser.role,
  };

  return { conversation, created, otherUser: otherUserData };
};

export const getConversations = async (userId, role) => {
  let whereClause;
  if (role === "student") {
    whereClause = { student_id: userId };
  } else if (role === "instructor") {
    whereClause = { instructor_id: userId };
  } else {
    throw new AppError("Only students and instructors can access conversations", 403);
  }

  const conversations = await Conversation.findAll({
    where: whereClause,
    order: [Sequelize.literal('last_message_at DESC NULLS LAST'), ["created_at", "DESC"]],
    include: [
      {
        model: Student,
        as: "student",
        include: [{ model: User, as: "user", attributes: ["user_id", "name", "picture", "role"] }],
      },
      {
        model: Instructor,
        as: "instructor",
        include: [{ model: User, as: "user", attributes: ["user_id", "name", "picture", "role"] }],
      },
    ],
  });

  const result = [];
  for (const conv of conversations) {
    const lastMessage = await ChatMessage.findOne({
      where: { conversation_id: conv.conversation_id },
      order: [["created_at", "DESC"]],
      attributes: ["content", "created_at", "sender_id"],
    });

    const unreadCount = await ChatMessage.count({
      where: {
        conversation_id: conv.conversation_id,
        sender_id: { [Op.ne]: userId },
        is_read: false,
      },
    });

    const otherUser =
      role === "student"
        ? conv.instructor?.user
        : conv.student?.user;

    result.push({
      conversation_id: conv.conversation_id,
      otherUser,
      lastMessage: lastMessage ? { content: lastMessage.content, created_at: lastMessage.created_at, sender_id: lastMessage.sender_id } : null,
      unreadCount,
      last_message_at: conv.last_message_at,
      created_at: conv.created_at,
    });
  }

  return result;
};

export const getMessages = async (conversationId, userId, page = 1, limit = 50) => {
  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  if (conversation.student_id !== userId && conversation.instructor_id !== userId) {
    throw new AppError("You are not a participant in this conversation", 403);
  }

  const offset = (page - 1) * limit;

  const { rows: messages, count: total } = await ChatMessage.findAndCountAll({
    where: { conversation_id: conversationId },
    order: [["created_at", "ASC"]],
    limit,
    offset,
    include: [{ model: User, as: "sender", attributes: ["user_id", "name", "picture"] }],
  });

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const markAsRead = async (conversationId, userId) => {
  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  if (conversation.student_id !== userId && conversation.instructor_id !== userId) {
    throw new AppError("You are not a participant in this conversation", 403);
  }

  const [updatedCount] = await ChatMessage.update(
    { is_read: true },
    {
      where: {
        conversation_id: conversationId,
        sender_id: { [Op.ne]: userId },
        is_read: false,
      },
    }
  );

  return updatedCount;
};

export const saveMessage = async (conversationId, senderId, content) => {
  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  if (conversation.student_id !== senderId && conversation.instructor_id !== senderId) {
    throw new AppError("You are not a participant in this conversation", 403);
  }

  const message = await ChatMessage.create({
    conversation_id: conversationId,
    sender_id: senderId,
    content,
  });

  await Conversation.update(
    { last_message_at: new Date() },
    { where: { conversation_id: conversationId } }
  );

  const savedMessage = await ChatMessage.findByPk(message.message_id, {
    include: [{ model: User, as: "sender", attributes: ["user_id", "name", "picture"] }],
  });

  return savedMessage;
};

export const verifyParticipant = async (conversationId, userId) => {
  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) return null;
  if (conversation.student_id !== userId && conversation.instructor_id !== userId) return null;
  return conversation;
};

export const getConversationById = async (conversationId) => {
  return await Conversation.findByPk(conversationId, {
    include: [
      { model: Student, as: "student", include: [{ model: User, as: "user", attributes: ["user_id", "name", "picture", "role"] }] },
      { model: Instructor, as: "instructor", include: [{ model: User, as: "user", attributes: ["user_id", "name", "picture", "role"] }] },
    ],
  });
};
