import redis from "../config/redis.js";
import { User } from "../models/index.js";
import { AppError } from "../utils/index.js";
import { auditLog } from "../utils/logger.js";
import { revokeAllRefreshTokens, publishTokenRevocation } from "./tokenService.js";

const getActiveSessions = async (userId) => {
  const pattern = `refresh:${userId}:*`;
  const keys = await redis.keys(pattern);

  const sessions = [];
  for (const key of keys) {
    const data = await redis.get(key);
    if (data) {
      const parsed = JSON.parse(data);
      const tokenId = key.split(":").pop();
      sessions.push({
        tokenId,
        deviceInfo: parsed.device_info ? JSON.parse(parsed.device_info) : {},
        ipAddress: parsed.ip_address,
        createdAt: parsed.created_at,
      });
    }
  }

  return sessions;
};

const revokeSession = async (userId, tokenId) => {
  const key = `refresh:${userId}:${tokenId}`;
  const exists = await redis.get(key);
  if (!exists) {
    throw new AppError("Session not found.", 404);
  }

  await redis.del(key);
  auditLog("SESSION_REVOKED", userId, "session", tokenId);
};

const revokeAllSessions = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  user.token_version += 1;
  await user.save();

  await revokeAllRefreshTokens(userId);
  await publishTokenRevocation(userId);
  await redis.del(`user_cache:${userId}`);

  auditLog("ALL_SESSIONS_REVOKED", userId, "user", userId);
};

export { getActiveSessions, revokeSession, revokeAllSessions };
