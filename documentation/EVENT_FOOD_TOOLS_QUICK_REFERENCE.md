# Event Food Tools - Quick Reference Guide
**Last Updated:** March 15, 2026

---

## Tool Summary

| Tool Name | Endpoint | Purpose | Parameters |
|-----------|----------|---------|-----------|
| `get_event_food` | `GET /event-food` | List event food | page, limit, available_now |
| `get_event_food_details` | `GET /event-food/:id` | Get details | listing_id |
| `get_event_food_today` | `GET /event-food/today` | Today's events | (none) |
| `get_upcoming_event_food` | `GET /event-food/upcoming` | Upcoming events | days |
| `get_provider_event_food` | `GET /event-food/provider/:id` | Provider's events | provider_id, page, limit |

---

## Tool Usage Examples

### Get Event Food (with pagination)
```typescript
const result = await toolExecutor.execute("get_event_food", {
  page: 1,
  limit: 10,
  available_now: true
});
```

### Get Event Food Details
```typescript
const result = await toolExecutor.execute("get_event_food_details", {
  listing_id: "event-123"
});
```

### Get Today's Event Food
```typescript
const result = await toolExecutor.execute("get_event_food_today", {});
```

### Get Upcoming Event Food
```typescript
const result = await toolExecutor.execute("get_upcoming_event_food", {
  days: 7
});
```

### Get Provider's Event Food
```typescript
const result = await toolExecutor.execute("get_provider_event_food", {
  provider_id: "provider-456",
  page: 1,
  limit: 10
});
```

---

## Response Format

All tools return the same transformed format:

```json
{
  "listing_id": "string",
  "provider_id": "string",
  "food_name": "string",
  "description": "string",
  "quantity": "number",
  "available_quantity": "number",
  "location": "string",
  "pickup_window_start": "ISO 8601 datetime",
  "pickup_window_end": "ISO 8601 datetime",
  "food_type": "string",
  "dietary_tags": ["string"],
  "listing_type": "event",
  "status": "string",
  "image_url": "string (optional)",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

---

## Tool Files

**Tool Implementations:**
- `backend/src/agent/tools/getEventFood.ts`
- `backend/src/agent/tools/getEventFoodDetails.ts` (NEW)
- `backend/src/agent/tools/getEventFoodToday.ts`
- `backend/src/agent/tools/getUpcomingEventFood.ts`
- `backend/src/agent/tools/getProviderEventFood.ts`

**System Files:**
- `backend/src/agent/tools/definitions.ts` - Tool definitions
- `backend/src/agent/tools/executor.ts` - Tool execution
- `backend/src/agent/tools/index.ts` - Tool exports

---

## Integration Checklist

- ✅ All tools defined in `definitions.ts`
- ✅ All tools implemented in `executor.ts`
- ✅ All tools exported from `index.ts`
- ✅ All tools handle authentication
- ✅ All tools handle errors
- ✅ All tools return consistent format

---

## Common Use Cases

### 1. Discover Event Food
```typescript
// Get all available event food
const events = await toolExecutor.execute("get_event_food", {
  available_now: true,
  limit: 20
});
```

### 2. Check Today's Events
```typescript
// Get food available today
const todayEvents = await toolExecutor.execute("get_event_food_today", {});
```

### 3. Plan Ahead
```typescript
// Get events for next 14 days
const upcomingEvents = await toolExecutor.execute("get_upcoming_event_food", {
  days: 14
});
```

### 4. View Event Details
```typescript
// Get full details of a specific event
const details = await toolExecutor.execute("get_event_food_details", {
  listing_id: "event-123"
});
```

### 5. Browse Provider Events
```typescript
// Get all events from a specific provider
const providerEvents = await toolExecutor.execute("get_provider_event_food", {
  provider_id: "provider-456",
  limit: 50
});
```

---

## Error Handling

All tools return error responses in this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common errors:
- `"Missing API base URL or user token"` - Authentication issue
- `"Listing ID is required"` - Missing required parameter
- `"Failed to get event food"` - API request failed

---

## Performance Notes

- **Pagination:** Use `page` and `limit` to control result size
- **Filtering:** Use `available_now` to filter for currently available food
- **Lookahead:** Use `days` parameter to control time range for upcoming events
- **Caching:** Consider caching results for frequently accessed data

---

## Related Documentation

- `ENDPOINT_TOOL_SYNC_REPORT_MARCH_15_FINAL.md` - Detailed sync report
- `TOOL_SYNC_COMPLETION_SUMMARY.md` - Completion summary
- `EVENT_FOOD_TOOLS_FINAL_VERIFICATION.md` - Verification report

---

## Status

✅ **All tools verified and ready for production use**
