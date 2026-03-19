# Phase 3 Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Frontend Application                             │
│                    (React/Vue Web Interface)                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTP/WebSocket
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                      Express.js Backend Server                           │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Chat Endpoint                                  │   │
│  │                  POST /api/chat                                   │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │  Chat Controller                                        │    │   │
│  │  │  - Validate input                                       │    │   │
│  │  │  - Extract user context                                 │    │   │
│  │  │  - Format response                                      │    │   │
│  │  └──────────────────────┬──────────────────────────────────┘    │   │
│  │                         │                                        │   │
│  │  ┌──────────────────────▼──────────────────────────────────┐    │   │
│  │  │  Chat Rate Limit Middleware                            │    │   │
│  │  │  - 20 requests/minute per user                          │    │   │
│  │  │  - Return 429 if exceeded                               │    │   │
│  │  └──────────────────────┬──────────────────────────────────┘    │   │
│  │                         │                                        │   │
│  │  ┌──────────────────────▼──────────────────────────────────┐    │   │
│  │  │  Session Manager                                        │    │   │
│  │  │  - Create/retrieve session                              │    │   │
│  │  │  - Maintain conversation history                        │    │   │
│  │  │  - Store user metadata                                  │    │   │
│  │  │  - Auto-cleanup after 30 min                            │    │   │
│  │  └──────────────────────┬──────────────────────────────────┘    │   │
│  │                         │                                        │   │
│  │  ┌──────────────────────▼──────────────────────────────────┐    │   │
│  │  │  FoodBridge Agent Orchestrator                          │    │   │
│  │  │  - Coordinate LLM & tool execution                      │    │   │
│  │  │  - Implement tool calling loop                          │    │   │
│  │  │  - Manage conversation flow                             │    │   │
│  │  │  - Error handling & recovery                            │    │   │
│  │  └──────────────────────┬──────────────────────────────────┘    │   │
│  │                         │                                        │   │
│  │  ┌──────────────────────▼──────────────────────────────────┐    │   │
│  │  │  LLM Client (GPT-4o)                                    │    │   │
│  │  │  - Send messages to OpenAI                              │    │   │
│  │  │  - Function calling support                             │    │   │
│  │  │  - Parse tool calls                                     │    │   │
│  │  │  - Temperature: 0.3 (consistent)                        │    │   │
│  │  │  - Max tokens: 2000                                     │    │   │
│  │  └──────────────────────┬──────────────────────────────────┘    │   │
│  │                         │                                        │   │
│  │  ┌──────────────────────▼──────────────────────────────────┐    │   │
│  │  │  Tool Executor                                          │    │   │
│  │  │  - Execute 11 tools                                     │    │   │
│  │  │  - Call backend APIs                                    │    │   │
│  │  │  - Handle authentication                                │    │   │
│  │  │  - Format results                                       │    │   │
│  │  │  - Error handling                                       │    │   │
│  │  └──────────────────────┬──────────────────────────────────┘    │   │
│  │                         │                                        │   │
│  └─────────────────────────┼────────────────────────────────────────┘   │
│                            │                                             │
└────────────────────────────┼─────────────────────────────────────────────┘
                             │
                             │ HTTP Requests
                             │
┌────────────────────────────▼─────────────────────────────────────────────┐
│                    Backend API Endpoints (Phase 2)                        │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Listings API                                                    │   │
│  │  - GET /api/listings (search_food)                               │   │
│  │  - GET /api/listings/:id (get_listing_details)                   │   │
│  │  - POST /api/listings (create listing)                           │   │
│  │  - PUT /api/listings/:id (update listing)                        │   │
│  │  - DELETE /api/listings/:id (delete listing)                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Reservations API                                                │   │
│  │  - POST /api/reservations (reserve_food)                         │   │
│  │  - GET /api/reservations (get reservations)                      │   │
│  │  - DELETE /api/reservations/:id (cancel_reservation)             │   │
│  │  - POST /api/reservations/:id/confirm-pickup                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Pantry API                                                      │   │
│  │  - GET /api/pantry/appointments/slots (get_pantry_slots)         │   │
│  │  - POST /api/pantry/appointments (book_pantry)                   │   │
│  │  - GET /api/pantry/inventory (browse inventory)                  │   │
│  │  - GET /api/pantry/orders/cart (get cart)                        │   │
│  │  - POST /api/pantry/orders/cart/items (add to cart)              │   │
│  │  - POST /api/pantry/orders/cart/submit (submit order)            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Notifications API                                               │   │
│  │  - GET /api/notifications (get_notifications)                    │   │
│  │  - PUT /api/notifications/:id/read                               │   │
│  │  - DELETE /api/notifications/:id                                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Preferences API                                                 │   │
│  │  - GET /api/preferences/user/:id (get_user_preferences)          │   │
│  │  - GET /api/preferences/frequent-items/:id (get_frequent_items)  │   │
│  │  - GET /api/preferences/recommendations/:id (generate_cart)      │   │
│  │  - PUT /api/preferences/user/:id (update preferences)            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             │ SQL Queries
                             │
┌────────────────────────────▼─────────────────────────────────────────────┐
│                      PostgreSQL Database                                  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Tables                                                          │   │
│  │  - users                                                         │   │
│  │  - listings                                                      │   │
│  │  - reservations                                                  │   │
│  │  - pantry_appointments                                           │   │
│  │  - pantry_inventory                                              │   │
│  │  - pantry_orders                                                 │   │
│  │  - notifications                                                 │   │
│  │  - user_preferences                                              │   │
│  │  - preference_history                                            │   │
│  │  - volunteer_opportunities                                       │   │
│  │  - volunteer_signups                                             │   │
│  │  - and more...                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: User Message to Response

```
1. User sends message
   │
   ├─ "Find me vegetarian meals"
   │
   ▼
2. Chat Endpoint receives request
   │
   ├─ Validate input
   ├─ Extract JWT token
   ├─ Get user ID and role
   │
   ▼
3. Rate Limit Check
   │
   ├─ Check user's request count
   ├─ If exceeded: return 429
   ├─ Otherwise: increment counter
   │
   ▼
4. Session Manager
   │
   ├─ Get or create session
   ├─ Add user message to history
   ├─ Retrieve conversation context
   │
   ▼
5. LLM Client (GPT-4o)
   │
   ├─ Build message array with system prompt
   ├─ Send to OpenAI API
   ├─ Receive response with tool calls
   │
   ▼
6. Tool Executor
   │
   ├─ Parse tool calls from LLM
   ├─ For each tool:
   │  ├─ Validate parameters
   │  ├─ Call backend API
   │  ├─ Format result
   │  └─ Handle errors
   │
   ▼
7. LLM Client (Second Pass)
   │
   ├─ Add tool results to conversation
   ├─ Send to OpenAI API again
   ├─ Receive final response
   │
   ▼
8. Response Formatting
   │
   ├─ Add response to session history
   ├─ Format JSON response
   ├─ Include session ID and tools used
   │
   ▼
9. Return to User
   │
   └─ {
       "success": true,
       "data": {
         "sessionId": "...",
         "response": "I found 3 vegetarian meals...",
         "toolsUsed": ["search_food"],
         "timestamp": "..."
       }
     }
```

---

## Tool Execution Flow

```
Tool Call from LLM
    │
    ├─ Tool Name: "search_food"
    ├─ Parameters: {
    │    "dietary_filters": ["vegetarian"],
    │    "category": "meal",
    │    "available_now": true
    │  }
    │
    ▼
Tool Executor
    │
    ├─ Validate parameters
    ├─ Build API request
    │  ├─ URL: GET /api/listings
    │  ├─ Query params: dietary_tags=vegetarian&category=meal&available_now=true
    │  ├─ Headers: Authorization: Bearer <token>
    │
    ▼
Backend API
    │
    ├─ Authenticate user
    ├─ Query database
    ├─ Filter results
    ├─ Return JSON response
    │
    ▼
Tool Executor
    │
    ├─ Parse response
    ├─ Format for LLM
    │  ├─ Extract key fields
    │  ├─ Limit to top 5 results
    │  ├─ Create readable format
    │
    ▼
LLM Receives Result
    │
    └─ "Found 3 vegetarian meals:
        1. Veggie Wrap - $5.99
        2. Buddha Bowl - $6.99
        3. Salad - $4.99"
```

---

## Session Management

```
Session Lifecycle
    │
    ├─ Create Session
    │  ├─ Generate UUID
    │  ├─ Store user ID, role, token
    │  ├─ Initialize empty history
    │  ├─ Set creation time
    │
    ▼
    │
    ├─ Add Messages
    │  ├─ User message added
    │  ├─ Assistant response added
    │  ├─ Keep last 20 messages
    │  ├─ Update last activity time
    │
    ▼
    │
    ├─ Retrieve Session
    │  ├─ Look up by session ID
    │  ├─ Update last activity time
    │  ├─ Return session data
    │
    ▼
    │
    ├─ Cleanup (Automatic)
    │  ├─ Check every 5 minutes
    │  ├─ If inactive > 30 minutes
    │  ├─ Delete session
    │  ├─ Free memory
    │
    ▼
    │
    └─ End Session (Manual)
       ├─ User calls /api/chat/:sessionId/end
       ├─ Delete session immediately
       ├─ Return success
```

---

## Rate Limiting

```
Request arrives
    │
    ├─ Extract user ID from JWT
    │
    ▼
Check Rate Limit Store
    │
    ├─ If user not in store:
    │  ├─ Create entry
    │  ├─ Set count = 1
    │  ├─ Set reset time = now + 60 seconds
    │  ├─ Allow request
    │
    ├─ If reset time passed:
    │  ├─ Reset count = 1
    │  ├─ Set new reset time
    │  ├─ Allow request
    │
    ├─ If count < 20:
    │  ├─ Increment count
    │  ├─ Allow request
    │
    └─ If count >= 20:
       ├─ Calculate seconds until reset
       ├─ Return 429 Too Many Requests
       ├─ Include Retry-After header
       ├─ Block request
```

---

## Error Handling

```
Error Occurs
    │
    ├─ Tool Execution Error
    │  ├─ Backend API returns error
    │  ├─ Tool executor catches error
    │  ├─ Formats error message
    │  ├─ Continues with other tools
    │  ├─ LLM generates fallback response
    │
    ├─ LLM Error
    │  ├─ OpenAI API error
    │  ├─ Agent catches error
    │  ├─ Returns user-friendly message
    │  ├─ Logs error for debugging
    │
    ├─ Authentication Error
    │  ├─ Invalid or missing JWT
    │  ├─ Return 401 Unauthorized
    │  ├─ User must re-authenticate
    │
    ├─ Rate Limit Error
    │  ├─ User exceeded limit
    │  ├─ Return 429 Too Many Requests
    │  ├─ Include Retry-After header
    │
    └─ Validation Error
       ├─ Invalid input parameters
       ├─ Return 400 Bad Request
       ├─ Include error details
```

---

## Component Interactions

```
┌─────────────────────────────────────────────────────────────┐
│                    Chat Controller                          │
│  - Receives HTTP request                                    │
│  - Validates input                                          │
│  - Calls Agent.processMessage()                             │
│  - Returns formatted response                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              FoodBridge Agent                               │
│  - Manages conversation flow                                │
│  - Calls LLMClient.chat()                                   │
│  - Calls ToolExecutor.execute()                             │
│  - Manages session via SessionManager                       │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────────┐  ┌──────────────────┐
│  LLM Client      │  │ Tool Executor    │
│  - Calls OpenAI  │  │ - Calls APIs     │
│  - Parses tools  │  │ - Formats data   │
└──────────────────┘  └──────────────────┘
        │                 │
        └────────┬────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│           Session Manager                                   │
│  - Stores conversation history                              │
│  - Manages session lifecycle                                │
│  - Auto-cleanup                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                            │
│              (Optional for scaling)                         │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────────┐  ┌──────────────────┐
│  Express Server  │  │  Express Server  │
│  Instance 1      │  │  Instance 2      │
│  (Port 3000)     │  │  (Port 3000)     │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         └──────────┬──────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  PostgreSQL Database │
         │  (Shared)            │
         └──────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Redis Cache         │
         │  (Optional)          │
         └──────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  OpenAI API          │
         │  (External)          │
         └──────────────────────┘
```

---

## Performance Targets

```
User Message
    │
    ├─ Chat Controller: 10ms
    ├─ Rate Limit Check: 5ms
    ├─ Session Manager: 10ms
    ├─ LLM Client (GPT-4o): 1000-2000ms ⭐ (main latency)
    ├─ Tool Executor: 500-1000ms
    ├─ Backend API: 100-500ms
    ├─ Response Formatting: 10ms
    │
    ▼
Total: 1.6-3.5 seconds (target: < 3 seconds)
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Request                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              JWT Authentication                             │
│  - Verify token signature                                   │
│  - Check expiration                                         │
│  - Extract user ID and role                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Rate Limiting                                    │
│  - Check user's request count                               │
│  - Enforce 20 requests/minute limit                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Input Validation                                 │
│  - Validate message length                                  │
│  - Validate tool parameters                                 │
│  - Sanitize inputs                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Tool Execution                                   │
│  - Verify user permissions                                  │
│  - Validate tool parameters                                 │
│  - Execute with user context                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Response                                         │
│  - Sanitize error messages                                  │
│  - No sensitive data in response                            │
│  - Log for audit trail                                      │
└─────────────────────────────────────────────────────────────┘
```

---

**Last Updated:** March 11, 2026
**Phase 3 Status:** ✅ Foundation Complete
