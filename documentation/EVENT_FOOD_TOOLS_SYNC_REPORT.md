# Event Food Tools Synchronization Report
**Date:** March 15, 2026  
**Status:** PARTIAL SYNC - Action Required

## Summary
The event food routes were recently updated with route reordering to prevent conflicts. Analysis shows that the existing `getEventFood` tool is **partially synchronized** with the backend endpoints. Additional tools are needed to cover all event food endpoints.

---

## Endpoint Analysis

### Current Backend Endpoints (eventFoodRoutes.ts)

| Endpoint | Method | Route | Status | Tool |
|----------|--------|-------|--------|------|
| Get Event Food | GET | `/api/event-food` | ✅ Covered | `get_event_food` |
| Get Today's Event Food | GET | `/api/event-food/today` | ❌ Missing | Need: `get_event_food_today` |
| Get Upcoming Event Food | GET | `/api/event-food/upcoming` | ❌ Missing | Need: `get_upcoming_event_food` |
| Get Event Food Details | GET | `/api/event-food/:id` | ⚠️ Partial | Use: `get_listing_details` |
| Get Provider Event Food | GET | `/api/event-food/provider/:providerId` | ❌ Missing | Need: `get_provider_event_food` |

---

## Tool Status

### ✅ VERIFIED - Current Tool
**Tool:** `get_event_food`  
**File:** `backend/src/agent/tools/getEventFood.ts`  
**Status:** Working but needs update  
**Issue:** Currently calls `/listings?category=event_food` instead of `/api/event-food`

**Current Implementation:**
```typescript
// OLD: Uses generic listings endpoint
const response = await axios.get(`${apiBaseUrl}/listings?${queryParams.toString()}`, {
  headers: { Authorization: `Bearer ${userToken}` }
});
```

**Should Be:**
```typescript
// NEW: Use dedicated event-food endpoint
const response = await axios.get(`${apiBaseUrl}/event-food?${queryParams.toString()}`, {
  headers: { Authorization: `Bearer ${userToken}` }
});
```

---

## Missing Tools (Action Required)

### 1. ❌ `get_event_food_today` - NEW TOOL NEEDED
**Endpoint:** `GET /api/event-food/today`  
**Purpose:** Get event food available today  
**Parameters:** None required  
**Response:** List of today's event food listings

**Implementation Plan:**
- Create: `backend/src/agent/tools/getEventFoodToday.ts`
- Register in: `backend/src/agent/tools/definitions.ts`
- Export from: `backend/src/agent/tools/index.ts`

---

### 2. ❌ `get_upcoming_event_food` - NEW TOOL NEEDED
**Endpoint:** `GET /api/event-food/upcoming`  
**Purpose:** Get upcoming event food within specified days  
**Parameters:**
- `days` (number, optional): Number of days to look ahead (default: 7)

**Response:** List of upcoming event food listings

**Implementation Plan:**
- Create: `backend/src/agent/tools/getUpcomingEventFood.ts`
- Register in: `backend/src/agent/tools/definitions.ts`
- Export from: `backend/src/agent/tools/index.ts`

---

### 3. ❌ `get_provider_event_food` - NEW TOOL NEEDED
**Endpoint:** `GET /api/event-food/provider/:providerId`  
**Purpose:** Get event food from a specific provider  
**Parameters:**
- `provider_id` (string, required): Provider ID
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page

**Response:** Paginated list of provider's event food listings

**Implementation Plan:**
- Create: `backend/src/agent/tools/getProviderEventFood.ts`
- Register in: `backend/src/agent/tools/definitions.ts`
- Export from: `backend/src/agent/tools/index.ts`

---

### 4. ⚠️ `get_listing_details` - EXISTING TOOL (Reuse)
**Endpoint:** `GET /api/event-food/:id`  
**Status:** Already exists in tool definitions  
**Note:** This tool is generic and works for all listing types including event food

---

## Synchronization Summary

| Category | Count | Status |
|----------|-------|--------|
| Total Endpoints | 5 | - |
| Covered by Tools | 2 | ✅ |
| Partially Covered | 1 | ⚠️ |
| Missing Tools | 2 | ❌ |
| Tools Needing Update | 1 | 🔄 |

---

## Action Items

### Priority 1: Update Existing Tool
- [ ] Update `getEventFood.ts` to use `/api/event-food` endpoint instead of `/listings?category=event_food`
- [ ] Verify query parameter handling matches controller expectations

### Priority 2: Create Missing Tools
- [ ] Create `getEventFoodToday.ts` tool
- [ ] Create `getUpcomingEventFood.ts` tool  
- [ ] Create `getProviderEventFood.ts` tool

### Priority 3: Register Tools
- [ ] Add all new tools to `definitions.ts` AGENT_TOOLS array
- [ ] Export all new tools from `index.ts`
- [ ] Update tool executor to handle new tools

### Priority 4: Testing
- [ ] Test each tool with sample API calls
- [ ] Verify error handling
- [ ] Validate response data structures

---

## Implementation Notes

1. **Route Reordering:** The recent change moved `/provider/:providerId` before `/:id` to prevent route conflicts. This is correct and doesn't affect tool implementation.

2. **Endpoint Consistency:** All event food endpoints use the `/api/event-food` base path, which is cleaner than the previous `/listings?category=event_food` approach.

3. **Tool Naming Convention:** Follow existing pattern:
   - `get_event_food` (general list)
   - `get_event_food_today` (specific time period)
   - `get_upcoming_event_food` (future events)
   - `get_provider_event_food` (provider-specific)

4. **Error Handling:** All tools should handle:
   - Missing authentication token
   - Invalid parameters
   - API errors (4xx, 5xx)
   - Network failures

---

## Files to Modify

1. **Update:** `backend/src/agent/tools/getEventFood.ts`
2. **Create:** `backend/src/agent/tools/getEventFoodToday.ts`
3. **Create:** `backend/src/agent/tools/getUpcomingEventFood.ts`
4. **Create:** `backend/src/agent/tools/getProviderEventFood.ts`
5. **Update:** `backend/src/agent/tools/definitions.ts`
6. **Update:** `backend/src/agent/tools/index.ts`

---

## Next Steps

1. Review this report for accuracy
2. Implement Priority 1 updates to existing tool
3. Implement Priority 2 new tools
4. Complete Priority 3 registration
5. Execute Priority 4 testing
6. Update API documentation with new tools

