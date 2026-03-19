# FoodBridge Backend API

Node.js + TypeScript + Express backend for the FoodBridge AI platform.

## Architecture

Clean service architecture with separation of concerns:

```
src/
├── config/          # Database and configuration
├── controllers/     # Request handlers
├── services/        # Business logic
├── repositories/    # Database queries
├── routes/          # API route definitions
├── middleware/      # Auth, validation, error handling
├── validators/      # Zod validation schemas
├── utils/           # Helper functions
└── types/           # TypeScript type definitions
```

## Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Student, Provider, Admin roles
- **Input Validation**: Zod schema validation
- **Database Transactions**: Atomic operations for critical flows
- **Error Handling**: Centralized error handling with custom error types
- **Rate Limiting**: Protection against abuse
- **Security**: Helmet, CORS, input sanitization

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Setup database
psql -U postgres -c "CREATE DATABASE foodbridge;"
psql -U postgres -d foodbridge -f ../database/schema.sql

# Optional: Load seed data
psql -U postgres -d foodbridge -f ../database/seeds/sample_data.sql
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## API Endpoints

### Authentication

#### Register
```http
POST /api/users/register
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "password123",
  "role": "student",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "555-0100"
}
```

#### Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "password123"
}
```

Response includes JWT token:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Food Listings

#### List Listings
```http
GET /api/listings?category=meal&dietary_tags=vegetarian&available_now=true&page=1&limit=20
```

#### Get Listing
```http
GET /api/listings/:id
```

#### Create Listing (Provider only)
```http
POST /api/listings
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Vegetarian Pasta Bowl",
  "description": "Fresh pasta with marinara sauce",
  "category": "meal",
  "cuisine_type": "italian",
  "dietary_tags": ["vegetarian"],
  "allergen_info": ["gluten", "dairy"],
  "quantity_available": 15,
  "unit": "serving",
  "original_price": 8.50,
  "discounted_price": 3.00,
  "pickup_location": "Campus Dining Hall",
  "available_from": "2024-03-10T12:00:00Z",
  "available_until": "2024-03-10T18:00:00Z"
}
```

#### Update Listing (Provider only)
```http
PUT /api/listings/:id
Authorization: Bearer <token>
```

#### Delete Listing (Provider only)
```http
DELETE /api/listings/:id
Authorization: Bearer <token>
```

### Reservations

#### Create Reservation (Student only)
```http
POST /api/reservations
Authorization: Bearer <token>
Content-Type: application/json

{
  "listing_id": "uuid",
  "quantity": 2,
  "pickup_time": "2024-03-10T15:00:00Z",
  "notes": "Allergic to nuts"
}
```

#### Get User Reservations
```http
GET /api/reservations?status=confirmed&page=1&limit=20
Authorization: Bearer <token>
```

#### Cancel Reservation
```http
DELETE /api/reservations/:id
Authorization: Bearer <token>
```

#### Confirm Pickup
```http
POST /api/reservations/:id/confirm-pickup
Authorization: Bearer <token>
Content-Type: application/json

{
  "confirmation_code": "ABC123"
}
```

### Pantry Appointments

#### Create Appointment (Student only)
```http
POST /api/pantry/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "appointment_time": "2024-03-12T14:00:00Z",
  "duration_minutes": 30,
  "notes": "First time visitor"
}
```

#### Get User Appointments
```http
GET /api/pantry/appointments?upcoming=true&page=1&limit=20
Authorization: Bearer <token>
```

#### Cancel Appointment
```http
DELETE /api/pantry/appointments/:id
Authorization: Bearer <token>
```

### Notifications

#### Get User Notifications
```http
GET /api/notifications?is_read=false&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

#### Mark as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer <token>
```

### Pantry Inventory

#### List Inventory
```http
GET /api/pantry/inventory?category=canned_goods&low_stock=true&page=1&limit=50
Authorization: Bearer <token>
```

#### Create Item (Admin only)
```http
POST /api/pantry/inventory
Authorization: Bearer <token>
Content-Type: application/json

{
  "item_name": "Canned Black Beans",
  "category": "canned_goods",
  "quantity": 45,
  "unit": "can",
  "expiration_date": "2027-12-31",
  "dietary_tags": ["vegan", "gluten-free"],
  "location": "Shelf A1",
  "reorder_threshold": 15
}
```

#### Update Item (Admin only)
```http
PUT /api/pantry/inventory/:id
Authorization: Bearer <token>
```

#### Adjust Quantity (Admin only)
```http
POST /api/pantry/inventory/:id/adjust-quantity
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity_change": -5
}
```

### Pantry Orders

#### Get Cart (Student only)
```http
GET /api/pantry/orders/cart
Authorization: Bearer <token>
```

#### Add Item to Cart
```http
POST /api/pantry/orders/cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "inventory_id": "uuid",
  "quantity": 2
}
```

#### Update Cart Item
```http
PUT /api/pantry/orders/cart/items/:inventory_id
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove Cart Item
```http
DELETE /api/pantry/orders/cart/items/:inventory_id
Authorization: Bearer <token>
```

#### Submit Order
```http
POST /api/pantry/orders/cart/submit
Authorization: Bearer <token>
```

#### Get Order History
```http
GET /api/pantry/orders?status=submitted&page=1&limit=20
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Paginated Response
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

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Error Codes

- `400` - Bad Request (validation errors, business logic violations)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate reservation, time slot conflict)
- `500` - Internal Server Error

## Business Logic

### Reservations
- Atomic quantity updates with database transactions
- Prevents duplicate reservations per user per listing
- Validates quantity availability before reservation
- Generates unique confirmation codes
- Returns reserved quantity when cancelled

### Pantry Appointments
- Prevents double booking with time slot conflict detection
- Validates appointment times are in the future
- Supports configurable duration (default 30 minutes)

### Pantry Orders
- Cart-based ordering system
- Atomic inventory deduction on order submission
- Validates inventory availability before submission
- Automatic total items calculation

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with configurable expiration
- Role-based access control on all protected routes
- Input validation with Zod schemas
- SQL injection protection via parameterized queries
- Rate limiting to prevent abuse
- Helmet for security headers
- CORS configuration

## Database Transactions

Critical operations use PostgreSQL transactions:

1. **Create Reservation**: Lock listing row, validate quantity, update reserved count, create reservation
2. **Cancel Reservation**: Lock reservation, return quantity to listing, update status
3. **Submit Pantry Order**: Validate all items, deduct from inventory, update order status

## Environment Variables

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=foodbridge
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- userService.test.ts
```

## Deployment

```bash
# Build
npm run build

# Start production server
NODE_ENV=production npm start
```

## Contributing

1. Follow TypeScript best practices
2. Use async/await for asynchronous operations
3. Add validation schemas for all inputs
4. Write unit tests for services
5. Document new endpoints in this README

## License

MIT
