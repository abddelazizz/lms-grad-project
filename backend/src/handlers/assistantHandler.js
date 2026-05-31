import catchAsync from "../utils/catchAsync.js";
import * as assistantService from "../services/assistantService.js";

/**
 * POST /api/assistant/messages
 * Send a message to the AI teaching assistant.
 */
export const sendMessage = catchAsync(async (req, res) => {
  const { message } = req.body;
  const userId = req.user.user_id;

  const { reply } = await assistantService.sendMessage(userId, message);

  res.status(200).json({
    status: "success",
    data: { reply },
  });
});

/**
 * DELETE /api/assistant/history
 * Clear the assistant's conversation memory for the current user.
 */
export const clearHistory = catchAsync(async (req, res) => {
  const userId = req.user.user_id;

  await assistantService.clearHistory(userId);

  res.status(200).json({
    status: "success",
    message: "Assistant memory cleared successfully.",
  });
});
