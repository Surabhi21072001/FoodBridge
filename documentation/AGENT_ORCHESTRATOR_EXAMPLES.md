# Agent Orchestrator - Code Examples & Integration Patterns

## Basic Usage

### Simple Chat Request

```typescript
import { FoodBridgeAgent } from "./agent/agent";
import { sessionManager } from "./agent/session/manager";

const agent = new FoodBridgeAgent(sessionManager);

// Single message
const response = await agent.processMessage({
  sessionId: "session-123",
  userId: "user-456",
  userRole: "student",
  userToken: "jwt-token-xyz",
  message: "Hello, I'm looking for vegetarian meals"
});

console.log(response);
// {
//   sessionId: "session-123",
//   response: "I found 5 vegetarian meals available today...",
//   toolsUsed: ["search_food"],
//   success: true
// }
```

### Multi-Turn Conversation

```typescript
// Message 1: Search
const response1 = await agent.processMessage({
  sessionId: "session-123",
  userId: "user-456",
  userRole: "student",
  userToken: "jwt-token-xyz",
  message: "Show me vegan options"
});

console.log(response1.response);
// "I found 3 vegan meals available..."

// Message 2: Reserve (context maintained)
const response2 = await agent.processMessage({
  sessionId: "session-123",
  userId: "user-456",
  userRole: "student",
  userToken: "jwt-token-xyz",
  message: "Can I reserve the first one?"
});

console.log(response2.response);
// "I'll reserve the vegan pasta for you..."
// Agent remembers the search results from message 1
```

## Express Integration

### Basic Route Handler

```typescript
import express from "express";
import { FoodBridgeAgent } from "./agent/agent";
import { sessionManager } from "./agent/session/manager";
import { authenticateToken } from "./middleware/auth";

const router = express.Router();
const agent = new FoodBridgeAgent(sessionManager);

router.post("/chat", authenticateToken, async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    // Validate input
    if (!sessionId || !message) {
      return res.status(400).json({
        error: "Missing sessionId or message"
      });
    }

    // Process message
    const response = await agent.processMessage({
      sessionId,
      userId: req.user.id,
      userRole: req.user.role,
      userToken: req.headers.authorization,
      message
    });

    res.json(response);
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});

export default router;
```

### With Error Handling

```typescript
router.post("/chat", authenticateToken, async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    // Validate input
    if (!sessionId || !message) {
      return res.status(400).json({
        error: "Missing required fields",
        code: "INVALID_REQUEST"
      });
    }

    // Validate message length
    if (message.length > 1000) {
      return res.status(400).json({
        error: "Message too long (max 1000 characters)",
        code: "MESSAGE_TOO_LONG"
      });
    }

    // Process message
    const response = await agent.processMessage({
      sessionId,
      userId: req.user.id,
      userRole: req.user.role,
      userToken: req.headers.authorization,
      message
    });

    // Check for errors
    if (!response.success) {
      return res.status(500).json({
        error: response.error || "Failed to process message",
        code: "AGENT_ERROR"
      });
    }

    res.json(response);
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
});
```

### With Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: "Too many chat requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id // Rate limit per user
});

router.post("/chat", authenticateToken, chatLimiter, async (req, res) => {
  // ... handler code
});
```

## Frontend Integration

### React Component

```typescript
import React, { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          sessionId,
          message: input
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Log tools used
      if (data.toolsUsed.length > 0) {
        console.log("Tools used:", data.toolsUsed);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
          </div>
        ))}
        {loading && <div className="message assistant">Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button onClick={handleSendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
};
```

### Vue Component

```vue
<template>
  <div class="chat-container">
    <div class="messages">
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        :class="['message', msg.role]"
      >
        <p>{{ msg.content }}</p>
      </div>
      <div v-if="loading" class="message assistant">Thinking...</div>
      <div ref="messagesEnd" />
    </div>

    <div class="input-area">
      <input
        v-model="input"
        type="text"
        placeholder="Type your message..."
        :disabled="loading"
        @keypress.enter="sendMessage"
      />
      <button @click="sendMessage" :disabled="loading">Send</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const messages = ref<Message[]>([]);
const input = ref("");
const loading = ref(false);
const sessionId = ref(`session-${Date.now()}`);
const messagesEnd = ref<HTMLDivElement>();

const scrollToBottom = async () => {
  await nextTick();
  messagesEnd.value?.scrollIntoView({ behavior: "smooth" });
};

const sendMessage = async () => {
  if (!input.value.trim()) return;

  // Add user message
  messages.value.push({
    role: "user",
    content: input.value
  });

  const userMessage = input.value;
  input.value = "";
  loading.value = true;

  try {
    const response = await fetch("/api/agent/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        sessionId: sessionId.value,
        message: userMessage
      })
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    const data = await response.json();

    // Add assistant message
    messages.value.push({
      role: "assistant",
      content: data.response
    });
  } catch (error) {
    console.error("Error:", error);
    messages.value.push({
      role: "assistant",
      content: "Sorry, I encountered an error. Please try again."
    });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.message {
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}

.message.user {
  background-color: #e3f2fd;
  text-align: right;
}

.message.assistant {
  background-color: #f5f5f5;
}

.input-area {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #ddd;
}

input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
}

button {
  padding: 0.5rem 1rem;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
```

## Session Management

### Create Session

```typescript
import { sessionManager } from "./agent/session/manager";

// Create new session
const session = sessionManager.createSession(
  "session-123",
  "user-456",
  "student",
  "jwt-token-xyz"
);

console.log(session);
// {
//   userId: "user-456",
//   userRole: "student",
//   userToken: "jwt-token-xyz",
//   conversationHistory: [],
//   createdAt: Date,
//   lastActivityAt: Date,
//   metadata: {}
// }
```

### Retrieve Session

```typescript
// Get existing session
const session = sessionManager.getSession("session-123");

if (session) {
  console.log("Session found");
  console.log("Messages:", session.conversationHistory.length);
} else {
  console.log("Session not found");
}
```

### Add Metadata

```typescript
// Store user preferences in session
sessionManager.setMetadata("session-123", "dietary_preferences", [
  "vegetarian",
  "gluten-free"
]);

sessionManager.setMetadata("session-123", "favorite_restaurants", [
  "dining-hall-1",
  "cafe-2"
]);

// Retrieve metadata
const prefs = sessionManager.getMetadata("session-123", "dietary_preferences");
console.log(prefs); // ["vegetarian", "gluten-free"]
```

### End Session

```typescript
// Clean up session
sessionManager.endSession("session-123");

// Session is now deleted
const session = sessionManager.getSession("session-123");
console.log(session); // undefined
```

## Tool Execution

### Direct Tool Execution

```typescript
import { MCPToolExecutor } from "./agent/tools/mcpExecutor";

const executor = new MCPToolExecutor({
  userId: "user-456",
  userToken: "jwt-token-xyz",
  apiBaseUrl: "http://localhost:3000/api",
  useMCP: true
});

// Search for food
const result = await executor.execute("search_food", {
  dietary_filters: ["vegetarian"],
  available_now: true,
  limit: 10
});

console.log(result);
// {
//   success: true,
//   data: [
//     { id: "listing-1", name: "Veggie Bowl", ... },
//     { id: "listing-2", name: "Salad", ... },
//     ...
//   ]
// }
```

### Tool with Error Handling

```typescript
try {
  const result = await executor.execute("reserve_food", {
    listing_id: "listing-1",
    quantity: 2,
    pickup_time: "2024-03-15T14:00:00Z"
  });

  if (result.success) {
    console.log("Reservation created:", result.data);
  } else {
    console.error("Reservation failed:", result.error);
  }
} catch (error) {
  console.error("Tool execution error:", error);
}
```

## Advanced Patterns

### Custom System Prompt

```typescript
import { getSystemPrompt } from "./agent/llm/prompts";

// Get role-specific prompt
const studentPrompt = getSystemPrompt("student");
const providerPrompt = getSystemPrompt("provider");
const adminPrompt = getSystemPrompt("admin");

console.log(studentPrompt);
// "You are a helpful FoodBridge assistant for students..."
```

### Tool Result Formatting

```typescript
import { formatToolResult } from "./agent/llm/prompts";

const toolResult = {
  success: true,
  data: [
    { id: "1", name: "Veggie Bowl", price: 5.99 },
    { id: "2", name: "Salad", price: 4.99 }
  ]
};

const formatted = formatToolResult("search_food", toolResult);
console.log(formatted);
// "Found 2 food listings:
//  1. Veggie Bowl - $5.99
//  2. Salad - $4.99"
```

### Conversation History Analysis

```typescript
const session = sessionManager.getSession("session-123");

if (session) {
  // Count messages
  console.log("Total messages:", session.conversationHistory.length);

  // Get last user message
  const lastUserMsg = session.conversationHistory
    .reverse()
    .find((msg) => msg.role === "user");
  console.log("Last user message:", lastUserMsg?.content);

  // Get conversation summary
  const userMessages = session.conversationHistory.filter(
    (msg) => msg.role === "user"
  );
  console.log("User messages:", userMessages.length);
}
```

## Testing Examples

### Unit Test

```typescript
import { FoodBridgeAgent } from "./agent/agent";
import { SessionManager } from "./agent/session/manager";

describe("FoodBridgeAgent", () => {
  let agent: FoodBridgeAgent;
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
    agent = new FoodBridgeAgent(sessionManager);
  });

  it("should process a simple message", async () => {
    const response = await agent.processMessage({
      sessionId: "test-session",
      userId: "test-user",
      userRole: "student",
      userToken: "test-token",
      message: "Hello"
    });

    expect(response.success).toBe(true);
    expect(response.response).toBeDefined();
    expect(response.sessionId).toBe("test-session");
  });

  it("should maintain conversation context", async () => {
    // First message
    await agent.processMessage({
      sessionId: "test-session",
      userId: "test-user",
      userRole: "student",
      userToken: "test-token",
      message: "Show me vegetarian meals"
    });

    // Second message
    const response = await agent.processMessage({
      sessionId: "test-session",
      userId: "test-user",
      userRole: "student",
      userToken: "test-token",
      message: "Can I reserve the first one?"
    });

    expect(response.success).toBe(true);
    // Agent should remember the search results
  });
});
```

### Integration Test

```typescript
describe("Agent Integration", () => {
  it("should execute search_food tool", async () => {
    const response = await agent.processMessage({
      sessionId: "test-session",
      userId: "test-user",
      userRole: "student",
      userToken: "test-token",
      message: "Find vegetarian meals"
    });

    expect(response.success).toBe(true);
    expect(response.toolsUsed).toContain("search_food");
    expect(response.response).toContain("vegetarian");
  });

  it("should handle tool errors gracefully", async () => {
    const response = await agent.processMessage({
      sessionId: "test-session",
      userId: "test-user",
      userRole: "student",
      userToken: "invalid-token",
      message: "Find meals"
    });

    // Should still return a response, even if tool fails
    expect(response.response).toBeDefined();
  });
});
```

## Monitoring & Logging

### Basic Logging

```typescript
import { FoodBridgeAgent } from "./agent/agent";

const agent = new FoodBridgeAgent(sessionManager);

const response = await agent.processMessage({
  sessionId: "session-123",
  userId: "user-456",
  userRole: "student",
  userToken: "jwt-token",
  message: "Find meals"
});

// Log metrics
console.log({
  timestamp: new Date().toISOString(),
  userId: "user-456",
  sessionId: "session-123",
  message: "Find meals",
  response: response.response,
  toolsUsed: response.toolsUsed,
  success: response.success,
  duration: Date.now() - startTime
});
```

### Structured Logging

```typescript
import winston from "winston";

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "agent.log" })
  ]
});

const startTime = Date.now();
const response = await agent.processMessage(request);
const duration = Date.now() - startTime;

logger.info("Agent request processed", {
  userId: request.userId,
  sessionId: request.sessionId,
  toolsUsed: response.toolsUsed,
  success: response.success,
  duration,
  error: response.error
});
```

## Performance Optimization

### Caching Tool Results

```typescript
const cache = new Map<string, any>();

async function searchFoodWithCache(filters: any) {
  const cacheKey = JSON.stringify(filters);

  if (cache.has(cacheKey)) {
    console.log("Cache hit");
    return cache.get(cacheKey);
  }

  const result = await executor.execute("search_food", filters);
  cache.set(cacheKey, result);

  // Clear cache after 5 minutes
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);

  return result;
}
```

### Batch Tool Execution

```typescript
// Execute multiple tools in parallel
const [searchResults, dealsResults, notificationsResults] = await Promise.all([
  executor.execute("search_food", { available_now: true }),
  executor.execute("get_dining_deals", { limit: 5 }),
  executor.execute("get_notifications", { limit: 10 })
]);
```

---

These examples cover the most common integration patterns and use cases for the FoodBridge AI Agent Orchestrator.
