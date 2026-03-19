# Agent Orchestrator - Architecture & Data Flow

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Web/Mobile)                   │
│                    (React/Vue Components)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    HTTP/WebSocket
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      Express Backend                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Agent Chat Route Handler                    │  │
│  │  POST /api/agent/chat                                   │  │
│  │  - Validate JWT token                                   │  │
│  │  - Extract user context                                 │  │
│  │  - Call FoodBridgeAgent.processMessage()                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    FoodBridge Agent                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Load/Create Session (SessionManager)                │  │
│  │  2. Add Message to History                              │  │
│  │  3. Build LLM Messages (with System Prompt)             │  │
│  │  4. Call LLM (LLMClient → OpenAI GPT-4o)               │  │
│  │  5. Parse Tool Calls                                    │  │
│  │  6. Execute Tools (MCPToolExecutor)                     │  │
│  │  7. Format Results & Loop (max 5 iterations)            │  │
│  │  8. Return Final Response                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
        ┌──────────────┐ ┌──────────┐ ┌──────────┐
        │ LLMClient    │ │SessionMgr│ │MCPTool   │
        │(GPT-4o)      │ │(Context) │ │Executor  │
        └──────────────┘ └──────────┘ └──────────┘
                │            │            │
                │            │      ┌─────┴─────┐
                │            │      │           │
                ▼            ▼      ▼           ▼
        ┌──────────────┐ ┌──────────┐ ┌──────────┐
        │ OpenAI API   │ │In-Memory │ │MCP Server│
        │              │ │Sessions  │ │(Fast DB) │
        └──────────────┘ └──────────┘ └──────────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │ PostgreSQL   │
                                    │ Database     │
                                    └──────────────┘
```

### Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      FoodBridgeAgent                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ processMessage(request)                                 │   │
│  │                                                         │   │
│  │  1. sessionManager.getSession() ──────────────────┐    │   │
│  │                                                   │    │   │
│  │  2. sessionManager.addMessage() ◄────────────────┤    │   │
│  │                                                   │    │   │
│  │  3. buildMessages() ◄──────────────────────────┐ │    │   │
│  │     - getSystemPrompt()                        │ │    │   │
│  │     - Add conversation history                 │ │    │   │
│  │                                                │ │    │   │
│  │  4. llmClient.chat(messages) ◄────────────────┤ │    │   │
│  │     - Send to OpenAI                           │ │    │   │
│  │     - Get response + tool calls                │ │    │   │
│  │                                                │ │    │   │
│  │  5. Loop while toolCalls.length > 0:           │ │    │   │
│  │     - executeTools() ◄──────────────────────┐  │ │    │   │
│  │       - MCPToolExecutor.execute()           │  │ │    │   │
│  │       - Get tool results                    │  │ │    │   │
│  │     - buildToolResultMessages()             │  │ │    │   │
│  │     - llmClient.chat() [with results]       │  │ │    │   │
│  │                                             │  │ │    │   │
│  │  6. sessionManager.addMessage() ◄───────────┤  │ │    │   │
│  │     - Add final response                    │  │ │    │   │
│  │                                             │  │ │    │   │
│  │  7. Return AgentResponse                    │  │ │    │   │
│  │                                             │  │ │    │   │
│  └─────────────────────────────────────────────┘  │ │    │   │
│                                                   │ │    │   │
│  ┌─────────────────────────────────────────────┐  │ │    │   │
│  │ SessionManager                              │  │ │    │   │
│  │ - sessions: Map<sessionId, SessionData>     │◄─┘ │    │   │
│  │ - createSession()                           │    │    │   │
│  │ - getSession()                              │    │    │   │
│  │ - addMessage()                              │    │    │   │
│  │ - endSession()                              │    │    │   │
│  └─────────────────────────────────────────────┘    │    │   │
│                                                     │    │   │
│  ┌─────────────────────────────────────────────┐    │    │   │
│  │ LLMClient                                   │◄───┘    │   │
│  │ - client: OpenAI                            │         │   │
│  │ - chat(messages)                            │         │   │
│  │ - buildToolDefinitions()                    │         │   │
│  └─────────────────────────────────────────────┘         │   │
│                                                          │   │
│  ┌─────────────────────────────────────────────┐         │   │
│  │ MCPToolExecutor                             │◄────────┘   │
│  │ - execute(toolName, args)                   │             │
│  │ - executeMCPTool()                          │             │
│  │ - executeAPITool()                          │             │
│  │ - Tool-specific methods                     │             │
│  └─────────────────────────────────────────────┘             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Message Flow Diagrams

### Simple Query (No Tools)

```
User: "Hello"
  │
  ├─→ Agent receives message
  │
  ├─→ Load session
  │
  ├─→ Add to history: [user: "Hello"]
  │
  ├─→ Build messages:
  │   [system: "You are...", user: "Hello"]
  │
  ├─→ Call LLM
  │
  ├─→ LLM response:
  │   content: "Hi! How can I help?"
  │   toolCalls: []
  │
  ├─→ No tools needed
  │
  ├─→ Add to history: [assistant: "Hi! How can I help?"]
  │
  └─→ Return response
```

### Tool Execution Flow

```
User: "Find vegetarian meals"
  │
  ├─→ Agent receives message
  │
  ├─→ Load session
  │
  ├─→ Add to history: [user: "Find vegetarian meals"]
  │
  ├─→ Build messages:
  │   [system: "You are...", user: "Find vegetarian meals"]
  │
  ├─→ Call LLM
  │
  ├─→ LLM response:
  │   content: "I'll search for vegetarian meals..."
  │   toolCalls: [{
  │     id: "call_123",
  │     name: "search_food",
  │     arguments: { dietary_filters: ["vegetarian"] }
  │   }]
  │
  ├─→ Execute tool: search_food
  │   ├─→ MCPToolExecutor.execute()
  │   ├─→ Call MCP server
  │   └─→ Get results: [listing1, listing2, ...]
  │
  ├─→ Format tool results
  │
  ├─→ Add to history:
  │   [assistant: "I'll search...", user: "Tool results: ..."]
  │
  ├─→ Call LLM again (with tool results)
  │
  ├─→ LLM response:
  │   content: "I found 5 vegetarian meals..."
  │   toolCalls: []
  │
  ├─→ No more tools
  │
  ├─→ Add to history: [assistant: "I found 5..."]
  │
  └─→ Return response
```

### Multi-Tool Execution Flow

```
User: "Reserve the first vegetarian meal"
  │
  ├─→ Agent receives message
  │
  ├─→ Load session (has previous search context)
  │
  ├─→ Add to history: [user: "Reserve the first..."]
  │
  ├─→ Build messages:
  │   [system: "...", user: "Find veg...", assistant: "I found 5...",
  │    user: "Reserve the first..."]
  │
  ├─→ Call LLM (with full context)
  │
  ├─→ LLM response:
  │   content: "I'll get the details and reserve it..."
  │   toolCalls: [{
  │     id: "call_124",
  │     name: "get_listing_details",
  │     arguments: { listing_id: "listing_1" }
  │   }]
  │
  ├─→ Execute tool: get_listing_details
  │   └─→ Get: {id, name, quantity, price, ...}
  │
  ├─→ Add to history: [assistant: "I'll get...", user: "Tool results: ..."]
  │
  ├─→ Call LLM again
  │
  ├─→ LLM response:
  │   content: "Now I'll reserve it..."
  │   toolCalls: [{
  │     id: "call_125",
  │     name: "reserve_food",
  │     arguments: { listing_id: "listing_1", quantity: 1 }
  │   }]
  │
  ├─→ Execute tool: reserve_food
  │   ├─→ MCPToolExecutor.execute()
  │   ├─→ Call REST API (write operation)
  │   └─→ Get: {reservation_id, status, pickup_time, ...}
  │
  ├─→ Add to history: [assistant: "Now I'll...", user: "Tool results: ..."]
  │
  ├─→ Call LLM again
  │
  ├─→ LLM response:
  │   content: "Great! I've reserved the meal for you..."
  │   toolCalls: []
  │
  ├─→ No more tools
  │
  ├─→ Add to history: [assistant: "Great! I've reserved..."]
  │
  └─→ Return response
```

## Data Structures

### AgentRequest
```typescript
{
  sessionId: string;           // Unique session identifier
  userId: string;              // User ID from JWT
  userRole: "student" | "provider" | "admin";
  userToken: string;           // JWT token for API calls
  message: string;             // User's chat message
}
```

### AgentResponse
```typescript
{
  sessionId: string;           // Same session ID
  response: string;            // Final response to user
  toolsUsed: string[];         // List of tools executed
  success: boolean;            // Success/failure flag
  error?: string;              // Error message if failed
}
```

### SessionData
```typescript
{
  userId: string;
  userRole: string;
  userToken: string;
  conversationHistory: LLMMessage[];  // Last 20 messages
  createdAt: Date;
  lastActivityAt: Date;
  metadata: Record<string, any>;      // Custom data
}
```

### LLMMessage
```typescript
{
  role: "user" | "assistant" | "system";
  content: string;
}
```

### LLMResponse
```typescript
{
  content: string;             // Assistant's response
  toolCalls: Array<{
    id: string;                // Unique call ID
    name: string;              // Tool name
    arguments: Record<string, any>;  // Tool parameters
  }>;
  stopReason: string;          // "stop" or "tool_calls"
}
```

### ToolResult
```typescript
{
  success: boolean;
  data?: any;                  // Tool result data
  error?: string;              // Error message if failed
}
```

## State Management

### Session State Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                    Session Lifecycle                    │
└─────────────────────────────────────────────────────────┘

1. CREATED
   ├─ sessionManager.createSession()
   ├─ Initialize empty conversationHistory
   └─ Set createdAt and lastActivityAt

2. ACTIVE
   ├─ User sends message
   ├─ Add message to history
   ├─ Update lastActivityAt
   └─ Process through agent

3. IDLE
   ├─ No activity for 30 minutes
   ├─ Cleanup interval detects timeout
   └─ Session deleted

4. ENDED
   ├─ agent.endSession() called
   ├─ sessionManager.endSession()
   └─ Session removed from memory
```

### Conversation History Management

```
Message 1: User "Hello"
Message 2: Assistant "Hi there!"
Message 3: User "Find meals"
Message 4: Assistant "I'll search..."
Message 5: User "Tool results: ..."
Message 6: Assistant "I found 5 meals"
...
Message 19: User "..."
Message 20: Assistant "..."
Message 21: User "..." ← New message
           ↓
           Trim to last 20 messages
           ↓
Message 2: Assistant "Hi there!"
Message 3: User "Find meals"
...
Message 20: Assistant "..."
Message 21: User "..." ← New message
```

## Tool Execution Strategy

### Read Operations (MCP)

```
Tool Call: search_food
  │
  ├─→ MCPToolExecutor.execute()
  │
  ├─→ Check useMCP flag (true)
  │
  ├─→ executeMCPTool()
  │
  ├─→ Call MCP server
  │   └─→ Fast database query
  │
  ├─→ Parse results
  │
  └─→ Return ToolResult
      {
        success: true,
        data: [listing1, listing2, ...]
      }
```

### Write Operations (REST API)

```
Tool Call: reserve_food
  │
  ├─→ MCPToolExecutor.execute()
  │
  ├─→ Check tool type (write)
  │
  ├─→ executeAPITool()
  │
  ├─→ Build API request
  │   ├─ URL: /api/listings/{id}/reserve
  │   ├─ Method: POST
  │   ├─ Headers: Authorization: Bearer {token}
  │   └─ Body: {quantity, pickup_time, notes}
  │
  ├─→ Call backend API
  │
  ├─→ Handle response
  │
  └─→ Return ToolResult
      {
        success: true,
        data: {
          reservation_id: "res_123",
          status: "confirmed",
          pickup_time: "2024-03-15T14:00:00Z"
        }
      }
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│                   Error Handling                        │
└─────────────────────────────────────────────────────────┘

Try Block:
  ├─ Load session
  ├─ Add message
  ├─ Call LLM
  ├─ Execute tools
  └─ Generate response

Catch Block:
  ├─ Log error
  ├─ Create error response:
  │  {
  │    sessionId: request.sessionId,
  │    response: "I encountered an error...",
  │    toolsUsed: [],
  │    success: false,
  │    error: error.message
  │  }
  └─ Return to user

Tool-Level Errors:
  ├─ Tool execution fails
  ├─ Catch error in executor
  ├─ Return ToolResult with error
  ├─ LLM sees error in tool results
  ├─ LLM generates recovery response
  └─ Continue conversation
```

## Performance Characteristics

### Latency Breakdown

```
Simple Response (no tools):
  ├─ Session lookup: ~1ms
  ├─ Message history: ~1ms
  ├─ LLM call: ~400-600ms
  ├─ Response formatting: ~10ms
  └─ Total: ~500ms

Single Tool Execution:
  ├─ Session lookup: ~1ms
  ├─ LLM call 1: ~400ms
  ├─ Tool execution: ~200-800ms
  ├─ LLM call 2: ~400ms
  ├─ Response formatting: ~10ms
  └─ Total: ~1-2s

Multi-Tool Execution (2 tools):
  ├─ Session lookup: ~1ms
  ├─ LLM call 1: ~400ms
  ├─ Tool 1 execution: ~200-400ms
  ├─ Tool 2 execution: ~200-400ms
  ├─ LLM call 2: ~400ms
  ├─ Response formatting: ~10ms
  └─ Total: ~2-3s
```

### Memory Usage

```
Per Session:
  ├─ Session metadata: ~1KB
  ├─ Conversation history (20 msgs): ~50KB
  ├─ User preferences: ~5KB
  └─ Total per session: ~60KB

Concurrent Sessions:
  ├─ 100 sessions: ~6MB
  ├─ 1000 sessions: ~60MB
  ├─ 10000 sessions: ~600MB
  └─ Cleanup: Automatic after 30 min inactivity
```

## Scalability Considerations

### Horizontal Scaling

```
Load Balancer
  │
  ├─→ Server 1 (Agent Instance 1)
  │   └─ SessionManager (local)
  │
  ├─→ Server 2 (Agent Instance 2)
  │   └─ SessionManager (local)
  │
  └─→ Server 3 (Agent Instance 3)
      └─ SessionManager (local)

Shared Resources:
  ├─ OpenAI API (rate limited)
  ├─ MCP Server (database)
  ├─ Backend API (database)
  └─ Redis (optional session store)
```

### Session Persistence (Future)

```
Current (In-Memory):
  ├─ Fast access
  ├─ Limited to single server
  └─ Lost on restart

Future (Redis/Database):
  ├─ Shared across servers
  ├─ Survives restarts
  ├─ Slightly slower
  └─ Enables true horizontal scaling
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Security Layers                        │
└─────────────────────────────────────────────────────────┘

1. Authentication
   ├─ JWT token validation
   ├─ Token extraction from header
   └─ Token expiration check

2. Authorization
   ├─ User role verification
   ├─ Tool permission checks
   └─ Data access control

3. Data Protection
   ├─ Sensitive data sanitization
   ├─ Error message filtering
   ├─ Log security
   └─ Token security

4. Tool Execution
   ├─ Token passing to tools
   ├─ API authentication
   ├─ Request validation
   └─ Response validation
```

## Integration Points

### Frontend Integration

```
Frontend
  │
  ├─→ POST /api/agent/chat
  │   ├─ Headers: Authorization: Bearer {token}
  │   └─ Body: {sessionId, message}
  │
  ├─→ Receive AgentResponse
  │   ├─ Display response
  │   ├─ Track tools used
  │   └─ Handle errors
  │
  └─→ Maintain sessionId for multi-turn
```

### Backend Integration

```
Express Route
  │
  ├─→ Validate JWT
  ├─→ Extract user context
  ├─→ Create AgentRequest
  ├─→ Call agent.processMessage()
  ├─→ Receive AgentResponse
  ├─→ Format HTTP response
  └─→ Send to client
```

### Database Integration

```
MCP Server (Reads)
  ├─ search_food
  ├─ get_listing_details
  ├─ get_pantry_slots
  └─ get_notifications

REST API (Writes)
  ├─ reserve_food
  ├─ cancel_reservation
  ├─ book_pantry
  └─ generate_pantry_cart
```

This architecture ensures reliable, scalable, and secure conversational AI for the FoodBridge platform.
