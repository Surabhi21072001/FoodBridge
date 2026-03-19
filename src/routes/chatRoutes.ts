/**
 * Chat Routes - AI Agent chat endpoints
 */

import { Router } from "express";
import { chat, endSession } from "../controllers/chatController";
import { authenticate } from "../middleware/auth";
import { chatRateLimit } from "../middleware/chatRateLimit";

const router = Router();

// All chat routes require authentication
router.use(authenticate);

/**
 * POST /api/chat
 * Send a message to the AI agent
 * Rate limited to 20 requests per minute per user
 */
router.post("/", chatRateLimit, chat);

/**
 * POST /api/chat/:sessionId/end
 * End a chat session
 */
router.post("/:sessionId/end", endSession);

export default router;
