import catchAsync from "../utils/catchAsync.js";
import * as chatService from "../services/chatService.js";

export const createConversation = catchAsync(async (req, res) => {
  const { otherUserId } = req.body;
  const result = await chatService.createOrGetConversation(
    req.user.user_id,
    req.user.role,
    otherUserId
  );

  res.status(result.created ? 201 : 200).json({
    status: "success",
    data: {
      conversation: result.conversation,
      otherUser: result.otherUser,
      isNew: result.created,
    },
  });
});

export const getConversations = catchAsync(async (req, res) => {
  const conversations = await chatService.getConversations(
    req.user.user_id,
    req.user.role
  );

  res.status(200).json({
    status: "success",
    data: { conversations },
  });
});

export const getMessages = catchAsync(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;

  const result = await chatService.getMessages(id, req.user.user_id, page, limit);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const markAsRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updatedCount = await chatService.markAsRead(id, req.user.user_id);

  res.status(200).json({
    status: "success",
    data: { markedAsRead: updatedCount },
  });
});
