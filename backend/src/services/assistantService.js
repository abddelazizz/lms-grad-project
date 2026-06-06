import { GoogleGenerativeAI } from "@google/generative-ai";
import redis from "../config/redis.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

// ─── Configuration ────────────────────────────────────────────
const REDIS_KEY_PREFIX = "assistant_session:";
const SESSION_TTL = 60 * 60 * 24; // 24 hours in seconds
const MAX_HISTORY_TURNS = 20;      // keep last 20 messages (10 exchanges)

// ─── Gemini Client ────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `You are an AI teaching assistant for Recode Academy, a modern coding and technology academy.

Your personality:
- Friendly, encouraging, and patient
- Concise but thorough — prefer short paragraphs and bullet points
- Use simple language, avoid unnecessary jargon

Your rules:
1. NEVER give direct, copy-paste answers to coding assignments or quiz questions.
2. Instead, guide students step-by-step toward the solution. Ask clarifying questions.
3. When a student is stuck, provide hints, pseudocode, or point them to relevant concepts.
4. You can explain general programming concepts, debug errors, and review code snippets.
5. Encourage students to try things on their own before asking for more help.
6. If asked about something unrelated to learning or technology, politely redirect.
7. Remember the student's name and context from this conversation session.
8. Format your responses with markdown when helpful (code blocks, lists, bold, etc.).`;

let model = null;

const getModel = () => {
  if (model) return model;

  if (!process.env.GEMINI_API_KEY) {
    throw new AppError("Gemini API key is not configured. Please set GEMINI_API_KEY.", 503);
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  return model;
};

// ─── Redis History Helpers ────────────────────────────────────

const getSessionKey = (userId) => `${REDIS_KEY_PREFIX}${userId}`;

/**
 * Load the conversation history for a user from Redis.
 * Returns an array of Gemini-compatible history objects.
 */
export const loadHistory = async (userId) => {
  try {
    const raw = await redis.get(getSessionKey(userId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    logger.warn(`Failed to load assistant history for user ${userId}: ${err.message}`);
    return [];
  }
};

/**
 * Save the conversation history for a user to Redis with TTL.
 * Trims to the most recent MAX_HISTORY_TURNS messages.
 */
export const saveHistory = async (userId, history) => {
  try {
    // Trim to the most recent messages
    const trimmed = history.slice(-MAX_HISTORY_TURNS);
    await redis.set(
      getSessionKey(userId),
      JSON.stringify(trimmed),
      "EX",
      SESSION_TTL
    );
  } catch (err) {
    logger.warn(`Failed to save assistant history for user ${userId}: ${err.message}`);
  }
};

/**
 * Clear the conversation history for a user.
 */
export const clearHistory = async (userId) => {
  try {
    await redis.del(getSessionKey(userId));
  } catch (err) {
    logger.warn(`Failed to clear assistant history for user ${userId}: ${err.message}`);
  }
};

// ─── Core Assistant Logic ─────────────────────────────────────

/**
 * Process a user message through the Gemini assistant.
 *
 * @param {string} message - The user's message text.
 * @param {Array}  history - Prior Gemini chat history items.
 * @returns {string} The assistant's reply text.
 */
export const processAssistantMessage = async (message, history = []) => {
  const geminiModel = getModel();

  const chat = geminiModel.startChat({ history });
  const result = await chat.sendMessage(message);
  const response = result.response;
  return response.text();
};

/**
 * Full send-message flow: load history → call Gemini → save updated history.
 *
 * @param {number} userId  - The authenticated user's ID.
 * @param {string} message - The user's message text.
 * @returns {{ reply: string }} The assistant's reply.
 */
export const sendMessage = async (userId, message) => {
  // 1. Load existing history from Redis
  const history = await loadHistory(userId);

  // 2. Send to Gemini with history context
  const reply = await processAssistantMessage(message, history);

  // 3. Append the new user/assistant turns
  history.push(
    { role: "user", parts: [{ text: message }] },
    { role: "model", parts: [{ text: reply }] }
  );

  // 4. Save updated history back to Redis
  await saveHistory(userId, history);

  return { reply };
};
