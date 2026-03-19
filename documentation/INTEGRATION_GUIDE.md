# FoodBridge Backend Integration Guide

## Overview

This guide explains the newly implemented integration layers that connect the AI agent orchestrator with the backend services, enabling a complete end-to-end AI food access platform.

## New Components

### 1. Tool Registry Service (`toolRegistryService.ts`)

**Purpose**: Centralized registry mapping tool names to implementations

**Location**: `backend/src/services/toolRegistryService.ts`

**Key Methods**:
- `executeTool(toolName, args, userId)` - Execute any registered tool
- `getAvailableTools()` - Get list of all available tools

**Registered Tools**:
- `search_food` - Search listings with filters
- `get_listing_details` - Get specific listing info
- `reserve_food` - Create reservation
- `cancel_reservation` - Cancel reservation
- `get_pantry_slots` - Get available appointment times
- `book_pantry` - Book appointment
- `get_notifications` - Get user notifications
- `get_user_preferences` - Get dietary preferences
- `get_frequent_items` - Get user's frequent items
- `generate_pantry_cart` - Generate smart cart
- `get_dining_deals` - Get current deals
- `get_event_food` - Get event food listings

**Usage**:
```typescript
import { toolRegistry } from './services/toolRegistryService';

const result = await toolRegistry.executeTool('search_food', {
  dietary_filters: ['vegetarian'],
  available_now: true,
  limit: 10
}, userId);
```

### 2. Agent Preference Service (`agentPreferenceService.ts`)

**Purpose**: Integrates AI agent with user preference learning system

**Location**: `backend/src/services/agentPreferenceService.ts`

**Key Methods**:
- `getUserPreferenceContext(userId)` - Get complete preference context
- `searchFoodWithPreferences(userId, filters)` - Search with preferences applied
- `getPersonalizedRecommendations(userId, maxItems)` - Get personalized recommendations
- `getPersonalizedDeals(userId, limit)` - Get deals matching preferences
- `getPersonalizedEventFood(userId, limit)` - Get event food matching preferences
- `updatePreferencesFromAgent(userId, updates)` - Update preferences
- `getPreferenceSummary(userId)` - Get human-readable preference summary

**Usage**:
```typescript
import { agentPreferenceService } from './services/agentPreferenceService';

// Get preference context for agent
const context = await agentPreferenceService.getUserPreferenceContext(userId);

// Search with preferences applied
const { listings, appliedPreferences } = 
  await agentPreferenceService.searchFoodWithPreferences(userId, {
    dietary_filters: ['vegan'],
    available_now: true
  });
```

### 3. Smart Pantry Cart Service (`smartPantryCartService.ts`)

**Purpose**: Generates intelligent pantry cart recommendations

**Location**: `backend/src/services/smartPantryCartService.ts`

**Key Methods**:
- `generateSmartCart(userId, options)` - Generate recommendations
- `generateAndAddToCart(userId, options)` - Generate and add to cart
- `getUserUsualItems(userId, limit)` - Get frequently selected items
- `getPreferenceBasedRecommendations(userId, limit)` - Get preference-based items
- `getPopularItems(limit)` - Get popular items
- `getCartSuggestion(userId)` - Get suggestion message

**Usage**:
```typescript
import { smartPantryCartService } from './services/smartPantryCartService';

// Generate smart cart
const cart = await smartPantryCartService.generateSmartCart(userId, {
  include_frequent: true,
  respect_preferences: true,
  max_items: 10
});

// Generate and add to cart
const result = await smartPantryCartService.generateAndAddToCart(userId);
```

## New API Endpoints

### Chat Endpoint (Enhanced)

**Endpoint**: `POST /api/chat`

**Request**:
```json
{
  "message": "Find me vegetarian meals",
  "sessionId": "optional-session-id"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "session-123",
    "response": "I found 5 vegetarian meals available today...",
    "toolsUsed": ["search_food"],
    "timestamp": "2024-03-15T10:30:00Z"
  }
}
```

**Features**:
- Automatically loads user preference context
- Stores preferences in session metadata
- Integrates with tool registry
- Rate limited to 20 requests/minute per user

### Smart Pantry Cart Endpoints

**Generate Smart Cart**
```
GET /api/pantry/cart/generate
Query params:
  - include_frequent: boolean (default: true)
  - respect_preferences: boolean (default: true)
  - max_items: number (default: 10)
```

**Generate and Add to Cart**
```
POST /api/pantry/cart/generate-and-add
Body:
{
  "include_frequent": true,
  "respect_preferences": true,
  "max_items": 10
}
```

**Get User's Usual Items**
```
GET /api/pantry/cart/usual-items
Query params:
  - limit: number (default: 10)
```

**Get Preference-Based Recommendations**
```
GET /api/pantry/cart/preference-based
Query params:
  - limit: number (default: 10)
```

**Get Popular Items**
```
GET /api/pantry/cart/popular
Query params:
  - limit: number (default: 10)
```

**Get Cart Suggestion**
```
GET /api/pantry/cart/suggestion
```

### Event Food Endpoints

**Get Event Food**
```
GET /api/event-food
Query params:
  - available_now: boolean
  - dietary_filters: string (comma-separated)
  - page: number
  - limit: number
```

**Get Today's Event Food**
```
GET /api/event-food/today
```

**Get Upcoming Event Food**
```
GET /api/event-food/upcoming
Query params:
  - days: number (default: 7)
```

**Get Event Food Details**
```
GET /api/event-food/:id
```

**Get Provider's Event Food**
```
GET /api/event-food/provider/:providerId
```

## Integration Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Application                 │
└────────────────────────┬────────────────────────────────┘
                         │
                    HTTP/REST
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Express Backend                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Chat Endpoint (/api/chat)                       │  │
│  │  - Receives user message                         │  │
│  │  - Loads preference context                      │  │
│  │  - Calls FoodBridgeAgent                         │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Tool Registry│  │ Preference   │  │ Smart Pantry │
│ Service      │  │ Service      │  │ Cart Service │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Listing      │  │ Preference   │  │ Pantry Order │
│ Service      │  │ Repository   │  │ Service      │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                    PostgreSQL
                    Database
```

## Workflow Examples

### Example 1: Search with Preferences

```
User: "Find me vegetarian meals"
  ↓
Chat Endpoint receives message
  ↓
Load user preference context (dietary_restrictions: ['vegetarian'])
  ↓
Call FoodBridgeAgent.processMessage()
  ↓
Agent calls search_food tool via Tool Registry
  ↓
Tool Registry calls AgentPreferenceService.searchFoodWithPreferences()
  ↓
Preferences applied: dietary_filters = ['vegetarian']
  ↓
ListingService searches with combined filters
  ↓
Results returned to agent
  ↓
Agent generates response: "I found 5 vegetarian meals..."
  ↓
Response sent to user
```

### Example 2: Smart Pantry Cart Generation

```
User: "I want my usual pantry items"
  ↓
Chat Endpoint receives message
  ↓
Agent calls generate_pantry_cart tool
  ↓
Tool Registry calls SmartPantryCartService.generateSmartCart()
  ↓
Service gets frequent items from PreferenceService
  ↓
Service gets preference-based recommendations
  ↓
Service gets popular items if needed
  ↓
Recommendations returned to agent
  ↓
Agent: "I found 8 items based on your history. Would you like me to add them to your cart?"
  ↓
User: "Yes"
  ↓
Agent calls generate_pantry_cart with add_to_cart flag
  ↓
Items added to user's cart
  ↓
Confirmation sent to user
```

### Example 3: Event Food Discovery

```
User: "Is there free food from events today?"
  ↓
Chat Endpoint receives message
  ↓
Agent calls get_event_food tool
  ↓
Tool Registry calls AgentPreferenceService.getPersonalizedEventFood()
  ↓
Service filters event food by user preferences
  ↓
Service returns today's event food
  ↓
Agent: "Yes! There are 3 events with free food today:
  1. Campus Carnival - 2pm
  2. Club Fair - 3pm
  3. Sustainability Event - 4pm"
  ↓
Response sent to user
```

## Data Flow

### Preference Context Flow

```
User ID
  ↓
AgentPreferenceService.getUserPreferenceContext()
  ├─ PreferenceService.getUserPreferences()
  │  └─ PreferenceRepository.findByUserId()
  │     └─ Database query
  ├─ PreferenceService.getFrequentItems()
  │  └─ PreferenceRepository.getFrequentItems()
  │     └─ Database query
  └─ PreferenceService.getFrequentProviders()
     └─ PreferenceRepository.getFrequentProviders()
        └─ Database query
  ↓
UserPreferenceContext {
  dietary_restrictions: [],
  allergies: [],
  favorite_cuisines: [],
  preferred_providers: [],
  frequent_items: [],
  frequent_providers: []
}
```

### Tool Execution Flow

```
Tool Call (search_food)
  ↓
ToolRegistry.executeTool()
  ├─ Validate tool name
  ├─ Route to specific tool handler
  └─ Call appropriate service method
  ↓
Service executes business logic
  ├─ Apply preferences if applicable
  ├─ Query database
  └─ Format results
  ↓
ToolResult {
  success: true,
  data: { ... }
}
```

## Configuration

### Environment Variables

```bash
# Chat rate limiting
CHAT_RATE_LIMIT_WINDOW_MS=60000      # 1 minute
CHAT_RATE_LIMIT_MAX_REQUESTS=20      # 20 requests per minute

# Preference learning
PREFERENCE_HISTORY_LIMIT=50           # Keep last 50 events
FREQUENT_ITEMS_LIMIT=10               # Show top 10 frequent items

# Smart cart
SMART_CART_MAX_ITEMS=10               # Default max items
SMART_CART_INCLUDE_FREQUENT=true      # Include frequent items
SMART_CART_RESPECT_PREFERENCES=true   # Respect preferences
```

## Error Handling

All services implement consistent error handling:

```typescript
try {
  // Execute operation
} catch (error: any) {
  return {
    success: false,
    error: error.message || 'Operation failed'
  };
}
```

**Common Errors**:
- `NotFoundError` - Resource not found
- `BadRequestError` - Invalid input
- `ForbiddenError` - Access denied
- `ValidationError` - Data validation failed

## Testing

### Unit Tests

```bash
npm test -- services/toolRegistryService.test.ts
npm test -- services/agentPreferenceService.test.ts
npm test -- services/smartPantryCartService.test.ts
```

### Integration Tests

```bash
npm test -- integration/chat.test.ts
npm test -- integration/pantryCart.test.ts
npm test -- integration/eventFood.test.ts
```

### E2E Tests

```bash
npm test -- e2e/agent-workflow.test.ts
npm test -- e2e/preference-learning.test.ts
npm test -- e2e/smart-cart.test.ts
```

## Performance Considerations

### Caching

- User preferences cached in session metadata
- Frequent items cached for 5 minutes
- Popular items cached for 1 hour

### Database Queries

- Indexed queries on user_id, category, dietary_tags
- Pagination for large result sets
- Connection pooling for database

### API Response Times

- Chat endpoint: ~500ms (simple) to ~2s (with tools)
- Pantry cart generation: ~200-500ms
- Event food discovery: ~100-300ms

## Security

### Authentication

- All endpoints require JWT authentication
- User ID extracted from token
- Token passed to backend services

### Authorization

- Users can only access their own data
- Providers can only manage their own listings
- Admins have elevated permissions

### Data Protection

- Sensitive data sanitized in responses
- Error messages don't expose internal details
- Rate limiting prevents abuse

## Monitoring

### Metrics to Track

- Chat message volume
- Tool execution frequency
- Preference learning events
- Cart generation success rate
- Event food discovery queries

### Logging

```typescript
console.log('Tool executed', {
  toolName,
  userId,
  duration,
  success,
  error
});
```

## Future Enhancements

1. **Advanced Preference Learning**
   - Machine learning for recommendations
   - Collaborative filtering
   - Seasonal preferences

2. **Multi-Language Support**
   - Translate user messages
   - Localize responses

3. **Voice Integration**
   - Speech-to-text input
   - Text-to-speech output

4. **Real-Time Notifications**
   - WebSocket for live updates
   - Push notifications

5. **Analytics Dashboard**
   - User behavior tracking
   - Food waste reduction metrics
   - Platform usage statistics

## Troubleshooting

### Chat endpoint returns 401

**Cause**: Missing or invalid JWT token

**Solution**: Ensure Authorization header is set:
```
Authorization: Bearer <jwt-token>
```

### Tool execution fails

**Cause**: Tool not registered or invalid parameters

**Solution**: 
1. Check tool name in ToolRegistry
2. Verify parameters match tool schema
3. Check database connectivity

### Preferences not applied

**Cause**: User has no preferences set

**Solution**: 
1. Create default preferences
2. Track user interactions
3. Wait for preference learning

### Smart cart returns empty

**Cause**: No frequent items or available inventory

**Solution**:
1. Check inventory levels
2. Verify user has history
3. Fall back to popular items

## Support

For issues or questions:
1. Check this guide
2. Review service documentation
3. Check error logs
4. Contact development team

---

**Last Updated**: March 2026
**Status**: Production Ready ✅
