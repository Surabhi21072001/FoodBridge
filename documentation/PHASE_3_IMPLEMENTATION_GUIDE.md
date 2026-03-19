# Phase 3 Implementation Guide: AI Agent Tool Layer

## Overview

Phase 3 implements the AI agent tool layer for FoodBridge, enabling conversational AI interactions with the backend API. The agent uses GPT-4o for natural language understanding and function calling to execute structured tools.

## Architecture

```
User Message
    ↓
Chat Endpoint (/api/chat)
    ↓
Session Manager (maintains conversation context)
    ↓
LLM Client (GPT-4o with function calling)
    ↓
Tool Executor (maps to backend API endpoints)
    ↓
Backend API (existing Phase 2 endpoints)
    ↓
Database
```

## What's Been Implemented

### 1. Tool Definitions (`src/agent/tools/definitions.ts`)
- 11 structured tools with schemas
- Maps conversational intents to API operations
- Tools: search_food, reserve_food, book_pantry, get_notifications, etc.

### 2. Tool Executor (`src/agent/tools/executor.ts`)
- Executes tools by calling backend API endpoints
- Handles authentication with JWT tokens
- Parses and formats tool results
- Error handling and graceful degradation

### 3. LLM Client (`src/agent/llm/client.ts`)
- OpenAI GPT-4o integration
- Function calling support
- Configurable temperature and max tokens
- Parses tool calls from LLM responses

### 4. System Prompts (`src/agent/llm/prompts.ts`)
- Role-specific system prompts (student/provider)
- Tool result formatting for readability
- Context-aware response generation

### 5. Session Manager (`src/agent/session/manager.ts`)
- Manages conversation sessions
- Maintains conversation history (last 20 messages)
- Automatic session cleanup after timeout
- Metadata storage for user context

### 6. Agent Orchestrator (`src/agent/agent.ts`)
- Coordinates LLM reasoning and tool execution
- Implements tool calling loop (max 5 iterations)
- Manages conversation flow
- Error handling and recovery

### 7. Chat Controller (`src/controllers/chatController.ts`)
- Handles POST /api/chat requests
- Session management
- Input validation
- Response formatting

### 8. Chat Routes (`src/routes/chatRoutes.ts`)
- POST /api/chat - Send message to agent
- POST /api/chat/:sessionId/end - End session
- Authentication required
- Rate limiting applied

### 9. Chat Rate Limiting (`src/middleware/chatRateLimit.ts`)
- Per-user rate limiting
- 20 requests per minute (configurable)
- Automatic cleanup of expired entries

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

This installs:
- `openai` - OpenAI API client
- `axios` - HTTP client for tool execution
- `uuid` - Session ID generation
- `ioredis` - Redis client (for future caching)

### Step 2: Configure Environment Variables

Update `backend/.env` with your OpenAI API key:

```env
# Phase 3: AI Agent Configuration
OPENAI_API_KEY=sk-proj-your-actual-key-here
LLM_MODEL=gpt-4o
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=2000

# Chat Rate Limiting
CHAT_RATE_LIMIT_REQUESTS=20
CHAT_RATE_LIMIT_WINDOW_MS=60000

# Session Management
SESSION_TIMEOUT_MINUTES=30
REDIS_URL=redis://localhost:6379

# Agent Configuration
AGENT_LOG_LEVEL=info
ENABLE_PREFERENCE_LEARNING=true
```

### Step 3: Build and Run

```bash
# Build TypeScript
npm run build

# Start development server
npm run dev
```

The server will start on port 3000 with the chat endpoint available at `/api/chat`.

## API Usage

### Send Message to Agent

**Endpoint:** `POST /api/chat`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Find me vegetarian meals available now",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "response": "I found 3 vegetarian meals available right now...",
    "toolsUsed": ["search_food"],
    "timestamp": "2026-03-11T10:30:00Z"
  }
}
```

### End Session

**Endpoint:** `POST /api/chat/:sessionId/end`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Session ended successfully"
}
```

## Tool Definitions

### 1. search_food
Search for available food listings with filters.

**Parameters:**
- `dietary_filters` (array) - Dietary tags (vegetarian, vegan, etc.)
- `category` (string) - meal, snack, beverage, pantry_item, deal, event_food
- `available_now` (boolean) - Only currently available
- `page` (number) - Pagination
- `limit` (number) - Results per page

### 2. get_listing_details
Get detailed information about a specific listing.

**Parameters:**
- `listing_id` (string, required) - The listing ID

### 3. reserve_food
Create a reservation for a food listing.

**Parameters:**
- `listing_id` (string, required) - The listing ID
- `quantity` (number, required) - Servings to reserve
- `pickup_time` (string) - Preferred pickup time
- `notes` (string) - Special requests

### 4. cancel_reservation
Cancel an existing reservation.

**Parameters:**
- `reservation_id` (string, required) - The reservation ID

### 5. get_pantry_slots
Get available pantry appointment time slots.

**Parameters:**
- `date` (string) - Date to check (ISO 8601)

### 6. book_pantry
Book a pantry appointment.

**Parameters:**
- `appointment_time` (string, required) - Appointment time (ISO 8601)
- `duration_minutes` (number) - Duration (default: 30)
- `notes` (string) - Special requests

### 7. get_notifications
Retrieve user notifications.

**Parameters:**
- `is_read` (boolean) - Filter by read status
- `limit` (number) - Number to retrieve

### 8. get_user_preferences
Get user's dietary preferences and restrictions.

**Parameters:** None

### 9. get_frequent_items
Get user's frequently selected pantry items.

**Parameters:**
- `limit` (number) - Number of items

### 10. generate_pantry_cart
Generate recommended pantry cart from history.

**Parameters:**
- `include_frequent` (boolean) - Include frequent items
- `respect_preferences` (boolean) - Respect dietary preferences

### 11. get_dining_deals
Get current dining discounts and offers.

**Parameters:**
- `limit` (number) - Number of deals

## Conversation Flow Example

**User:** "I'm vegetarian and looking for lunch"

**Agent Process:**
1. Parse user intent: searching for food with dietary filter
2. Call `search_food` tool with dietary_filters: ["vegetarian"]
3. Format results from backend
4. Generate response with recommendations

**Agent Response:** "I found 5 vegetarian lunch options available now. Here are the top picks..."

## Session Management

Sessions are automatically created on first message and maintained for 30 minutes of inactivity.

**Session Data:**
- Conversation history (last 20 messages)
- User ID and role
- User preferences and metadata
- Creation and last activity timestamps

**Automatic Cleanup:**
- Sessions expire after 30 minutes of inactivity
- Cleanup runs every 5 minutes
- Old entries are removed from memory

## Error Handling

### Rate Limit Exceeded
```json
{
  "success": false,
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "retryAfter": 45
}
```

### Authentication Failed
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### Tool Execution Failed
```json
{
  "success": false,
  "message": "I encountered an error processing your request. Please try again."
}
```

## Testing the Agent

### Manual Testing with cURL

```bash
# Get JWT token first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'

# Use token in chat request
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me available meals"
  }'
```

### Test Scenarios

1. **Search Food**
   - "Find vegetarian meals"
   - "Show me deals available now"
   - "What snacks do you have?"

2. **Make Reservation**
   - "Reserve 2 servings of the pizza"
   - "Book the pasta for me"

3. **Book Pantry**
   - "Book a pantry appointment tomorrow at 2pm"
   - "When can I visit the pantry?"

4. **Get Recommendations**
   - "What should I get from the pantry?"
   - "Suggest items based on my history"

5. **Check Notifications**
   - "Do I have any notifications?"
   - "Show me my food alerts"

## Performance Considerations

### Response Time Targets
- LLM response: 1-2 seconds
- Tool execution: 500-1000ms
- Total: < 3 seconds

### Optimization Tips
1. Keep conversation history to last 20 messages
2. Cache frequently accessed data
3. Use pagination for large result sets
4. Implement Redis for session caching (future)

## Security Considerations

### Authentication
- All chat endpoints require JWT authentication
- User token passed to tool executor
- User ID extracted from JWT claims

### Authorization
- Role-based access control (student/provider)
- Tools respect user permissions
- Providers can't access student reservations

### Rate Limiting
- 20 requests per minute per user
- Prevents abuse and API overload
- Configurable via environment variables

### Input Validation
- Message length validation
- Tool parameter validation
- SQL injection prevention (via parameterized queries)

## Monitoring and Logging

### Logs to Track
- User messages and agent responses
- Tool executions and results
- Errors and exceptions
- Rate limit violations
- Session lifecycle events

### Future Enhancements
- Structured logging with Winston
- Metrics collection with Prometheus
- Distributed tracing with OpenTelemetry
- Analytics dashboard

## Next Steps

### Phase 3a: Foundation (Complete ✅)
- ✅ Tool definitions
- ✅ Tool executor
- ✅ LLM client
- ✅ Session manager
- ✅ Chat endpoint

### Phase 3b: Testing
- [ ] Unit tests for tools
- [ ] Integration tests for chat flows
- [ ] E2E tests for complete scenarios
- [ ] Load testing

### Phase 3c: Enhancements
- [ ] Preference learning improvements
- [ ] Smart cart optimization
- [ ] Multi-turn conversation context
- [ ] Logging and observability

### Phase 3d: Production
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Deployment

## Troubleshooting

### "Invalid API Key" Error
- Check OPENAI_API_KEY in .env
- Verify key is valid and not expired
- Ensure key has chat completion permissions

### "Tool execution failed" Error
- Check backend API is running
- Verify JWT token is valid
- Check user has permission for action
- Review backend logs for details

### Rate Limit Exceeded
- Wait for window to reset (1 minute)
- Reduce message frequency
- Increase CHAT_RATE_LIMIT_REQUESTS if needed

### Session Not Found
- Session may have expired (30 minutes)
- Create new session by omitting sessionId
- Check SESSION_TIMEOUT_MINUTES setting

## Support

For issues or questions:
1. Check this guide first
2. Review backend logs
3. Check OpenAI API status
4. Review tool definitions and schemas
5. Test with manual cURL requests

---

**Phase 3 Status:** Foundation Complete ✅
**Ready for:** Testing and Integration
**Last Updated:** March 11, 2026
