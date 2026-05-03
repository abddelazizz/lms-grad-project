import catchAsync from "../utilis/catchAsync.js";
import * as notificationService from "../services/notificationService.js";

// ─── API 5: Mark as Read ────────────────────────────────────
// PATCH /api/notifications/:notificationId/read
export const markAsRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markAsRead(
    parseInt(req.params.notificationId, 10),
    req.user.user_id
  );

  res.status(200).json({
    status: "success",
    data: { notification },
  });
});

// ─── Unread Count (bonus for badge counter) ─────────────────
// GET /api/notifications/unread-count
export const getUnreadCount = catchAsync(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.user_id);

  res.status(200).json({
    status: "success",
    data: { unread_count: count },
  });
});
