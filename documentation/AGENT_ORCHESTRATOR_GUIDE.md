# FoodBridge AI Agent Orchestrator - Complete Implementation Guide

## Overview

The FoodBridge AI Agent Orchestrator is a production-ready system that coordinates conversational AI with backend tools. It handles user chat messages, maintains conversation context, determines user intent via LLM reasoning, selects appropriate tools, executes them, and returns formatted responses.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    FoodBridgeAgent                          │
│              (Main Orchestrator Controller)                 │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┬──────────────┐
    │            │            │              │
    ▼            ▼            ▼              ▼
┌────────┐  ┌─────────┐  ┌──────────┐  ┌──────────────┐
│LLMClient│  │SessionMgr│  │MCPToolExec│  │PromptEngine│
│(GPT-4o)│  │(Context) │  │(Execution)│  │(Formatting)│
└────────┘  └─────────┘  └──────────┘  └──────────────┘
    │            │            │              │
    └────────────┼────────────┴──────────────┘
                 │
        ┌────────▼────────┐
        │  Backend APIs   │
        │  & MCP Tools    │
        └─────────────────┘
```

## Workflow

### Agent Processing Loop

```
1. Receive User Message
   ↓
2. Load/Create Session
   ↓
3. Add Message to Conversation History
   ↓
4. Build LLM Messages (System Prompt + History)
   ↓
5. Send to LLM for Reasoning
   ↓
6. LLM Decides: Tool Needed?
   ├─ YES → Execute Tool(s)
   │        ↓
   │        Add Tool Results to Conversation
   │        ↓
   │        Get Next LLM Response (Loop up to 5 times)
   │
   └─ NO → Generate Final Response
   ↓
7. Add Final Response to History
   ↓
8. Return Response to User
```

## Component Details

### 1. FoodBridgeAgent (Main Orchestrator)

**File:** `backend/src/agent/agent.ts`

**Responsibilities:**
- Receive and process user messages
- Manage conversation flow
- Coordinate LLM and tool execution
- Handle errors gracefully

**Key Methods:**
```typescript
processMessage(request: AgentRequest): Promise<AgentResponse>
  - Main entry point for chat requests
  - Handles full orchestration loop
  - Returns formatted response

buildMessages(session, userRole): LLMMessage[]
  - Constructs message array with system prompt
  - Includes conversation history

executeTools(toolCalls, userId, userToken, toolsUsed): Promise<Record>
  - Executes all requested tools
  - Tracks which tools were used
  - Returns structured results

buildToolResultMessages(toolCalls, toolResults): LLMMessage[]
  - Formats tool results for LLM consumption
  - Maintains conversation context
```

**Configuration:**
- `maxToolIterations: 5` - Prevents infinite loops
- Session timeout: 30 minutes (configurable)
- LLM temperature: 0.3 (consistent tool selection)

### 2. LLMClient (OpenAI Integration)

**File:** `backend/src/agent/llm/client.ts`

**Responsibilities:**
- Communicate with OpenAI GPT-4o
- Parse tool calls from LLM responses
- Handle function calling protocol

**Key Methods:**
```typescript
chat(messages: LLMMessage[]): Promise<LLMResponse>
  - Sends messages to LLM
  - Extracts tool calls and content
  - Returns structured response

buildToolDefinitions(): OpenAI.Chat.ChatCompletionTool[]
  - Converts tool schemas to OpenAI format
  - Enables function calling
```

**Configuration:**
- Model: `gpt-4o` (configurable via `LLM_MODEL`)
- Temperature: `0.3` (configurable via `LLM_TEMPERATURE`)
- Max tokens: `2000` (configurable via `LLM_MAX_TOKENS`)

### 3. SessionManager (Conversation Context)

**File:** `backend/src/agent/session/manager.ts`

**Responsibilities:**
- Create and manage user sessions
- Store conversation history
- Handle session timeouts
- Maintain user metadata

**Key Methods:**
```typescript
createSession(sessionId, userId, userRole, userToken): SessionData
  - Creates new conversation session
  - Initializes empty history

getSession(sessionId): SessionData | undefined
  - Retrieves session by ID
  - Updates last activity timestamp

addMessage(sessionId, role, content): void
  - Adds message to conversation history
  - Keeps last 20 messages (memory management)

setMetadata(sessionId, key, value): void
  - Stores session-specific metadata
  - Useful for user preferences, context

endSession(sessionId): void
  - Cleans up session
  - Frees memory
```

**Features:**
- Automatic cleanup of inactive sessions (5-minute check interval)
- Configurable timeout (default: 30 minutes)
- Memory-efficient history management (max 20 messages)

### 4. MCPToolExecutor (Tool Execution)

**File:** `backend/src/agent/tools/mcpExecutor.ts`

**Responsibilities:**
- Execute tools via MCP or REST API
- Handle tool-specific logic
- Return structured results
- Manage authentication

**Key Methods:**
```typescript
execute(toolName, args): Promise<ToolResult>
  - Main execution entry point
  - Routes to MCP or API implementation

executeMCPTool(toolName, args): Promise<ToolResult>
  - Uses MCP for fast read operations
  - Optimized for database queries

executeAPITool(toolName, args): Promise<ToolResult>
  - Uses REST API for write operations
  - Handles authentication and errors
```

**Supported Tools:**
- `search_food` - Search listings with filters
- `get_listing_details` - Get specific listing info
- `reserve_food` - Create food reservation
- `cancel_reservation` - Cancel existing reservation
- `get_pantry_slots` - Get available appointment times
- `book_pantry` - Book pantry appointment
- `get_notifications` - Retrieve user notifications
- `get_user_preferences` - Get dietary preferences
- `get_frequent_items` - Get user's frequent items
- `generate_pantry_cart` - Generate smart cart
- `get_dining_deals` - Get current deals
- `search_recipes` - Search recipes (MCP)
- `get_recipe_details` - Get recipe info (MCP)

### 5. Tool Definitions (Schema Registry)

**File:** `backend/src/agent/tools/definitions.ts`

**Responsibilities:**
- Define tool schemas for LLM
- Specify parameters and requirements
- Enable function calling

**Structure:**
```typescript
interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameter>;
    required: string[];
  };
}
```

### 6. Prompt Engine (Response Formatting)

**File:** `backend/src/agent/llm/prompts.ts`

**Responsibilities:**
- Generate system prompts for different user roles
- Format tool results for LLM consumption
- Format search results and listings

**Key Functions:**
```typescript
getSystemPrompt(userRole): string
  - Returns role-specific system prompt
  - Defines agent behavior and constraints

formatToolResult(toolName, result): string
  - Converts tool results to readable format
  - Maintains context for LLM

formatSearchResults(listings): string
  - Formats food listings for display
  - Includes key information

formatListingDetails(listing): string
  - Detailed listing information
  - Dietary info, availability, etc.
```

## Data Flow

### Request Processing

```
User Message
    ↓
AgentRequest {
  sessionId: string
  userId: string
  userRole: "student" | "provider" | "admin"
  userToken: string
  message: string
}
    ↓
FoodBridgeAgent.processMessage()
    ↓
SessionManager.getSession() or createSession()
    ↓
SessionManager.addMessage(user)
    ↓
LLMClient.chat(messages)
    ↓
LLM Response {
  content: string
  toolCalls: [{id, name, arguments}]
  stopReason: string
}
    ↓
MCPToolExecutor.execute() [if toolCalls]
    ↓
Tool Results {
  success: boolean
  data: any
  error?: string
}
    ↓
LLMClient.chat() [with tool results]
    ↓
Final Response
    ↓
AgentResponse {
  sessionId: string
  response: string
  toolsUsed: string[]
  success: boolean
  error?: string
}
```

## Tool Execution Strategy

### MCP vs REST API

**MCP (Model Context Protocol) - Read Operations:**
- Fast database queries
- No authentication overhead
- Used for: search, get details, get preferences
- Lower latency

**REST API - Write Operations:**
- Transactional safety
- Full authentication/authorization
- Used for: reserve, book, cancel
- Audit trail

### Error Handling

```typescript
try {
  // Process message
} catch (error) {
  return {
    sessionId,
    response: "I encountered an error processing your request. Please try again.",
    toolsUsed: [],
    success: false,
    error: error.message
  };
}
```

## Configuration

### Environment Variables

```bash
# LLM Configuration
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4o
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=2000

# Session Configuration
SESSION_TIMEOUT_MINUTES=30

# API Configuration
API_BASE_URL=http://localhost:3000/api

# MCP Configuration
MCP_ENABLED=true
```

## Usage Example

### Basic Chat Request

```typescript
import { FoodBridgeAgent } from "./agent/agent";
import { sessionManager } from "./agent/session/manager";

const agent = new FoodBridgeAgent(sessionManager);

const response = await agent.processMessage({
  sessionId: "session-123",
  userId: "user-456",
  userRole: "student",
  userToken: "jwt-token",
  message: "I'm looking for vegetarian meals available today"
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
// First message
const response1 = await agent.processMessage({
  sessionId: "session-123",
  userId: "user-456",
  userRole: "student",
  userToken: "jwt-token",
  message: "Show me vegan options"
});

// Second message (same session - context maintained)
const response2 = await agent.processMessage({
  sessionId: "session-123",
  userId: "user-456",
  userRole: "student",
  userToken: "jwt-token",
  message: "Can I reserve the first one?"
});
// Agent remembers previous search results
```

## Performance Characteristics

### Latency

- **Simple Response** (no tools): ~500ms
- **Single Tool Execution**: ~1-2s
- **Multi-Tool Execution**: ~2-5s
- **Tool Loop (max 5 iterations)**: ~5-10s

### Memory

- **Per Session**: ~50KB (20 messages)
- **Concurrent Sessions**: Scales linearly
- **Cleanup**: Automatic after 30 minutes inactivity

### Rate Limiting

- **Per User**: 20 requests/minute (configurable)
- **Global**: Depends on OpenAI quota
- **Tool Execution**: No additional limits

## Security

### Authentication

- JWT token validation on all requests
- Token passed to tool executor
- Backend API validates token

### Authorization

- User role-based access control
- Tools respect user permissions
- Session isolation per user

### Data Protection

- Conversation history stored in memory (not persisted)
- No sensitive data in logs
- Tool results sanitized before LLM

## Testing

### Unit Tests

```bash
npm test -- agent/
```

### Integration Tests

```bash
npm test -- integration/agent/
```

### E2E Tests

```bash
npm test -- e2e/agent/
```

## Troubleshooting

### Common Issues

**Issue: Tool not being called**
- Check tool definition in `definitions.ts`
- Verify LLM temperature (should be 0.3-0.5)
- Check tool parameters match schema

**Issue: Session timeout**
- Increase `SESSION_TIMEOUT_MINUTES`
- Check for inactive sessions
- Verify cleanup interval

**Issue: Tool execution fails**
- Check API connectivity
- Verify authentication token
- Check tool parameters

**Issue: LLM rate limit**
- Implement request queuing
- Reduce concurrent requests
- Check OpenAI quota

## Future Enhancements

1. **Persistent Storage**: Store conversation history in database
2. **User Preferences**: Learn and store user preferences
3. **Analytics**: Track tool usage and user patterns
4. **Caching**: Cache frequent queries
5. **Multi-language**: Support multiple languages
6. **Voice Integration**: Add voice input/output
7. **Advanced Context**: Implement RAG for better context
8. **Tool Chaining**: Support complex multi-step workflows

## API Endpoints

### Chat Endpoint

```
POST /api/agent/chat
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "sessionId": "session-123",
  "userId": "user-456",
  "userRole": "student",
  "message": "I'm looking for vegetarian meals"
}

Response:
{
  "sessionId": "session-123",
  "response": "I found 5 vegetarian meals...",
  "toolsUsed": ["search_food"],
  "success": true
}
```

### Session Management

```
GET /api/agent/sessions/:sessionId
DELETE /api/agent/sessions/:sessionId
```

## References

- **LLM Client**: `backend/src/agent/llm/client.ts`
- **Tool Executor**: `backend/src/agent/tools/mcpExecutor.ts`
- **Tool Definitions**: `backend/src/agent/tools/definitions.ts`
- **Session Manager**: `backend/src/agent/session/manager.ts`
- **Prompts**: `backend/src/agent/llm/prompts.ts`
- **Main Agent**: `backend/src/agent/agent.ts`
