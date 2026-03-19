# Agent Orchestrator - Quick Start Reference

## 5-Minute Overview

The FoodBridge Agent Orchestrator is a complete system for handling conversational AI. Here's what happens when a user sends a message:

```
User: "Find me vegetarian meals"
  ↓
Agent receives message → loads session context
  ↓
LLM analyzes intent → decides to use search_food tool
  ↓
Tool executes → queries database via MCP
  ↓
Results returned to LLM → generates natural response
  ↓
Response: "I found 5 vegetarian meals available today..."
```

## Core Files

| File | Purpose |
|------|---------|
| `agent.ts` | Main orchestrator - handles the full workflow |
| `llm/client.ts` | OpenAI GPT-4o integration |
| `session/manager.ts` | Conversation context & history |
| `tools/mcpExecutor.ts` | Executes tools via MCP or REST |
| `tools/definitions.ts` | Tool schemas for LLM |
| `llm/prompts.ts` | System prompts & formatting |

## Key Classes

### FoodBridgeAgent
```typescript
const agent = new FoodBridgeAgent(sessionManager);

const response = await agent.processMessage({
  sessionId: "session-123",
  userId: "user-456",
  userRole: "student",
  userToken: "jwt-token",
  message: "Show me vegan options"
});
```

### SessionManager
```typescript
const session = sessionManager.createSession(
  "session-123",
  "user-456",
  "student",
  "jwt-token"
);

sessionManager.addMessage("session-123", "user", "Hello");
sessionManager.addMessage("session-123", "assistant", "Hi there!");
```

### LLMClient
```typescript
const llm = new LLMClient();

const response = await llm.chat([
  { role: "system", content: "You are a helpful assistant" },
  { role: "user", content: "Find vegetarian meals" }
]);

// response.content = "I'll search for vegetarian meals..."
// response.toolCalls = [{ id: "1", name: "search_food", arguments: {...} }]
```

### MCPToolExecutor
```typescript
const executor = new MCPToolExecutor({
  userId: "user-456",
  userToken: "jwt-token",
  apiBaseUrl: "http://localhost:3000/api",
  useMCP: true
});

const result = await executor.execute("search_food", {
  dietary_filters: ["vegetarian"],
  available_now: true
});
```

## Available Tools

### Read Tools (Fast - via MCP)
- `search_food` - Search with filters
- `get_listing_details` - Get listing info
- `get_pantry_slots` - Get available times
- `get_notifications` - Get alerts
- `get_user_preferences` - Get dietary prefs
- `get_frequent_items` - Get user history
- `get_dining_deals` - Get current deals
- `search_recipes` - Search recipes

### Write Tools (Safe - via REST API)
- `reserve_food` - Create reservation
- `cancel_reservation` - Cancel reservation
- `book_pantry` - Book appointment
- `generate_pantry_cart` - Generate cart

## Workflow Steps

### 1. Receive Message
```typescript
const request: AgentRequest = {
  sessionId: "session-123",
  userId: "user-456",
  userRole: "student",
  userToken: "jwt-token",
  message: "I'm hungry"
};
```

### 2. Load Session
```typescript
let session = sessionManager.getSession(request.sessionId);
if (!session) {
  session = sessionManager.createSession(
    request.sessionId,
    request.userId,
    request.userRole,
    request.userToken
  );
}
```

### 3. Add to History
```typescript
sessionManager.addMessage(request.sessionId, "user", request.message);
```

### 4. Build Messages
```typescript
const messages = [
  { role: "system", content: getSystemPrompt(request.userRole) },
  ...session.conversationHistory
];
```

### 5. Call LLM
```typescript
const response = await llmClient.chat(messages);
// response.toolCalls = [{ id: "1", name: "search_food", arguments: {...} }]
```

### 6. Execute Tools (if needed)
```typescript
if (response.toolCalls.length > 0) {
  const results = await executor.execute(
    response.toolCalls[0].name,
    response.toolCalls[0].arguments
  );
}
```

### 7. Return Response
```typescript
return {
  sessionId: request.sessionId,
  response: response.content,
  toolsUsed: ["search_food"],
  success: true
};
```

## Configuration

### Environment Variables
```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (defaults shown)
LLM_MODEL=gpt-4o
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=2000
SESSION_TIMEOUT_MINUTES=30
API_BASE_URL=http://localhost:3000/api
```

## Common Patterns

### Multi-Turn Conversation
```typescript
// Message 1
const response1 = await agent.processMessage({
  sessionId: "session-123",
  userId: "user-456",
  userRole: "student",
  userToken: "jwt-token",
  message: "Show me vegan meals"
});

// Message 2 (same session - context maintained)
const response2 = await agent.processMessage({
  sessionId: "session-123",
  userId: "user-456",
  userRole: "student",
  userToken: "jwt-token",
  message: "Can I reserve the first one?"
});
// Agent remembers the vegan meals from message 1
```

### Error Handling
```typescript
const response = await agent.processMessage(request);

if (!response.success) {
  console.error("Agent error:", response.error);
  // Handle error gracefully
}
```

### Tool Tracking
```typescript
const response = await agent.processMessage(request);

console.log("Tools used:", response.toolsUsed);
// ["search_food", "get_listing_details"]
```

## Tool Schemas

### search_food
```typescript
{
  dietary_filters?: string[],      // ["vegetarian", "vegan"]
  category?: string,               // "meal" | "snack" | "deal"
  available_now?: boolean,
  page?: number,
  limit?: number
}
```

### reserve_food
```typescript
{
  listing_id: string,              // Required
  quantity: number,                // Required
  pickup_time?: string,            // ISO 8601
  notes?: string
}
```

### book_pantry
```typescript
{
  appointment_time: string,        // Required, ISO 8601
  duration_minutes?: number,       // Default: 30
  notes?: string
}
```

### generate_pantry_cart
```typescript
{
  include_frequent?: boolean,
  respect_preferences?: boolean
}
```

## Response Format

### Success Response
```typescript
{
  sessionId: "session-123",
  response: "I found 5 vegetarian meals available today...",
  toolsUsed: ["search_food"],
  success: true
}
```

### Error Response
```typescript
{
  sessionId: "session-123",
  response: "I encountered an error processing your request. Please try again.",
  toolsUsed: [],
  success: false,
  error: "API connection failed"
}
```

## Performance Tips

1. **Reuse Sessions**: Keep session alive for multi-turn conversations
2. **Use MCP**: Read operations are faster via MCP
3. **Limit History**: Agent keeps last 20 messages (memory efficient)
4. **Cache Results**: Frontend can cache tool results
5. **Batch Requests**: Group related queries

## Debugging

### Enable Logging
```typescript
// In agent.ts
console.log("Processing message:", request.message);
console.log("Tool calls:", response.toolCalls);
console.log("Final response:", response.content);
```

### Check Session
```typescript
const session = sessionManager.getSession("session-123");
console.log("Conversation history:", session?.conversationHistory);
```

### Verify Tool Execution
```typescript
const result = await executor.execute("search_food", {
  dietary_filters: ["vegetarian"]
});
console.log("Tool result:", result);
```

## Integration Points

### With Express Routes
```typescript
app.post("/api/agent/chat", async (req, res) => {
  const response = await agent.processMessage({
    sessionId: req.body.sessionId,
    userId: req.user.id,
    userRole: req.user.role,
    userToken: req.headers.authorization,
    message: req.body.message
  });
  res.json(response);
});
```

### With Frontend
```typescript
// Frontend code
const response = await fetch("/api/agent/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify({
    sessionId: "session-123",
    message: "Find vegetarian meals"
  })
});

const data = await response.json();
console.log(data.response);
```

## Limits & Constraints

| Constraint | Value |
|-----------|-------|
| Max tool iterations | 5 |
| Max conversation history | 20 messages |
| Session timeout | 30 minutes |
| LLM temperature | 0.3 |
| Max tokens | 2000 |
| Rate limit | 20 req/min per user |

## Next Steps

1. **Deploy**: Run `npm run build && npm start`
2. **Test**: Use `/api/agent/chat` endpoint
3. **Monitor**: Track tool usage and latency
4. **Optimize**: Cache frequent queries
5. **Extend**: Add new tools as needed

## Support

- **Documentation**: See `AGENT_ORCHESTRATOR_GUIDE.md`
- **Tool Registry**: See `AGENT_TOOLS_REGISTRY.md`
- **API Docs**: See `API_DOCUMENTATION.md`
