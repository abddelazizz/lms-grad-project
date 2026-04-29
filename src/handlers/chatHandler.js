import catchAsync from "../utilis/catchAsync.js";
import * as chatService from "../services/chatService.js";

export const getHistory = catchAsync(async (req, res) => {
  const { otherUserId } = req.params;
  const history = await chatService.getChatHistory(req.user.user_id, otherUserId);

  res.status(200).json({
    status: "success",
    data: { history },
  });
});

export const getContacts = catchAsync(async (req, res) => {
  const contacts = await chatService.getChatContacts(req.user.user_id);

  res.status(200).json({
    status: "success",
    data: { contacts },
  });
});
