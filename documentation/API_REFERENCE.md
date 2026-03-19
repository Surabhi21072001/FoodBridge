# FoodBridge Backend API Reference

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints require JWT authentication via Authorization header:

```
Authorization: Bearer <jwt-token>
```

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "optional message"
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Listings Endpoints

### List All Listings

**Endpoint**: `GET /api/listings`

**Authentication**: Not required (public endpoint)

**Query Parameters**:
- `category` (string, optional) - Filter by category (e.g., 'donation', 'deal', 'event_food')
- `status` (string, optional) - Filter by status (e.g., 'active', 'expired')
- `dietary_tags` (string[], optional) - Filter by dietary tags (e.g., 'vegetarian', 'vegan')
- `available_now` (boolean, optional) - Only show currently available listings
- `location` (string, optional) - Filter by pickup location
- `min_price` (number, optional) - Minimum price filter
- `max_price` (number, optional) - Maximum price filter
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 20) - Items per page (max: 100)

**Response**:
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "listing_id": "listing-123",
        "provider_id": "provider-456",
        "food_name": "Pizza Slices",
        "description": "Leftover pizza from event",
        "quantity": 10,
        "available_quantity": 8,
        "location": "Building A, Room 101",
        "pickup_window_start": "2024-03-15T12:00:00Z",
        "pickup_window_end": "2024-03-15T14:00:00Z",
        "food_type": "Italian",
        "dietary_tags": ["vegetarian"],
        "listing_type": "donation",
        "status": "active",
        "created_at": "2024-03-15T10:00:00Z",
        "updated_at": "2024-03-15T10:00:00Z"
      }
    ],
    "pagination": {
      "total_count": 45,
      "page": 1,
      "limit": 20,
      "total_pages": 3
    }
  }
}
```

**Status Codes**:
- `200` - Success
- `400` - Invalid query parameters
- `500` - Server error

**Example**:
```bash
curl -X GET "http://localhost:3000/api/listings?category=donation&dietary_tags=vegetarian&page=1&limit=20"
```

**Schema Transformation Note**: The backend transforms internal database schema to frontend schema:
- `id` → `listing_id`
- `title` → `food_name`
- `quantity_available + quantity_reserved` → `quantity`
- `quantity_available` → `available_quantity`
- `pickup_location` → `location`
- `available_from` → `pickup_window_start`
- `available_until` → `pickup_window_end`
- `cuisine_type` or `category` → `food_type`
- `category` mapping: `event_food` → `event`, `deal` → `dining_deal`, others → `donation`

---

### Get Listing by ID

**Endpoint**: `GET /api/listings/:id`

**Authentication**: Not required (public endpoint)

**Path Parameters**:
- `id` (string, required) - Listing ID

**Response**:
```json
{
  "success": true,
  "data": {
    "listing_id": "listing-123",
    "provider_id": "provider-456",
    "food_name": "Pizza Slices",
    "description": "Leftover pizza from event",
    "quantity": 10,
    "available_quantity": 8,
    "location": "Building A, Room 101",
    "pickup_window_start": "2024-03-15T12:00:00Z",
    "pickup_window_end": "2024-03-15T14:00:00Z",
    "food_type": "Italian",
    "dietary_tags": ["vegetarian"],
    "listing_type": "donation",
    "status": "active",
    "created_at": "2024-03-15T10:00:00Z",
    "updated_at": "2024-03-15T10:00:00Z"
  }
}
```

**Status Codes**:
- `200` - Success
- `400` - Invalid listing ID format
- `404` - Listing not found
- `500` - Server error

**Example**:
```bash
curl -X GET http://localhost:3000/api/listings/listing-123
```

---

### Create Listing

**Endpoint**: `POST /api/listings`

**Authentication**: Required (Provider role)

**Request Body**:
```json
{
  "food_name": "Pizza Slices",
  "description": "Leftover pizza from event",
  "quantity": 10,
  "location": "Building A, Room 101",
  "pickup_window_start": "2024-03-15T12:00:00Z",
  "pickup_window_end": "2024-03-15T14:00:00Z",
  "food_type": "Italian",
  "dietary_tags": ["vegetarian"],
  "listing_type": "donation"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "listing_id": "listing-123",
    "provider_id": "provider-456",
    "food_name": "Pizza Slices",
    "description": "Leftover pizza from event",
    "quantity": 10,
    "available_quantity": 10,
    "location": "Building A, Room 101",
    "pickup_window_start": "2024-03-15T12:00:00Z",
    "pickup_window_end": "2024-03-15T14:00:00Z",
    "food_type": "Italian",
    "dietary_tags": ["vegetarian"],
    "listing_type": "donation",
    "status": "active",
    "created_at": "2024-03-15T10:00:00Z",
    "updated_at": "2024-03-15T10:00:00Z"
  },
  "message": "Listing created successfully"
}
```

**Status Codes**:
- `201` - Created
- `400` - Invalid input
- `401` - Unauthorized
- `403` - Forbidden (not a provider)
- `500` - Server error

**Example**:
```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "food_name": "Pizza Slices",
    "description": "Leftover pizza",
    "quantity": 10,
    "location": "Building A",
    "pickup_window_start": "2024-03-15T12:00:00Z",
    "pickup_window_end": "2024-03-15T14:00:00Z",
    "food_type": "Italian",
    "dietary_tags": ["vegetarian"],
    "listing_type": "donation"
  }'
```

---

### Update Listing

**Endpoint**: `PUT /api/listings/:id`

**Authentication**: Required (Provider role, must be listing owner)

**Path Parameters**:
- `id` (string, required) - Listing ID

**Request Body** (all fields optional):
```json
{
  "food_name": "Updated Pizza",
  "description": "Updated description",
  "quantity": 8,
  "location": "Building B",
  "pickup_window_start": "2024-03-15T13:00:00Z",
  "pickup_window_end": "2024-03-15T15:00:00Z",
  "food_type": "Italian",
  "dietary_tags": ["vegetarian", "vegan"],
  "listing_type": "donation",
  "status": "active"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "listing_id": "listing-123",
    "provider_id": "provider-456",
    "food_name": "Updated Pizza",
    "description": "Updated description",
    "quantity": 8,
    "available_quantity": 6,
    "location": "Building B",
    "pickup_window_start": "2024-03-15T13:00:00Z",
    "pickup_window_end": "2024-03-15T15:00:00Z",
    "food_type": "Italian",
    "dietary_tags": ["vegetarian", "vegan"],
    "listing_type": "donation",
    "status": "active",
    "created_at": "2024-03-15T10:00:00Z",
    "updated_at": "2024-03-15T11:30:00Z"
  },
  "message": "Listing updated successfully"
}
```

**Status Codes**:
- `200` - Success
- `400` - Invalid input
- `401` - Unauthorized
- `403` - Forbidden (not listing owner)
- `404` - Listing not found
- `500` - Server error

**Example**:
```bash
curl -X PUT http://localhost:3000/api/listings/listing-123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "food_name": "Updated Pizza",
    "quantity": 8
  }'
```

---

### Delete Listing

**Endpoint**: `DELETE /api/listings/:id`

**Authentication**: Required (Provider role, must be listing owner)

**Path Parameters**:
- `id` (string, required) - Listing ID

**Response**:
```json
{
  "success": true,
  "message": "Listing deleted successfully"
}
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (not listing owner)
- `404` - Listing not found
- `500` - Server error

**Example**:
```bash
curl -X DELETE http://localhost:3000/api/listings/listing-123 \
  -H "Authorization: Bearer <token>"
```

---

### Get Provider's Listings

**Endpoint**: `GET /api/listings/provider/my-listings`

**Authentication**: Required (Provider role)

**Query Parameters**:
- `status` (string, optional) - Filter by status (e.g., 'active', 'expired')
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 20) - Items per page (max: 100)

**Response**:
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "listing_id": "listing-123",
        "provider_id": "provider-456",
        "food_name": "Pizza Slices",
        "description": "Leftover pizza from event",
        "quantity": 10,
        "available_quantity": 8,
        "location": "Building A, Room 101",
        "pickup_window_start": "2024-03-15T12:00:00Z",
        "pickup_window_end": "2024-03-15T14:00:00Z",
        "food_type": "Italian",
        "dietary_tags": ["vegetarian"],
        "listing_type": "donation",
        "status": "active",
        "created_at": "2024-03-15T10:00:00Z",
        "updated_at": "2024-03-15T10:00:00Z"
      }
    ],
    "pagination": {
      "total_count": 12,
      "page": 1,
      "limit": 20,
      "total_pages": 1
    }
  }
}
```

**Status Codes**:
- `200` - Success
- `400` - Invalid query parameters
- `401` - Unauthorized
- `403` - Forbidden (not a provider)
- `500` - Server error

**Example**:
```bash
curl -X GET "http://localhost:3000/api/listings/provider/my-listings?status=active&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

---

## Chat Endpoints

### Send Message to AI Agent

**Endpoint**: `POST /api/chat`

**Authentication**: Required

**Rate Limit**: 20 requests/minute per user

**Request Body**:
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

**Status Codes**:
- `200` - Success
- `400` - Invalid input
- `401` - Unauthorized
- `429` - Rate limit exceeded
- `500` - Server error

**Example**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Find vegetarian meals"}'
```

### End Chat Session

**Endpoint**: `POST /api/chat/:sessionId/end`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Session ended successfully"
}
```

---

## Smart Pantry Cart Endpoints

### Generate Smart Cart

**Endpoint**: `GET /api/pantry/cart/generate`

**Authentication**: Required

**Query Parameters**:
- `include_frequent` (boolean, default: true) - Include frequently selected items
- `respect_preferences` (boolean, default: true) - Respect dietary preferences
- `max_items` (number, default: 10) - Maximum items to recommend

**Response**:
```json
{
  "success": true,
  "data": {
    "recommendedItems": [
      {
        "item_id": "inv-123",
        "item_name": "Rice",
        "category": "grains",
        "quantity": 1,
        "unit": "kg",
        "reason": "frequent"
      }
    ],
    "totalItems": 8,
    "generatedAt": "2024-03-15T10:30:00Z"
  }
}
```

**Example**:
```bash
curl -X GET "http://localhost:3000/api/pantry/cart/generate?max_items=10" \
  -H "Authorization: Bearer <token>"
```

### Generate and Add to Cart

**Endpoint**: `POST /api/pantry/cart/generate-and-add`

**Authentication**: Required

**Request Body**:
```json
{
  "include_frequent": true,
  "respect_preferences": true,
  "max_items": 10
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "recommendedItems": [...],
    "totalItems": 8,
    "generatedAt": "2024-03-15T10:30:00Z",
    "cartId": "cart-456"
  },
  "message": "Added 8 items to your cart"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/pantry/cart/generate-and-add \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"max_items": 10}'
```

### Get User's Usual Items

**Endpoint**: `GET /api/pantry/cart/usual-items`

**Authentication**: Required

**Query Parameters**:
- `limit` (number, default: 10) - Number of items to return

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "item_id": "inv-123",
        "item_name": "Rice",
        "category": "grains",
        "quantity": 1,
        "unit": "kg",
        "reason": "frequent"
      }
    ],
    "count": 5
  }
}
```

### Get Preference-Based Recommendations

**Endpoint**: `GET /api/pantry/cart/preference-based`

**Authentication**: Required

**Query Parameters**:
- `limit` (number, default: 10) - Number of items to return

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "count": 8
  }
}
```

### Get Popular Items

**Endpoint**: `GET /api/pantry/cart/popular`

**Authentication**: Required

**Query Parameters**:
- `limit` (number, default: 10) - Number of items to return

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "count": 10
  }
}
```

### Get Cart Suggestion

**Endpoint**: `GET /api/pantry/cart/suggestion`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "suggestion": "I can generate your usual pantry items for you. Would you like me to add them to your cart?"
  }
}
```

---

## Event Food Endpoints

### Get Event Food

**Endpoint**: `GET /api/event-food`

**Authentication**: Required

**Query Parameters**:
- `available_now` (boolean) - Only show currently available food
- `dietary_filters` (string, comma-separated) - Dietary tags to filter by
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page

**Response**:
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "listing-123",
        "title": "Campus Carnival Food",
        "category": "event_food",
        "quantity_available": 50,
        "available_from": "2024-03-15T14:00:00Z",
        "available_until": "2024-03-15T18:00:00Z",
        "dietary_tags": ["vegetarian"],
        "image_urls": ["https://..."]
      }
    ],
    "total": 3,
    "page": 1,
    "limit": 10
  }
}
```

**Example**:
```bash
curl -X GET "http://localhost:3000/api/event-food?available_now=true&dietary_filters=vegetarian" \
  -H "Authorization: Bearer <token>"
```

### Get Today's Event Food

**Endpoint**: `GET /api/event-food/today`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "listings": [...],
    "total": 3,
    "date": "2024-03-15"
  }
}
```

### Get Upcoming Event Food

**Endpoint**: `GET /api/event-food/upcoming`

**Authentication**: Required

**Query Parameters**:
- `days` (number, default: 7) - Number of days to look ahead

**Response**:
```json
{
  "success": true,
  "data": {
    "listings": [...],
    "total": 5,
    "days": 7
  }
}
```

### Get Event Food Details

**Endpoint**: `GET /api/event-food/:id`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "listing-123",
    "title": "Campus Carnival Food",
    "description": "Free food from the campus carnival",
    "category": "event_food",
    "quantity_available": 50,
    "quantity_reserved": 10,
    "available_from": "2024-03-15T14:00:00Z",
    "available_until": "2024-03-15T18:00:00Z",
    "dietary_tags": ["vegetarian"],
    "image_urls": ["https://..."],
    "provider_id": "provider-123"
  }
}
```

### Get Provider's Event Food

**Endpoint**: `GET /api/event-food/provider/:providerId`

**Authentication**: Required

**Query Parameters**:
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page

**Response**:
```json
{
  "success": true,
  "data": {
    "listings": [...],
    "total": 5,
    "page": 1,
    "limit": 10,
    "providerId": "provider-123"
  }
}
```

---

## Preference Endpoints

### Get User Preferences

**Endpoint**: `GET /api/preferences/user/:userId`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "dietary_restrictions": ["vegetarian"],
    "allergies": ["peanuts"],
    "favorite_cuisines": ["asian", "mediterranean"],
    "preferred_providers": ["provider-123"]
  }
}
```

### Update User Preferences

**Endpoint**: `PUT /api/preferences/user/:userId`

**Authentication**: Required

**Request Body**:
```json
{
  "dietary_restrictions": ["vegetarian", "gluten_free"],
  "allergies": ["peanuts", "shellfish"],
  "favorite_cuisines": ["asian"],
  "preferred_providers": ["provider-123"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "dietary_restrictions": ["vegetarian", "gluten_free"],
    "allergies": ["peanuts", "shellfish"],
    "favorite_cuisines": ["asian"],
    "preferred_providers": ["provider-123"]
  }
}
```

### Get Frequent Items

**Endpoint**: `GET /api/preferences/frequent-items/:userId`

**Authentication**: Required

**Query Parameters**:
- `limit` (number, default: 10) - Number of items to return

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "inventory_id": "inv-123",
        "item_name": "Rice",
        "frequency": 15
      }
    ],
    "count": 5
  }
}
```

### Get Recommendations

**Endpoint**: `GET /api/preferences/recommendations/:userId`

**Authentication**: Required

**Query Parameters**:
- `limit` (number, default: 10) - Number of items to return

**Response**:
```json
{
  "success": true,
  "data": {
    "recommendations": [...],
    "count": 8
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid input: message is required"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 429 Too Many Requests

```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **Chat endpoint**: 20 requests/minute per user
- **Other endpoints**: 100 requests/15 minutes per IP

Rate limit headers:
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
X-RateLimit-Reset: 1234567890
```

---

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `page` (number, default: 1) - Page number (1-indexed)
- `limit` (number, default: 10) - Items per page (max: 100)

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

---

## Filtering

### Dietary Filters

Supported values:
- `vegetarian`
- `vegan`
- `gluten_free`
- `dairy_free`
- `nut_free`
- `halal`
- `kosher`

### Categories

Supported values:
- `meal`
- `snack`
- `beverage`
- `pantry_item`
- `deal`
- `event_food`

---

## Examples

### Complete Chat Workflow

```bash
# 1. Send message
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Find vegetarian meals"}'

# Response:
# {
#   "success": true,
#   "data": {
#     "sessionId": "session-123",
#     "response": "I found 5 vegetarian meals...",
#     "toolsUsed": ["search_food"]
#   }
# }

# 2. Continue conversation
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Reserve the first one", "sessionId": "session-123"}'

# 3. End session
curl -X POST http://localhost:3000/api/chat/session-123/end \
  -H "Authorization: Bearer <token>"
```

### Smart Cart Workflow

```bash
# 1. Generate smart cart
curl -X GET "http://localhost:3000/api/pantry/cart/generate?max_items=10" \
  -H "Authorization: Bearer <token>"

# 2. Add to cart
curl -X POST http://localhost:3000/api/pantry/cart/generate-and-add \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"max_items": 10}'

# 3. Get suggestion
curl -X GET http://localhost:3000/api/pantry/cart/suggestion \
  -H "Authorization: Bearer <token>"
```

### Event Food Discovery

```bash
# 1. Get today's event food
curl -X GET http://localhost:3000/api/event-food/today \
  -H "Authorization: Bearer <token>"

# 2. Get upcoming event food
curl -X GET "http://localhost:3000/api/event-food/upcoming?days=7" \
  -H "Authorization: Bearer <token>"

# 3. Get event food details
curl -X GET http://localhost:3000/api/event-food/listing-123 \
  -H "Authorization: Bearer <token>"
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

**Last Updated**: March 2026
**API Version**: 1.0.0
