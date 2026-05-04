import crypto from "crypto";
import jwt from "jsonwebtoken";
import redis from "../config/redis.js";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      role: user.role,
      picture: user.picture,
      token_version: user.token_version ?? 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = async (user, deviceInfo = {}, ipAddress = "") => {
  const tokenId = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(tokenId).digest("hex");

  const data = {
    user_id: user.user_id,
    token_hash: tokenHash,
    device_info: JSON.stringify(deviceInfo),
    ip_address: ipAddress,
    created_at: new Date().toISOString(),
  };

  await redis.set(
    `refresh:${user.user_id}:${tokenId}`,
    JSON.stringify(data),
    "EX",
    REFRESH_TOKEN_EXPIRY
  );

  return `${user.user_id}:${tokenId}`;
};

const validateRefreshToken = async (userId, tokenId) => {
  const key = `refresh:${userId}:${tokenId}`;
  const data = await redis.get(key);

  if (!data) return null;

  const parsed = JSON.parse(data);
  if (parsed.revoked) return null;

  return parsed;
};

const revokeRefreshToken = async (userId, tokenId) => {
  const key = `refresh:${userId}:${tokenId}`;
  await redis.del(key);
};

const revokeAllRefreshTokens = async (userId) => {
  const pattern = `refresh:${userId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

const rotateRefreshToken = async (userId, oldTokenId, deviceInfo = {}, ipAddress = "") => {
  await revokeRefreshToken(userId, oldTokenId);
  const user = { user_id: userId };
  const newTokenId = await generateRefreshToken(user, deviceInfo, ipAddress);
  return newTokenId;
};

const blacklistAccessToken = async (jti, expiresInSeconds) => {
  await redis.set(`blacklist:${jti}`, "1", "EX", expiresInSeconds);
};

const isTokenBlacklisted = async (jti) => {
  const result = await redis.get(`blacklist:${jti}`);
  return !!result;
};

const publishTokenRevocation = async (userId) => {
  await redis.publish(`token_revoked:${userId}`, JSON.stringify({ timestamp: Date.now() }));
};

export {
  generateAccessToken,
  generateRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  rotateRefreshToken,
  blacklistAccessToken,
  isTokenBlacklisted,
  publishTokenRevocation,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};
