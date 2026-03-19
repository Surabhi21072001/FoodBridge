# FoodBridge API Documentation

Complete API reference for the FoodBridge platform backend.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Authentication Flow:**
1. Register or login to receive JWT token
2. Include token in `Authorization` header for all protected endpoints
3. Token is valid for 24 hours (configurable)
4. Expired tokens return `401 Unauthorized`

**Token Format:**
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Request/Response Format

**Standard Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Standard Response Format:**
```json
{
  "success": true|false,
  "message": "string (optional)",
  "data": { ... },
  "error": "string (optional, development only)"
}
```

**Status Codes:**
- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST (resource created)
- `400 Bad Request` - Validation error or invalid input
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Authenticated but lacks permission
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Business rule violation (duplicate, conflict)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Table of Contents

1. [Users & Authentication](#users--authentication)
2. [Chat & AI Assistant](#chat--ai-assistant)
3. [Food Listings](#food-listings)
4. [Reservations](#reservations)
5. [Pantry Appointments](#pantry-appointments)
6. [Notifications](#notifications)
7. [Pantry Inventory](#pantry-inventory)
8. [Pantry Orders](#pantry-orders)
9. [Preferences](#preferences)
10. [Volunteer](#volunteer)

---

## Chat & AI Assistant

The Chat API enables conversational interaction with the FoodBridge AI Assistant. The assistant interprets natural language and executes tools to help users discover food, make reservations, book appointments, and more.

### Send Message to AI Assistant

Send a message to the AI agent and receive a conversational response with tool execution results.

**Endpoint:** `POST /chat`

**Access:** Authenticated (all roles)

**Rate Limiting:** 20 requests per minute per user

**Request Body:**
```json
{
  "message": "string (required, non-empty)",
  "sessionId": "uuid (optional, generates new if not provided)"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "response": "string (conversational response from AI)",
    "toolsUsed": [
      {
        "name": "search_food",
        "args": { ... },
        "result": { ... }
      }
    ],
    "timestamp": "ISO 8601 timestamp"
  }
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me vegetarian meals available today",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "response": "I found 5 vegetarian meals available today. Here are the top options:\n\n1. **Veggie Stir Fry** - $4.50 (was $8.00)\n   Available: 12 servings\n   Pickup: Student Center until 6:00 PM\n\n2. **Quinoa Buddha Bowl** - $3.00 (was $7.50)\n   Available: 8 servings\n   Pickup: Dining Hall A until 5:30 PM",
    "toolsUsed": [
      {
        "name": "search_food",
        "args": {
          "dietary_tags": ["vegetarian"],
          "available_now": true
        },
        "result": {
          "success": true,
          "data": [
            {
              "id": "listing-123",
              "title": "Veggie Stir Fry",
              "category": "meal",
              "quantity_available": 12,
              "discounted_price": 4.50,
              "pickup_location": "Student Center"
            }
          ]
        }
      }
    ],
    "timestamp": "2024-03-11T15:30:45.123Z"
  }
}
```

**Business Rules:**
- Session ID is generated automatically if not provided
- Session persists for 30 minutes of inactivity
- User context (preferences, history) is maintained within session
- AI assistant has access to user's dietary preferences and past selections
- Tool execution is atomic - all tools execute or none do

**Available Tools:**
The AI assistant can execute the following tools based on user requests:
- `search_food` - Search food listings with filters
- `get_listing_details` - Get detailed information about a specific listing
- `reserve_food` - Create a food reservation
- `get_notifications` - Retrieve user notifications
- `get_user_preferences` - Get user's dietary preferences
- `get_frequent_items` - Get items user frequently selects
- `generate_pantry_cart` - Generate smart pantry cart recommendations
- `get_dining_deals` - Get current dining deals
- `book_appointment` - Book a pantry appointment
- `get_appointments` - Get user's appointments

### End Chat Session

Explicitly end a chat session and clean up resources.

**Endpoint:** `POST /chat/:sessionId/end`

**Access:** Authenticated (all roles)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Session ended successfully"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/chat/550e8400-e29b-41d4-a716-446655440000/end \
  -H "Authorization: Bearer <token>"
```

**Business Rules:**
- Session data is cleared from memory
- Any pending operations are cancelled
- Session cannot be resumed after ending
- Ending an already-ended session returns success (idempotent)

### Session Management

**Session Lifecycle:**
1. Session created automatically on first message (or use provided sessionId)
2. Session persists for 30 minutes of inactivity
3. Session can be explicitly ended with `/end` endpoint
4. Session data includes:
   - User context (ID, role, preferences)
   - Conversation history
   - Tool execution results
   - User preferences and dietary restrictions

**Session Timeout:**
- Inactive sessions expire after 30 minutes
- Activity includes sending messages or executing tools
- Expired sessions cannot be resumed

---

### Register User

Create a new user account.

**Endpoint:** `POST /users/register`

**Access:** Public

**Request Body:**
```json
{
  "email": "string (required, email format)",
  "password": "string (required, min 8 characters)",
  "role": "student | provider | admin (required)",
  "first_name": "string (required)",
  "last_name": "string (required)",
  "phone": "string (optional)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "string",
      "role": "string",
      "first_name": "string",
      "last_name": "string",
      "phone": "string",
      "created_at": "timestamp"
    },
    "token": "jwt_token"
  }
}
```

### Login

Authenticate and receive JWT token.

**Endpoint:** `POST /users/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "jwt_token"
  }
}
```

### Get Profile

Get current user's profile.

**Endpoint:** `GET /users/profile`

**Access:** Authenticated

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "role": "string",
    "first_name": "string",
    "last_name": "string",
    "phone": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### Update Profile

Update current user's profile.

**Endpoint:** `PUT /users/profile`

**Access:** Authenticated

**Request Body:**
```json
{
  "first_name": "string (optional)",
  "last_name": "string (optional)",
  "phone": "string (optional)"
}
```

### Change Password

Change current user's password.

**Endpoint:** `POST /users/change-password`

**Access:** Authenticated

**Request Body:**
```json
{
  "current_password": "string (required)",
  "new_password": "string (required, min 8 characters)"
}
```

---

## Food Listings

### List Listings

Get paginated list of food listings with filters.

**Endpoint:** `GET /listings`

**Access:** Public

**Query Parameters:**
- `category` (optional): meal | snack | beverage | pantry_item | deal | event_food
- `status` (optional): active | reserved | completed | cancelled | expired
- `dietary_tags` (optional): comma-separated list (e.g., "vegetarian,vegan")
- `available_now` (optional): true | false
- `page` (optional): integer, default 1
- `limit` (optional): integer, default 20

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "provider_id": "uuid",
      "title": "string",
      "description": "string",
      "category": "string",
      "cuisine_type": "string",
      "dietary_tags": ["string"],
      "allergen_info": ["string"],
      "quantity_available": 15,
      "quantity_reserved": 3,
      "unit": "serving",
      "original_price": 8.50,
      "discounted_price": 3.00,
      "pickup_location": "string",
      "available_from": "timestamp",
      "available_until": "timestamp",
      "image_urls": ["string"],
      "status": "active",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Get Listing

Get single listing by ID.

**Endpoint:** `GET /listings/:id`

**Access:** Public

**Response:** `200 OK`

### Create Listing

Create new food listing.

**Endpoint:** `POST /listings`

**Access:** Provider only

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "category": "meal | snack | beverage | pantry_item | deal | event_food (required)",
  "cuisine_type": "string (optional)",
  "dietary_tags": ["string"] (optional),
  "allergen_info": ["string"] (optional),
  "quantity_available": "integer (required, positive)",
  "unit": "string (optional, default: serving)",
  "original_price": "number (optional, non-negative)",
  "discounted_price": "number (optional, non-negative)",
  "pickup_location": "string (required)",
  "available_from": "datetime (required)",
  "available_until": "datetime (required)",
  "image_urls": ["string"] (optional)
}
```

**Response:** `201 Created`

### Update Listing

Update existing listing.

**Endpoint:** `PUT /listings/:id`

**Access:** Provider only (own listings)

**Request Body:** Same as create, all fields optional

**Response:** `200 OK`

### Delete Listing

Delete listing (only if no active reservations).

**Endpoint:** `DELETE /listings/:id`

**Access:** Provider only (own listings)

**Response:** `200 OK`

### Get Provider Listings

Get all listings for current provider.

**Endpoint:** `GET /listings/provider/my-listings`

**Access:** Provider only

**Query Parameters:**
- `status` (optional)
- `page` (optional)
- `limit` (optional)

---

## Reservations

### Create Reservation

Reserve food from a listing.

**Endpoint:** `POST /reservations`

**Access:** Student only

**Request Body:**
```json
{
  "listing_id": "uuid (required)",
  "quantity": "integer (required, positive)",
  "pickup_time": "datetime (optional)",
  "notes": "string (optional)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "id": "uuid",
    "listing_id": "uuid",
    "user_id": "uuid",
    "quantity": 2,
    "status": "confirmed",
    "pickup_time": "timestamp",
    "confirmation_code": "ABC123",
    "notes": "string",
    "created_at": "timestamp"
  }
}
```

**Business Rules:**
- Validates quantity availability atomically
- Prevents duplicate reservations per user per listing
- Updates listing's reserved quantity
- Generates unique confirmation code

### Get User Reservations

Get all reservations for current user.

**Endpoint:** `GET /reservations`

**Access:** Student only

**Query Parameters:**
- `status` (optional): pending | confirmed | picked_up | cancelled | no_show
- `page` (optional)
- `limit` (optional)

### Get Reservation

Get single reservation by ID.

**Endpoint:** `GET /reservations/:id`

**Access:** Student only (own reservations)

### Cancel Reservation

Cancel a reservation and return quantity to listing.

**Endpoint:** `DELETE /reservations/:id`

**Access:** Student only (own reservations)

**Response:** `200 OK`

**Business Rules:**
- Returns reserved quantity to listing atomically
- Cannot cancel already picked up reservations

### Confirm Pickup

Confirm food pickup with confirmation code.

**Endpoint:** `POST /reservations/:id/confirm-pickup`

**Access:** Authenticated (Student or Provider)

**Request Body:**
```json
{
  "confirmation_code": "string (required, 6 characters)"
}
```

**Response:** `200 OK`

---

## Pantry Appointments

### Create Appointment

Book a pantry appointment.

**Endpoint:** `POST /pantry/appointments`

**Access:** Student only

**Request Body:**
```json
{
  "appointment_time": "datetime (required)",
  "duration_minutes": "integer (optional, default: 30)",
  "notes": "string (optional)"
}
```

**Response:** `201 Created`

**Business Rules:**
- Validates appointment is in the future
- Prevents double booking (checks for time slot conflicts)

### Get User Appointments

Get all appointments for current user.

**Endpoint:** `GET /pantry/appointments`

**Access:** Student only

**Query Parameters:**
- `status` (optional): scheduled | confirmed | completed | cancelled | no_show
- `upcoming` (optional): true | false
- `page` (optional)
- `limit` (optional)

### Get Appointment

Get single appointment by ID.

**Endpoint:** `GET /pantry/appointments/:id`

**Access:** Student only (own appointments)

### Update Appointment

Update appointment details.

**Endpoint:** `PUT /pantry/appointments/:id`

**Access:** Student only (own appointments)

**Request Body:**
```json
{
  "appointment_time": "datetime (optional)",
  "duration_minutes": "integer (optional)",
  "notes": "string (optional)",
  "status": "scheduled | confirmed | completed | cancelled | no_show (optional)"
}
```

### Cancel Appointment

Cancel an appointment.

**Endpoint:** `DELETE /pantry/appointments/:id`

**Access:** Student only (own appointments)

### List All Appointments (Admin)

Get all appointments in the system.

**Endpoint:** `GET /pantry/appointments/admin/all`

**Access:** Admin only

**Query Parameters:**
- `status` (optional)
- `date` (optional): filter by specific date
- `page` (optional)
- `limit` (optional)

---

## Notifications

### Get User Notifications

Get all notifications for current user.

**Endpoint:** `GET /notifications`

**Access:** Authenticated

**Query Parameters:**
- `is_read` (optional): true | false
- `type` (optional): notification type
- `page` (optional)
- `limit` (optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "reservation_confirmed",
      "title": "string",
      "message": "string",
      "related_entity_type": "reservation",
      "related_entity_id": "uuid",
      "is_read": false,
      "created_at": "timestamp",
      "read_at": null
    }
  ],
  "pagination": { ... },
  "unread_count": 5
}
```

### Get Unread Count

Get count of unread notifications.

**Endpoint:** `GET /notifications/unread-count`

**Access:** Authenticated

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### Mark as Read

Mark single notification as read.

**Endpoint:** `PUT /notifications/:id/read`

**Access:** Authenticated (own notifications)

### Mark All as Read

Mark all notifications as read.

**Endpoint:** `PUT /notifications/read-all`

**Access:** Authenticated

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "count": 5
  },
  "message": "5 notifications marked as read"
}
```

### Delete Notification

Delete a notification.

**Endpoint:** `DELETE /notifications/:id`

**Access:** Authenticated (own notifications)

---

## Pantry Inventory

### List Inventory

Get paginated list of pantry items.

**Endpoint:** `GET /pantry/inventory`

**Access:** Authenticated

**Query Parameters:**
- `category` (optional): canned_goods | dry_goods | fresh_produce | frozen | dairy | snacks | beverages | other
- `low_stock` (optional): true | false
- `dietary_tags` (optional): comma-separated list
- `page` (optional)
- `limit` (optional, default: 50)

### Get Inventory Item

Get single inventory item by ID.

**Endpoint:** `GET /pantry/inventory/:id`

**Access:** Authenticated

### Create Inventory Item

Add new item to pantry inventory.

**Endpoint:** `POST /pantry/inventory`

**Access:** Admin only

**Request Body:**
```json
{
  "item_name": "string (required)",
  "category": "canned_goods | dry_goods | ... (required)",
  "quantity": "integer (required, non-negative)",
  "unit": "string (optional, default: item)",
  "expiration_date": "date (optional)",
  "dietary_tags": ["string"] (optional),
  "allergen_info": ["string"] (optional),
  "location": "string (optional)",
  "reorder_threshold": "integer (optional, default: 10)"
}
```

### Update Inventory Item

Update inventory item details.

**Endpoint:** `PUT /pantry/inventory/:id`

**Access:** Admin only

### Delete Inventory Item

Remove item from inventory.

**Endpoint:** `DELETE /pantry/inventory/:id`

**Access:** Admin only

### Adjust Quantity

Adjust inventory quantity (add or subtract).

**Endpoint:** `POST /pantry/inventory/:id/adjust-quantity`

**Access:** Admin only

**Request Body:**
```json
{
  "quantity_change": "integer (required, can be negative)"
}
```

**Example:** `{"quantity_change": -5}` to subtract 5 units

### Get Low Stock Items

Get all items below reorder threshold.

**Endpoint:** `GET /pantry/inventory/admin/low-stock`

**Access:** Admin only

---

## Pantry Orders

### Get Cart

Get current user's active cart.

**Endpoint:** `GET /pantry/orders/cart`

**Access:** Student only

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "user_id": "uuid",
      "status": "cart",
      "total_items": 5,
      "created_at": "timestamp"
    },
    "items": [
      {
        "id": "uuid",
        "order_id": "uuid",
        "inventory_id": "uuid",
        "quantity": 2,
        "item_name": "Canned Black Beans",
        "category": "canned_goods",
        "unit": "can"
      }
    ]
  }
}
```

### Add Item to Cart

Add item to cart or increase quantity if already in cart.

**Endpoint:** `POST /pantry/orders/cart/items`

**Access:** Student only

**Request Body:**
```json
{
  "inventory_id": "uuid (required)",
  "quantity": "integer (required, positive)"
}
```

**Business Rules:**
- Validates inventory availability
- Creates cart if doesn't exist
- Updates total items count

### Update Cart Item

Update quantity of item in cart.

**Endpoint:** `PUT /pantry/orders/cart/items/:inventory_id`

**Access:** Student only

**Request Body:**
```json
{
  "quantity": "integer (required, positive)"
}
```

### Remove Cart Item

Remove item from cart.

**Endpoint:** `DELETE /pantry/orders/cart/items/:inventory_id`

**Access:** Student only

### Clear Cart

Remove all items from cart.

**Endpoint:** `DELETE /pantry/orders/cart`

**Access:** Student only

### Submit Order

Submit cart as order and deduct from inventory.

**Endpoint:** `POST /pantry/orders/cart/submit`

**Access:** Student only

**Response:** `200 OK`

**Business Rules:**
- Validates all items still available
- Deducts quantities from inventory atomically
- Changes order status to 'submitted'
- Creates new cart for future orders

### Get Order History

Get all orders for current user.

**Endpoint:** `GET /pantry/orders`

**Access:** Student only

**Query Parameters:**
- `status` (optional): cart | submitted | prepared | picked_up | cancelled
- `page` (optional)
- `limit` (optional)

### Get Order

Get single order with items.

**Endpoint:** `GET /pantry/orders/:id`

**Access:** Student only (own orders)

---

## Preferences

### Get User Preferences

Get dietary preferences and food selection history for a user.

**Endpoint:** `GET /preferences/user/:userId`

**Access:** Authenticated

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "dietary_restrictions": ["vegetarian", "gluten-free"],
    "allergies": ["peanuts", "shellfish"],
    "preferred_food_types": ["Asian", "Mediterranean"],
    "notification_preferences": "email",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### Update User Preferences

Update dietary preferences and notification settings.

**Endpoint:** `PUT /preferences/user/:userId`

**Access:** Authenticated (own preferences)

**Request Body:**
```json
{
  "dietary_restrictions": ["string"] (optional),
  "allergies": ["string"] (optional),
  "preferred_food_types": ["string"] (optional),
  "notification_preferences": "email | sms | push | none (optional)"
}
```

**Response:** `200 OK`

### Track Pantry Selection

Record when a user selects items from the pantry (for preference learning).

**Endpoint:** `POST /preferences/track/pantry-selection`

**Access:** Authenticated

**Request Body:**
```json
{
  "inventory_id": "uuid (required)",
  "quantity": "integer (required)"
}
```

**Response:** `200 OK`

### Track Reservation

Record when a user makes a food reservation (for preference learning).

**Endpoint:** `POST /preferences/track/reservation`

**Access:** Authenticated

**Request Body:**
```json
{
  "listing_id": "uuid (required)",
  "quantity": "integer (required)"
}
```

**Response:** `200 OK`

### Track Filter Application

Record when a user applies filters (for preference learning).

**Endpoint:** `POST /preferences/track/filter`

**Access:** Authenticated

**Request Body:**
```json
{
  "filter_type": "dietary_tags | category | price_range (required)",
  "filter_value": "string (required)"
}
```

**Response:** `200 OK`

### Get Frequent Items

Get items the user frequently selects.

**Endpoint:** `GET /preferences/frequent-items/:userId`

**Access:** Authenticated

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "item_id": "uuid",
      "item_name": "string",
      "frequency": 15,
      "last_selected": "timestamp"
    }
  ]
}
```

### Get Frequent Providers

Get providers the user frequently reserves from.

**Endpoint:** `GET /preferences/frequent-providers/:userId`

**Access:** Authenticated

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "provider_id": "uuid",
      "provider_name": "string",
      "frequency": 8,
      "last_reserved": "timestamp"
    }
  ]
}
```

### Get Recommendations

Get personalized food recommendations based on user history and preferences.

**Endpoint:** `GET /preferences/recommendations/:userId`

**Access:** Authenticated

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "listing_id": "uuid",
        "title": "string",
        "reason": "Based on your frequent selections",
        "match_score": 0.95
      }
    ]
  }
}
```

### Get Preference History

Get historical record of user's preferences and selections.

**Endpoint:** `GET /preferences/history/:userId`

**Access:** Authenticated

**Query Parameters:**
- `days` (optional): Number of days to look back (default: 30)
- `limit` (optional): Max records to return (default: 100)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action_type": "reservation | pantry_selection | filter_applied",
      "details": { ... },
      "created_at": "timestamp"
    }
  ]
}
```

---

## Volunteer

### List Volunteer Opportunities

Get all available volunteer opportunities.

**Endpoint:** `GET /volunteer/opportunities`

**Access:** Public

**Query Parameters:**
- `status` (optional): open | closed | full
- `date` (optional): Filter by specific date
- `page` (optional)
- `limit` (optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "date": "date",
      "start_time": "time",
      "end_time": "time",
      "location": "string",
      "max_volunteers": 10,
      "current_volunteers": 7,
      "status": "open",
      "created_at": "timestamp"
    }
  ],
  "pagination": { ... }
}
```

### Get Volunteer Opportunity

Get details of a specific volunteer opportunity.

**Endpoint:** `GET /volunteer/opportunities/:id`

**Access:** Public

**Response:** `200 OK`

### Create Volunteer Opportunity

Create a new volunteer opportunity.

**Endpoint:** `POST /volunteer/opportunities`

**Access:** Admin only

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "date": "date (required)",
  "start_time": "time (required)",
  "end_time": "time (required)",
  "location": "string (required)",
  "max_volunteers": "integer (required, positive)"
}
```

**Response:** `201 Created`

### Update Volunteer Opportunity

Update volunteer opportunity details.

**Endpoint:** `PUT /volunteer/opportunities/:id`

**Access:** Admin only

**Request Body:** Same as create, all fields optional

**Response:** `200 OK`

### Get Opportunity Participants

Get list of volunteers signed up for an opportunity.

**Endpoint:** `GET /volunteer/opportunities/:opportunityId/participants`

**Access:** Admin only

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "student_name": "string",
      "email": "string",
      "signup_date": "timestamp"
    }
  ]
}
```

### Sign Up for Opportunity

Sign up as a volunteer for an opportunity.

**Endpoint:** `POST /volunteer/signup`

**Access:** Student only

**Request Body:**
```json
{
  "opportunity_id": "uuid (required)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Successfully signed up for volunteer opportunity",
  "data": {
    "id": "uuid",
    "opportunity_id": "uuid",
    "student_id": "uuid",
    "signup_date": "timestamp"
  }
}
```

**Business Rules:**
- Student cannot sign up twice for same opportunity
- Cannot sign up if opportunity is full
- Cannot sign up for past opportunities

### Cancel Volunteer Signup

Cancel volunteer signup for an opportunity.

**Endpoint:** `DELETE /volunteer/signup/:id`

**Access:** Student only (own signups)

**Response:** `200 OK`

**Business Rules:**
- Can only cancel if opportunity hasn't started
- Frees up slot for other volunteers

### Get Student Participation

Get all volunteer opportunities a student has signed up for.

**Endpoint:** `GET /volunteer/participation/:studentId`

**Access:** Authenticated

**Query Parameters:**
- `status` (optional): upcoming | completed | cancelled
- `page` (optional)
- `limit` (optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "opportunity_id": "uuid",
      "opportunity_title": "string",
      "date": "date",
      "start_time": "time",
      "location": "string",
      "status": "upcoming",
      "signup_date": "timestamp"
    }
  ],
  "pagination": { ... }
}
```

---

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error or business rule violation"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided" | "Invalid token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Duplicate reservation" | "Time slot already booked"
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

API is rate limited to prevent abuse:

**General API Rate Limiting:**
- Window: 15 minutes (configurable)
- Max requests: 100 per window (configurable)
- Applied to: All `/api/*` endpoints

**Chat Endpoint Rate Limiting:**
- Window: 1 minute
- Max requests: 20 per minute per user
- Applied to: `POST /api/chat`
- Purpose: Prevent abuse of AI assistant and manage LLM costs

When rate limit is exceeded:
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

**Status Code:** `429 Too Many Requests`

## Pagination

All list endpoints support pagination with consistent format:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default varies by endpoint)

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
