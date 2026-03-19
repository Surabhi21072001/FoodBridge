/**
 * LLM Client - OpenAI GPT-4o Integration
 */

import OpenAI from "openai";
import { AGENT_TOOLS } from "../tools/definitions";

export interface LLMMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface LLMResponse {
  content: string;
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
  }>;
  stopReason: string;
}

export class LLMClient {
  private client: OpenAI;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.LLM_MODEL || "gpt-4o";
    this.temperature = parseFloat(process.env.LLM_TEMPERATURE || "0.3");
    this.maxTokens = parseInt(process.env.LLM_MAX_TOKENS || "2000");
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      tools: this.buildToolDefinitions(),
      tool_choice: "auto",
    });

    const toolCalls: Array<{
      id: string;
      name: string;
      arguments: Record<string, any>;
    }> = [];

    let content = "";

    for (const choice of response.choices) {
      if (choice.message.content) {
        content = choice.message.content;
      }

      if (choice.message.tool_calls) {
        for (const toolCall of choice.message.tool_calls) {
          if (toolCall.type === "function") {
            toolCalls.push({
              id: toolCall.id,
              name: toolCall.function.name,
              arguments: JSON.parse(toolCall.function.arguments),
            });
          }
        }
      }
    }

    return {
      content,
      toolCalls,
      stopReason: response.choices[0].finish_reason || "stop",
    };
  }

  private buildToolDefinitions(): OpenAI.Chat.ChatCompletionTool[] {
    return AGENT_TOOLS.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }
}
