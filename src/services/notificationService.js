import { Notification } from "../models/index.js";
import AppError from "../utilis/AppError.js";

/**
 * API 5 — Mark a notification as read.
 * Verifies ownership so users can only mark their own notifications.
 */
export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findByPk(notificationId);

  if (!notification) {
    throw new AppError("Notification not found.", 404);
  }

  if (notification.user_id !== userId) {
    throw new AppError("You can only mark your own notifications as read.", 403);
  }

  await notification.update({ is_read: true });

  return notification;
};

/**
 * Get the count of unread notifications for a user.
 * Useful for the frontend badge counter.
 */
export const getUnreadCount = async (userId) => {
  const count = await Notification.count({
    where: { user_id: userId, is_read: false },
  });

  return count;
};
