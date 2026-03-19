/**
 * FoodBridge AI Agent - Main Orchestrator
 * Coordinates LLM reasoning, tool execution, and session management
 * Uses MCP database connector for fast read operations
 */

import { LLMClient, LLMMessage } from "./llm/client";
import { MCPToolExecutor } from "./tools/mcpExecutor";
import { SessionManager, SessionData } from "./session/manager";
import { getSystemPrompt, formatToolResult } from "./llm/prompts";
import { agentLogService } from "../services/agentLogService";
import logger from "../utils/logger";

export interface AgentRequest {
  sessionId: string;
  userId: string;
  userRole: string;
  userToken: string;
  message: string;
}

export interface AgentResponse {
  sessionId: string;
  response: string;
  toolsUsed: string[];
  success: boolean;
  error?: string;
}

export class FoodBridgeAgent {
  private llmClient: LLMClient;
  private sessionManager: SessionManager;
  private apiBaseUrl: string;
  private maxToolIterations: number = 8;

  constructor(sessionManager: SessionManager, apiBaseUrl: string = "http://localhost:3000/api") {
    this.llmClient = new LLMClient();
    this.sessionManager = sessionManager;
    this.apiBaseUrl = apiBaseUrl;
  }

  async processMessage(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    const toolCallsLog: Array<{ name: string; arguments: Record<string, any>; result?: any }> = [];

    try {
      // Get or create session
      let session = this.sessionManager.getSession(request.sessionId);
      if (!session) {
        session = this.sessionManager.createSession(
          request.sessionId,
          request.userId,
          request.userRole,
          request.userToken
        );
      }

      // Add user message to history
      this.sessionManager.addMessage(request.sessionId, "user", request.message);

      // Build conversation with system prompt
      const messages = this.buildMessages(session, request.userRole);

      // Process through LLM with tool calling loop
      const toolsUsed: string[] = [];
      let response = await this.llmClient.chat(messages);
      let iterations = 0;

      while (response.toolCalls.length > 0 && iterations < this.maxToolIterations) {
        iterations++;

        // Execute tools
        const toolResults = await this.executeTools(
          response.toolCalls,
          request.userId,
          request.userToken,
          toolsUsed,
          request.sessionId
        );

        // Log tool calls
        for (const toolCall of response.toolCalls) {
          toolCallsLog.push({
            name: toolCall.name,
            arguments: toolCall.arguments,
            result: toolResults[toolCall.id],
          });
        }

        // Add assistant response to history
        this.sessionManager.addMessage(request.sessionId, "assistant", response.content);

        // Add assistant message with tool calls to conversation
        const assistantMessage: LLMMessage = {
          role: "assistant",
          content: response.content,
          tool_calls: response.toolCalls.map(tc => ({
            id: tc.id,
            type: "function",
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          })),
        };
        messages.push(assistantMessage);

        // Add tool results to conversation
        const toolResultMessages = this.buildToolResultMessages(response.toolCalls, toolResults);
        messages.push(...toolResultMessages);

        // Get next LLM response
        response = await this.llmClient.chat(messages);
      }

      // Add final assistant response to history
      this.sessionManager.addMessage(request.sessionId, "assistant", response.content);

      const executionTimeMs = Date.now() - startTime;

      // Log successful interaction
      await agentLogService.logInteraction({
        userId: request.userId,
        sessionId: request.sessionId,
        query: request.message,
        toolCalls: toolCallsLog.length > 0 ? toolCallsLog : undefined,
        response: response.content,
        executionTimeMs,
      });

      return {
        sessionId: request.sessionId,
        response: response.content,
        toolsUsed,
        success: true,
      };
    } catch (error: any) {
      const executionTimeMs = Date.now() - startTime;

      // Log failed interaction
      await agentLogService.logInteraction({
        userId: request.userId,
        sessionId: request.sessionId,
        query: request.message,
        toolCalls: toolCallsLog.length > 0 ? toolCallsLog : undefined,
        response: "Error occurred",
        executionTimeMs,
        error: error.message,
      });

      logger.error('Agent processing error', {
        userId: request.userId,
        sessionId: request.sessionId,
        error: error.message,
        stack: error.stack,
      });

      return {
        sessionId: request.sessionId,
        response: "I encountered an error processing your request. Please try again.",
        toolsUsed: [],
        success: false,
        error: error.message,
      };
    }
  }

  private buildMessages(session: SessionData, userRole: string): LLMMessage[] {
    let systemPrompt = getSystemPrompt(userRole);
    
    // Add search results context if available
    const lastSearchResults = session.metadata?.lastSearchResults;
    if (lastSearchResults && Array.isArray(lastSearchResults) && lastSearchResults.length > 0) {
      const searchContext = lastSearchResults
        .map((listing: any, idx: number) => `${idx + 1}. ID: ${listing.id}, Title: ${listing.title}`)
        .join("\n");
      systemPrompt += `\n\nRECENT SEARCH RESULTS (use these IDs for reservations):\n${searchContext}`;
    }
    
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...session.conversationHistory,
    ];
    return messages;
  }

  private async executeTools(
    toolCalls: Array<{ id: string; name: string; arguments: Record<string, any> }>,
    userId: string,
    userToken: string,
    toolsUsed: string[],
    sessionId?: string
  ): Promise<Record<string, any>> {
    const executor = new MCPToolExecutor({
      userId,
      userToken,
      apiBaseUrl: this.apiBaseUrl,
      useMCP: true, // Enable MCP for read operations
    });

    const results: Record<string, any> = {};

    for (const toolCall of toolCalls) {
      if (!toolsUsed.includes(toolCall.name)) {
        toolsUsed.push(toolCall.name);
      }

      const result = await executor.execute(toolCall.name, toolCall.arguments);
      results[toolCall.id] = result;

      // Store search results in session metadata for reference
      if (toolCall.name === "search_food" && result.success && sessionId) {
        this.sessionManager.setMetadata(sessionId, "lastSearchResults", result.data);
      }
    }

    return results;
  }

  private buildToolResultMessages(
    toolCalls: Array<{ id: string; name: string; arguments: Record<string, any> }>,
    toolResults: Record<string, any>
  ): LLMMessage[] {
    const messages: LLMMessage[] = [];

    for (const toolCall of toolCalls) {
      const result = toolResults[toolCall.id];
      const formattedResult = formatToolResult(toolCall.name, result);

      // Add tool result as tool message (OpenAI format)
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: formattedResult,
      });
    }

    return messages;
  }

  endSession(sessionId: string): void {
    this.sessionManager.endSession(sessionId);
  }
}
