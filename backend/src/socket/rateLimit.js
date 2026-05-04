import redis from "../config/redis.js";

const RATE_LIMITS = {
  send_message: { max: 20, windowSeconds: 60 },
  typing: { max: 10, windowSeconds: 60 },
  join_conversation: { max: 10, windowSeconds: 60 },
  mark_read: { max: 30, windowSeconds: 60 },
};

const violations = new Map();

const checkRateLimit = async (userId, eventName) => {
  const limit = RATE_LIMITS[eventName];
  if (!limit) return true;

  const key = `socket_rate:${userId}:${eventName}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, limit.windowSeconds);
  }

  if (current > limit.max) {
    const vKey = `${userId}:violations`;
    const violations_count = (violations.get(vKey) || 0) + 1;
    violations.set(vKey, violations_count);

    if (violations_count >= 3) {
      return "disconnect";
    }
    return false;
  }

  return true;
};

const clearViolations = (userId) => {
  violations.delete(`${userId}:violations`);
};

export { checkRateLimit, clearViolations };
