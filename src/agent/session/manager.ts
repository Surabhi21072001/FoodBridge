/**
 * Session Manager - Manages conversation sessions and context
 */

import { LLMMessage } from "../llm/client";

export interface SessionData {
  userId: string;
  userRole: string;
  userToken: string;
  conversationHistory: LLMMessage[];
  createdAt: Date;
  lastActivityAt: Date;
  metadata: Record<string, any>;
}

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private sessionTimeout: number;

  constructor(timeoutMinutes: number = 30) {
    this.sessionTimeout = timeoutMinutes * 60 * 1000;
    this.startCleanupInterval();
  }

  createSession(
    sessionId: string,
    userId: string,
    userRole: string,
    userToken: string
  ): SessionData {
    const session: SessionData = {
      userId,
      userRole,
      userToken,
      conversationHistory: [],
      createdAt: new Date(),
      lastActivityAt: new Date(),
      metadata: {},
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): SessionData | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivityAt = new Date();
    }
    return session;
  }

  addMessage(sessionId: string, role: "user" | "assistant", content: string): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.conversationHistory.push({ role, content });
      // Keep only last 20 messages to manage memory
      if (session.conversationHistory.length > 20) {
        session.conversationHistory = session.conversationHistory.slice(-20);
      }
    }
  }

  getConversationHistory(sessionId: string): LLMMessage[] {
    const session = this.getSession(sessionId);
    return session?.conversationHistory || [];
  }

  setMetadata(sessionId: string, key: string, value: any): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.metadata[key] = value;
    }
  }

  getMetadata(sessionId: string, key: string): any {
    const session = this.getSession(sessionId);
    return session?.metadata[key];
  }

  endSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = new Date().getTime();
      for (const [sessionId, session] of this.sessions.entries()) {
        if (now - session.lastActivityAt.getTime() > this.sessionTimeout) {
          this.sessions.delete(sessionId);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
}

// Global session manager instance
export const sessionManager = new SessionManager(
  parseInt(process.env.SESSION_TIMEOUT_MINUTES || "30")
);
