import crypto from "crypto";
import { User } from "../models/index.js";

const MAX_USERNAME_LENGTH = 30;

const sanitizeUsername = (rawUsername) => {
  if (!rawUsername) return null;
  const cleaned = String(rawUsername)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/[._-]{2,}/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "");

  if (cleaned.length < 3) return null;
  return cleaned.slice(0, MAX_USERNAME_LENGTH);
};

const buildBaseUsername = ({ username, email, name }) => {
  const normalized = sanitizeUsername(username);
  if (normalized) return normalized;

  const emailLocalPart = email?.split("@")?.[0];
  const fromEmail = sanitizeUsername(emailLocalPart);
  if (fromEmail) return fromEmail;

  const fromName = sanitizeUsername(name);
  if (fromName) return fromName;

  return `user${crypto.randomBytes(3).toString("hex")}`.slice(0, MAX_USERNAME_LENGTH);
};

const ensureUniqueUsername = async (baseUsername) => {
  const base = sanitizeUsername(baseUsername) || "user";

  const existing = await User.findOne({ where: { username: base } });
  if (!existing) return base;

  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const suffix = String(attempt);
    const truncatedBase = base.slice(0, Math.max(1, MAX_USERNAME_LENGTH - suffix.length));
    const candidate = `${truncatedBase}${suffix}`;
    const found = await User.findOne({ where: { username: candidate } });
    if (!found) return candidate;
  }

  const randomSuffix = crypto.randomBytes(3).toString("hex");
  const truncatedBase = base.slice(0, Math.max(1, MAX_USERNAME_LENGTH - randomSuffix.length));
  return `${truncatedBase}${randomSuffix}`;
};

const defaultProfilePictureUrl = (email) => {
  if (process.env.DEFAULT_PROFILE_PICTURE_URL) return process.env.DEFAULT_PROFILE_PICTURE_URL;
  return null;
};

export { MAX_USERNAME_LENGTH, sanitizeUsername, buildBaseUsername, ensureUniqueUsername, defaultProfilePictureUrl };
