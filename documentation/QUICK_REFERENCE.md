# FoodBridge Backend - Quick Reference Guide

## Getting Started

### Installation
```bash
cd backend
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
npm start
```

### Testing
```bash
npm test
```

---

## API Base URL
```
http://localhost:3000/api
```

---

## Authentication

### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "student",
  "first_name": "John",
  "last_name": "Doe"
}
```

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Response includes JWT token
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Using Token
```bash
Authorization: Bearer <token>
```

---

## Common Endpoints

### Search Food Listings
```bash
GET /listings?dietary_tags=vegan&location=library&page=1&limit=20
```

### Create Reservation
```bash
POST /reservations
Authorization: Bearer <token>
Content-Type: application/json

{
  "listing_id": "uuid",
  "quantity": 2
}
```

### Book Pantry Appointment
```bash
POST /pantry/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "appointment_time": "2026-03-15T14:00:00Z",
  "duration_minutes": 30
}
```

### Get Available Slots
```bash
GET /pantry/appointments/slots?date=2026-03-15
```

### Add to Cart
```bash
POST /pantry/orders/cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "inventory_id": "uuid",
  "quantity": 2
}
```

### Submit Order
```bash
POST /pantry/orders/submit
Authorization: Bearer <token>
```

### Get Notifications
```bash
GET /notifications/user/:userId
Authorization: Bearer <token>
```

### Get Preferences
```bash
GET /preferences/user/:userId
Authorization: Bearer <token>
```

### Update Preferences
```bash
PUT /preferences/user/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "dietary_restrictions": ["vegan", "gluten_free"],
  "allergies": ["peanuts"],
  "favorite_cuisines": ["italian", "asian"]
}
```

### Get Recommendations
```bash
GET /preferences/recommendations/:userId?max_items=10
Authorization: Bearer <token>
```

### List Volunteer Opportunities
```bash
GET /volunteer/opportunities
```

### Sign Up for Volunteer
```bash
POST /volunteer/signup
Authorization: Bearer <token>
Content-Type: application/json

{
  "opportunity_id": "uuid"
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved",
  "data": {
    "items": [ ... ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "total_pages": 8
    }
  }
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Authorization failed |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## User Roles

| Role | Permissions |
|------|-------------|
| student | Browse listings, make reservations, book appointments, manage cart |
| provider | Create/manage listings, view reservations |
| admin | Manage pantry inventory, create volunteer opportunities |

---

## Listing Categories

- `meal` - Full meals
- `snack` - Snacks and light items
- `beverage` - Drinks
- `pantry_item` - Pantry stock items
- `deal` - Dining deals
- `event_food` - Event food

---

## Dietary Restrictions

- `vegan`
- `vegetarian`
- `gluten_free`
- `dairy_free`
- `nut_free`
- `halal`
- `kosher`

---

## Reservation Status

- `pending` - Awaiting confirmation
- `confirmed` - Confirmed by provider
- `picked_up` - Food picked up
- `cancelled` - Cancelled by student
- `no_show` - Student didn't show up

---

## Appointment Status

- `scheduled` - Appointment scheduled
- `confirmed` - Confirmed
- `completed` - Completed
- `cancelled` - Cancelled
- `no_show` - Student didn't show up

---

## Order Status

- `cart` - Items in shopping cart
- `submitted` - Order submitted
- `prepared` - Order prepared
- `picked_up` - Order picked up
- `cancelled` - Order cancelled

---

## Notification Types

- `reservation_confirmed` - Reservation confirmed
- `appointment_booked` - Appointment booked
- `appointment_reminder` - Appointment reminder
- `new_listing` - New food listing
- `reservation_cancelled` - Reservation cancelled
- `pickup_confirmed` - Pickup confirmed

---

## Environment Variables

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/foodbridge
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| users | User accounts |
| food_listings | Food donations |
| reservations | Food reservations |
| pantry_appointments | Pantry visits |
| pantry_inventory | Pantry stock |
| pantry_orders | Shopping carts & orders |
| notifications | User notifications |
| user_preferences | User preferences |
| preference_history | User behavior tracking |
| volunteer_opportunities | Volunteer tasks |
| volunteer_participation | Volunteer signups |

---

## Common Errors

### 401 Unauthorized
- Missing or invalid JWT token
- Token expired
- User account inactive

### 403 Forbidden
- User role doesn't have permission
- Trying to access another user's resource

### 400 Bad Request
- Invalid input data
- Missing required fields
- Invalid field values

### 404 Not Found
- Resource doesn't exist
- Wrong resource ID

### 409 Conflict
- Duplicate reservation
- Double booking
- Already signed up for volunteer

### 429 Too Many Requests
- Rate limit exceeded
- Wait 15 minutes before retrying

---

## Useful Queries

### Get All Active Listings
```bash
GET /listings?status=active
```

### Get Vegan Listings
```bash
GET /listings?dietary_tags=vegan
```

### Get My Reservations
```bash
GET /reservations/student/:userId
```

### Get My Appointments
```bash
GET /pantry/appointments/student/:userId
```

### Get My Orders
```bash
GET /pantry/orders/user/:userId
```

### Get My Notifications
```bash
GET /notifications/user/:userId
```

### Get My Preferences
```bash
GET /preferences/user/:userId
```

### Get My Recommendations
```bash
GET /preferences/recommendations/:userId
```

### Get My Volunteer History
```bash
GET /volunteer/participation/:userId
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "student",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Search Listings
```bash
curl -X GET "http://localhost:3000/api/listings?page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Create Reservation
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": "uuid",
    "quantity": 2
  }'
```

---

## Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-11T12:00:00Z",
  "uptime": 3600
}
```

---

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: 
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 99
  - `X-RateLimit-Reset`: 1234567890

---

## Documentation Files

- `BACKEND_IMPLEMENTATION_SUMMARY.md` - Complete overview
- `PHASE_2_COMPLETION_CHECKLIST.md` - Task completion details
- `PHASE_3_READINESS.md` - AI agent integration readiness
- `API_DOCUMENTATION.md` - Detailed endpoint reference
- `E2E_TESTS_DOCUMENTATION.md` - Test scenarios
- `E2E_TESTS_INDEX.md` - Test navigation

---

## Support

For detailed information:
1. Check the documentation files
2. Review the E2E test files for examples
3. Check the service layer for business logic
4. Review the repository layer for database queries

---

## Quick Links

- Backend Summary: `BACKEND_IMPLEMENTATION_SUMMARY.md`
- Phase 2 Checklist: `PHASE_2_COMPLETION_CHECKLIST.md`
- Phase 3 Readiness: `PHASE_3_READINESS.md`
- API Docs: `API_DOCUMENTATION.md`
- E2E Tests: `E2E_TESTS_INDEX.md`
