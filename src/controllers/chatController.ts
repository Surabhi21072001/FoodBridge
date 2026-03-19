/**
 * Chat Controller - Handles chat endpoint requests
 */

import { Request, Response } from "express";
import { FoodBridgeAgent } from "../agent/agent";
import { sessionManager } from "../agent/session/manager";
import { v4 as uuidv4 } from "uuid";

// Initialize agent with dynamic API base URL (supports Heroku's dynamic PORT)
const port = process.env.PORT || 3000;
const apiBaseUrl = process.env.API_BASE_URL || `http://localhost:${port}/api`;
const agent = new FoodBridgeAgent(sessionManager, apiBaseUrl);

export const chat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, sessionId: providedSessionId } = req.body;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role || "student";
    const userToken = (req as any).token;

    // Validate input
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: "Message is required and must be a non-empty string",
      });
      return;
    }

    if (!userId || !userToken) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Generate or use provided session ID
    const sessionId = providedSessionId || uuidv4();

    // Process message through the AI agent
    const agentResponse = await agent.processMessage({
      sessionId,
      userId,
      userRole,
      userToken,
      message: message.trim(),
    });

    res.status(200).json({
      success: true,
      data: {
        sessionId: agentResponse.sessionId,
        response: agentResponse.response,
        toolsUsed: agentResponse.toolsUsed,
        timestamp: new Date().toISOString(),
      },
    });

    // Log the interaction
    console.log(`Chat message from user ${userId}: ${message}`);
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const endSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
      return;
    }

    agent.endSession(sessionId);

    res.status(200).json({
      success: true,
      message: "Session ended successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
