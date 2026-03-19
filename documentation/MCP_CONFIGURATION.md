# FoodBridge MCP Configuration

## Overview

This document describes the Model Context Protocol (MCP) configuration for the FoodBridge AI agent. The MCP server exposes database query functions that allow the agent to directly query food listings, check pantry availability, and retrieve dining deals.

## Architecture

```
AI Agent (Claude)
    ↓
MCP Client (Kiro IDE)
    ↓
MCP Server (foodbridge-db)
    ↓
PostgreSQL Database
```

The MCP server acts as a bridge between the AI agent and the FoodBridge database, providing structured access to critical data without requiring HTTP API calls.

## Configuration

### Workspace MCP Configuration

The MCP server is configured in `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "foodbridge-db": {
      "command": "node",
      "args": ["backend/src/mcp/server.js"],
      "env": {
        "DATABASE_URL": "postgresql://user:password@localhost:5432/foodbridge",
        "NODE_ENV": "development"
      },
      "disabled": false,
      "autoApprove": [
        "query_available_food",
        "check_pantry_availability",
        "get_dining_deals",
        "get_food_listings",
        "get_pantry_slots"
      ]
    }
  }
}
```

### Environment Variables

Update the `DATABASE_URL` with your PostgreSQL connection string:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/foodbridge
NODE_ENV=development
```

## Available Tools

### 1. query_available_food

Query available food listings with optional filters.

**Parameters:**
- `dietary_filters` (array, optional): Dietary tags (e.g., ["vegetarian", "vegan"])
- `category` (string, optional): meal | snack | beverage | pantry_item | deal | event_food
- `available_now` (boolean, optional): Only return currently available food
- `limit` (number, optional): Max results (default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

**Returns:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Veggie Stir Fry",
      "category": "meal",
      "dietary_tags": ["vegetarian"],
      "quantity_available": 12,
      "quantity_reserved": 3,
      "discounted_price": 4.50,
      "original_price": 8.00,
      "pickup_location": "Student Center",
      "available_from": "2026-03-11T12:00:00Z",
      "available_until": "2026-03-11T18:00:00Z"
    }
  ],
  "count": 1
}
```

**Use Cases:**
- "Find vegetarian meals available now"
- "Show me snacks under $5"
- "What meals are available today?"

### 2. check_pantry_availability

Check available pantry appointment slots for a specific date.

**Parameters:**
- `date` (string, required): Date in ISO 8601 format (YYYY-MM-DD)
- `duration_minutes` (number, optional): Appointment duration (default: 30)

**Returns:**
```json
{
  "success": true,
  "date": "2026-03-15",
  "available_slots": [
    {
      "time": "09:00",
      "available": true,
      "duration_minutes": 30
    },
    {
      "time": "09:30",
      "available": true,
      "duration_minutes": 30
    }
  ],
  "booked_count": 5
}
```

**Use Cases:**
- "When can I visit the pantry tomorrow?"
- "Show me available pantry slots for March 15"
- "Book a 1-hour pantry appointment"

### 3. get_dining_deals

Get current dining discounts and special offers.

**Parameters:**
- `limit` (number, optional): Max deals to return (default: 10)
- `offset` (number, optional): Pagination offset (default: 0)

**Returns:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "50% Off Pizza",
      "category": "deal",
      "original_price": 12.00,
      "discounted_price": 6.00,
      "discount_percentage": 50,
      "pickup_location": "Dining Hall A",
      "available_from": "2026-03-11T17:00:00Z",
      "available_until": "2026-03-11T20:00:00Z"
    }
  ],
  "count": 1
}
```

**Use Cases:**
- "What deals are available today?"
- "Show me current dining discounts"
- "Find the best food deals"

### 4. get_food_listings

Get detailed food listings with provider information.

**Parameters:**
- `listing_id` (string, optional): Specific listing ID
- `provider_id` (string, optional): Filter by provider
- `status` (string, optional): active | reserved | completed | cancelled | expired
- `limit` (number, optional): Max results (default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

**Returns:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Veggie Stir Fry",
      "description": "Fresh vegetables with tofu",
      "category": "meal",
      "quantity_available": 12,
      "quantity_reserved": 3,
      "discounted_price": 4.50,
      "pickup_location": "Student Center",
      "provider_first_name": "John",
      "provider_last_name": "Doe",
      "provider_email": "john@example.com",
      "status": "active"
    }
  ],
  "count": 1
}
```

**Use Cases:**
- "Get details about listing ABC123"
- "Show me all meals from the dining hall"
- "What food is available from provider XYZ?"

### 5. get_pantry_slots

Get available pantry appointment time slots with detailed information.

**Parameters:**
- `date` (string, required): Date in ISO 8601 format (YYYY-MM-DD)
- `start_time` (string, optional): Start time HH:MM (default: 09:00)
- `end_time` (string, optional): End time HH:MM (default: 17:00)
- `duration_minutes` (number, optional): Appointment duration (default: 30)

**Returns:**
```json
{
  "success": true,
  "date": "2026-03-15",
  "available_slots": [
    {
      "time": "09:00",
      "datetime": "2026-03-15T09:00:00.000Z",
      "duration_minutes": 30
    },
    {
      "time": "09:30",
      "datetime": "2026-03-15T09:30:00.000Z",
      "duration_minutes": 30
    }
  ],
  "total_slots": 16,
  "booked_count": 0
}
```

**Use Cases:**
- "What times are available at the pantry tomorrow?"
- "Find a 1-hour slot on March 15"
- "Show me morning pantry appointments"

## Integration with Agent Tools

The MCP tools complement the existing agent tools by providing direct database access:

### Agent Tools (via API)
- `search_food` - Uses backend API
- `reserve_food` - Creates reservations
- `book_pantry` - Books appointments
- `get_notifications` - Retrieves notifications

### MCP Tools (Direct Database)
- `query_available_food` - Fast database queries
- `check_pantry_availability` - Real-time slot checking
- `get_dining_deals` - Current deals
- `get_food_listings` - Detailed listing info
- `get_pantry_slots` - Slot availability

## Usage Examples

### Example 1: Find Vegetarian Meals

**User Message:** "Show me vegetarian meals available now"

**Agent Process:**
1. Calls `query_available_food` with:
   - `dietary_filters: ["vegetarian"]`
   - `available_now: true`
2. Receives list of available vegetarian meals
3. Formats response for user

### Example 2: Check Pantry Availability

**User Message:** "When can I visit the pantry tomorrow?"

**Agent Process:**
1. Calculates tomorrow's date
2. Calls `get_pantry_slots` with:
   - `date: "2026-03-12"`
   - `duration_minutes: 30`
3. Returns available time slots
4. Presents options to user

### Example 3: Find Best Deals

**User Message:** "What are the best deals today?"

**Agent Process:**
1. Calls `get_dining_deals` with:
   - `limit: 10`
2. Receives sorted list of deals (by discount percentage)
3. Formats and presents top deals

## Performance Considerations

### Query Optimization
- Indexes on `status`, `category`, `dietary_tags`, `available_until`
- Parameterized queries prevent SQL injection
- Connection pooling for efficient database access

### Caching Strategy
- MCP server maintains connection pool
- Database queries are optimized with proper indexes
- Consider Redis caching for frequently accessed data

### Rate Limiting
- MCP tools are auto-approved (no rate limiting)
- Backend API endpoints still have rate limiting
- Combine MCP queries with API calls for mutations

## Security Considerations

### Authentication
- MCP server runs in trusted environment
- No user authentication needed (runs server-side)
- Database connection uses environment variables

### Authorization
- MCP queries return public data only
- No sensitive user information exposed
- Filtering ensures data privacy

### Input Validation
- All parameters validated before query execution
- Date format validation (ISO 8601)
- Enum validation for categories and statuses

## Troubleshooting

### Connection Issues

**Error:** "Cannot connect to database"

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Ensure PostgreSQL is running
3. Check database credentials
4. Verify network connectivity

### Query Errors

**Error:** "Invalid date format"

**Solution:**
- Use ISO 8601 format: YYYY-MM-DD
- Example: "2026-03-15"

**Error:** "Unknown category"

**Solution:**
- Use valid categories: meal, snack, beverage, pantry_item, deal, event_food

### Performance Issues

**Slow queries:**
1. Check database indexes
2. Verify connection pool size
3. Monitor query execution time
4. Consider pagination with limit/offset

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install @modelcontextprotocol/sdk pg
```

### 2. Configure Environment

Update `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/foodbridge
NODE_ENV=development
```

### 3. Update MCP Configuration

Edit `.kiro/settings/mcp.json`:
```json
{
  "mcpServers": {
    "foodbridge-db": {
      "command": "node",
      "args": ["backend/src/mcp/server.js"],
      "env": {
        "DATABASE_URL": "postgresql://user:password@localhost:5432/foodbridge",
        "NODE_ENV": "development"
      },
      "disabled": false,
      "autoApprove": [
        "query_available_food",
        "check_pantry_availability",
        "get_dining_deals",
        "get_food_listings",
        "get_pantry_slots"
      ]
    }
  }
}
```

### 4. Restart MCP Server

- Open command palette: `Cmd+Shift+P`
- Search: "MCP"
- Select: "Reconnect MCP Servers"

## Testing the MCP Server

### Manual Testing

Use the MCP Server view in Kiro to test tools:

1. Open MCP Server panel
2. Select "foodbridge-db" server
3. Click on a tool to test
4. Enter parameters
5. View results

### Example Test Cases

**Test 1: Query Available Food**
```json
{
  "dietary_filters": ["vegetarian"],
  "available_now": true,
  "limit": 5
}
```

**Test 2: Check Pantry Availability**
```json
{
  "date": "2026-03-15",
  "duration_minutes": 30
}
```

**Test 3: Get Dining Deals**
```json
{
  "limit": 10
}
```

## Future Enhancements

### Planned Features
- [ ] Caching layer with Redis
- [ ] Advanced filtering options
- [ ] Recommendation engine integration
- [ ] Analytics and reporting
- [ ] Batch query support
- [ ] Subscription-based updates

### Optimization Opportunities
- [ ] Database query optimization
- [ ] Connection pool tuning
- [ ] Response compression
- [ ] Pagination improvements
- [ ] Index optimization

## Support

For issues or questions:
1. Check this documentation
2. Review MCP server logs
3. Verify database connectivity
4. Check environment variables
5. Review query parameters

---

**MCP Configuration Status:** Ready for Production
**Last Updated:** March 11, 2026
**Version:** 1.0.0
