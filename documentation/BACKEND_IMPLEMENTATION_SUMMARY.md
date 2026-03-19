# FoodBridge Backend Implementation Summary

## Overview

The FoodBridge backend is a fully-featured Node.js/Express API built with TypeScript that implements all Phase 2 requirements. The backend provides RESTful endpoints for food discovery, reservations, pantry management, notifications, preferences, and volunteer coordination.

## Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod schema validation
- **Security**: Helmet, CORS, Rate Limiting

### Project Structure

```
backend/src/
├── config/              # Configuration files
│   └── database.ts      # PostgreSQL connection pool
├── controllers/         # HTTP request handlers
│   ├── userController.ts
│   ├── listingController.ts
│   ├── reservationController.ts
│   ├── pantryAppointmentController.ts
│   ├── pantryInventoryController.ts
│   ├── pantryOrderController.ts
│   ├── notificationController.ts
│   ├── preferenceController.ts
│   └── volunteerController.ts
├── services/           # Business logic layer
│   ├── userService.ts
│   ├── listingService.ts
│   ├── reservationService.ts
│   ├── pantryAppointmentService.ts
│   ├── pantryInventoryService.ts
│   ├── pantryOrderService.ts
│   ├── notificationService.ts
│   ├── preferenceService.ts
│   └── volunteerService.ts
├── repositories/       # Database access layer
│   ├── userRepository.ts
│   ├── listingRepository.ts
│   ├── reservationRepository.ts
│   ├── pantryAppointmentRepository.ts
│   ├── pantryInventoryRepository.ts
│   ├── pantryOrderRepository.ts
│   ├── notificationRepository.ts
│   ├── preferenceRepository.ts
│   └── volunteerRepository.ts
├── routes/            # API route definitions
│   ├── authRoutes.ts
│   ├── userRoutes.ts
│   ├── listingRoutes.ts
│   ├── reservationRoutes.ts
│   ├── pantryAppointmentRoutes.ts
│   ├── pantryInventoryRoutes.ts
│   ├── pantryOrderRoutes.ts
│   ├── notificationRoutes.ts
│   ├── preferenceRoutes.ts
│   └── volunteerRoutes.ts
├── middleware/        # Cross-cutting concerns
│   ├── auth.ts        # JWT authentication & authorization
│   ├── errorHandler.ts # Global error handling
│   └── validator.ts   # Request validation
├── validators/        # Zod validation schemas
│   ├── userValidators.ts
│   ├── listingValidators.ts
│   ├── reservationValidators.ts
│   ├── pantryAppointmentValidators.ts
│   ├── pantryInventoryValidators.ts
│   ├── pantryOrderValidators.ts
│   ├── notificationValidators.ts
│   ├── preferenceValidators.ts
│   └── volunteerValidators.ts
├── types/            # TypeScript type definitions
│   └── index.ts
├── utils/            # Utility functions
│   ├── errors.ts     # Custom error classes
│   └── response.ts   # Response formatting
└── index.ts          # Application entry point
```

## API Endpoints

### Authentication (POST /api/auth)
- `POST /register` - Register new user (student/provider/admin)
- `POST /login` - Login and receive JWT token

### Users (GET/PUT /api/users)
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update user profile
- `POST /users/:id/change-password` - Change password

### Food Listings (GET/POST/PUT/DELETE /api/listings)
- `GET /listings` - Search listings with filters (dietary, location, food_type)
- `GET /listings/:id` - Get listing details
- `POST /listings` - Create listing (provider only)
- `PUT /listings/:id` - Update listing (provider only)
- `DELETE /listings/:id` - Delete listing (provider only)
- `GET /listings/provider/my-listings` - Get provider's listings

**Filters Supported:**
- `dietary_tags` - Array of dietary restrictions
- `location` - Pickup location
- `category` - Food category (meal, snack, beverage, pantry_item, deal, event_food)
- `status` - Listing status (active, reserved, completed, cancelled, expired)
- `page` - Pagination page number
- `limit` - Items per page

### Reservations (GET/POST/DELETE /api/reservations)
- `POST /reservations` - Create reservation (student only)
- `GET /reservations/student/:studentId` - Get student's reservations
- `GET /reservations/listing/:listingId` - Get listing's reservations (provider only)
- `DELETE /reservations/:id` - Cancel reservation
- `POST /reservations/:id/confirm-pickup` - Confirm pickup (provider only)

**Features:**
- Atomic quantity updates using database transactions
- Duplicate reservation prevention
- Pickup confirmation with timestamp tracking
- Automatic listing status update when all pickups confirmed

### Pantry Appointments (GET/POST/DELETE /api/pantry/appointments)
- `GET /pantry/appointments/slots` - Get available time slots
- `POST /pantry/appointments` - Book appointment (student only)
- `GET /pantry/appointments/student/:studentId` - Get student's appointments
- `DELETE /pantry/appointments/:id` - Cancel appointment
- `PATCH /pantry/appointments/:id` - Update appointment

**Features:**
- 30-minute time slot generation (9 AM - 5 PM)
- Conflict detection and prevention
- Future-only appointment validation

### Pantry Inventory (GET/POST/PATCH /api/pantry/inventory)
- `GET /pantry/inventory` - List inventory items with pagination
- `GET /pantry/inventory/:id` - Get inventory item details
- `POST /pantry/inventory` - Create inventory item (admin only)
- `PATCH /pantry/inventory/:id` - Update inventory item (admin only)

**Features:**
- Stock level tracking
- Low stock alerts
- Dietary tags and allergen information
- Reorder threshold management

### Pantry Orders (GET/POST/PATCH /api/pantry/orders)
- `GET /pantry/orders/cart` - Get active cart
- `POST /pantry/orders/cart/items` - Add item to cart
- `PATCH /pantry/orders/cart/items/:inventoryId` - Update cart item quantity
- `DELETE /pantry/orders/cart/items/:inventoryId` - Remove item from cart
- `POST /pantry/orders/submit` - Submit order
- `GET /pantry/orders/:id` - Get order details
- `GET /pantry/orders/user/:userId` - Get user's orders

**Features:**
- Shopping cart management
- Inventory validation before order submission
- Automatic inventory deduction on order submission
- Order status tracking (cart, submitted, prepared, picked_up, cancelled)

### Notifications (GET/PATCH/DELETE /api/notifications)
- `GET /notifications/user/:userId` - Get user's notifications
- `PATCH /notifications/:id/read` - Mark notification as read
- `PATCH /notifications/mark-all-read` - Mark all as read
- `DELETE /notifications/:id` - Delete notification

**Notification Types:**
- `reservation_confirmed` - Reservation confirmation
- `appointment_booked` - Pantry appointment confirmation
- `appointment_reminder` - Upcoming appointment reminder
- `new_listing` - New food listing matching preferences
- `reservation_cancelled` - Reservation cancellation
- `pickup_confirmed` - Pickup confirmation

### Preferences (GET/PUT/POST /api/preferences)
- `GET /preferences/user/:userId` - Get user preferences
- `PUT /preferences/user/:userId` - Update preferences
- `POST /preferences/track/pantry-selection` - Track pantry item selection
- `POST /preferences/track/reservation` - Track reservation
- `POST /preferences/track/filter` - Track filter application
- `GET /preferences/frequent-items/:userId` - Get frequently selected items
- `GET /preferences/frequent-providers/:userId` - Get frequently used providers
- `GET /preferences/recommendations/:userId` - Get personalized recommendations
- `GET /preferences/history/:userId` - Get preference history

**Features:**
- Dietary restriction tracking
- Allergy management
- Favorite cuisine preferences
- Preferred provider tracking
- Notification preference customization
- Frequency-based recommendations
- Smart cart generation from history

### Volunteer (GET/POST/DELETE /api/volunteer)
- `GET /volunteer/opportunities` - List volunteer opportunities
- `GET /volunteer/opportunities/:id` - Get opportunity details
- `POST /volunteer/opportunities` - Create opportunity (admin only)
- `PUT /volunteer/opportunities/:id` - Update opportunity (admin only)
- `POST /volunteer/signup` - Sign up for opportunity (student only)
- `DELETE /volunteer/signup/:id` - Cancel signup
- `GET /volunteer/participation/:studentId` - Get student's participation history
- `GET /volunteer/opportunities/:opportunityId/participants` - Get opportunity participants (admin only)

**Features:**
- Capacity management
- Automatic status updates (open/closed)
- Participation tracking
- Conflict prevention

### Health Check (GET /health)
- `GET /health` - System health status (no authentication required)

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-11T12:00:00Z",
  "uptime": 3600
}
```

## Authentication & Authorization

### JWT Implementation
- **Token Generation**: On successful login/registration
- **Token Expiration**: 7 days
- **Header Format**: `Authorization: Bearer <token>`
- **Payload**: `{ id, email, role, expiresIn }`

### Role-Based Access Control
- **Student**: Can browse listings, make reservations, book appointments, manage cart
- **Provider**: Can create/manage listings, view reservations
- **Admin**: Can manage pantry inventory, create volunteer opportunities

### Middleware
- `authenticate` - Verifies JWT token and extracts user info
- `authorize(...roles)` - Checks user role against allowed roles

## Error Handling

### Custom Error Classes
- `AppError` - Base error class with status code
- `BadRequestError` (400) - Invalid request data
- `UnauthorizedError` (401) - Authentication failed
- `ForbiddenError` (403) - Authorization failed
- `NotFoundError` (404) - Resource not found
- `ConflictError` (409) - Resource conflict (e.g., duplicate)

### Error Response Format
```json
{
  "success": false,
  "message": "Error description"
}
```

## Validation

### Zod Schemas
All endpoints use Zod schemas for request validation:
- Request body validation
- Query parameter validation
- Path parameter validation
- Type coercion and transformation

### Validation Middleware
- Validates incoming requests against schemas
- Returns 400 with detailed error messages on validation failure
- Supports nested object validation

## Database

### Connection Pool
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 10 seconds

### Transaction Support
- Atomic operations for critical workflows
- Automatic rollback on error
- Row-level locking for concurrent access

### Key Tables
- `users` - User accounts with roles
- `food_listings` - Food donation listings
- `reservations` - Food reservations
- `pantry_appointments` - Pantry visit appointments
- `pantry_inventory` - Pantry stock items
- `pantry_orders` - Shopping cart and orders
- `notifications` - User notifications
- `user_preferences` - User dietary preferences
- `preference_history` - User behavior tracking
- `volunteer_opportunities` - Volunteer tasks
- `volunteer_participation` - Volunteer signups

## Rate Limiting

### Global Rate Limiting
- **Window**: 15 minutes (900,000 ms)
- **Max Requests**: 100 per window per IP
- **Applied to**: All `/api` routes

### Configuration
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Features

### Helmet.js
- Sets security HTTP headers
- Prevents common vulnerabilities (XSS, clickjacking, etc.)

### CORS
- Configurable origin
- Credentials support
- Default: Allow all origins (configurable)

### Password Security
- Bcrypt hashing with salt rounds: 10
- Never stored in plain text
- Excluded from API responses

### JWT Security
- Signed with secret key
- Expiration enforcement
- Verified on every protected request

## Environment Configuration

### Required Variables
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/foodbridge
JWT_SECRET=your_jwt_secret_key_change_in_production
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Running the Backend

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Testing
```bash
npm test
```

## Key Features Implemented

### ✅ Authentication & Authorization
- User registration with role selection
- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt

### ✅ Food Listing Management
- Create, read, update, delete listings
- Dietary tag filtering
- Location-based search
- Status tracking (active, reserved, completed, cancelled, expired)
- Image URL validation

### ✅ Reservation System
- Create reservations with quantity tracking
- Duplicate reservation prevention
- Atomic quantity updates using transactions
- Pickup confirmation with codes
- Automatic listing status updates

### ✅ Pantry Management
- Appointment booking with conflict detection
- Time slot generation (30-minute intervals)
- Inventory management with stock tracking
- Shopping cart functionality
- Order submission with inventory validation

### ✅ Notification System
- Multiple notification types
- User preference filtering
- Unread count tracking
- Preference-based targeting

### ✅ Preference Learning
- Behavior tracking (pantry selections, reservations, filters)
- Frequency analysis
- Personalized recommendations
- Smart cart generation

### ✅ Volunteer Coordination
- Opportunity creation and management
- Capacity tracking
- Automatic status updates
- Participation history

### ✅ API Standards
- RESTful design
- Pagination support
- Consistent error responses
- Request validation
- Rate limiting

## Testing

The backend includes comprehensive E2E tests covering:
- Student flow (registration → browsing → reservation → pickup)
- Provider flow (registration → listing creation → reservation management)
- Combined provider-student interactions
- Pantry appointment booking and cart management
- Event food discovery and filtering

See `E2E_TESTS_INDEX.md` for detailed test documentation.

## Next Steps

### Phase 3: AI Agent Integration
- LLM integration (OpenAI/Anthropic)
- Tool execution layer
- Conversational context management
- Smart cart generation with AI

### Phase 4: Frontend Development
- React/Vue web application
- Real-time updates (WebSocket/SSE)
- User dashboards
- Chat interface

### Phase 5: Testing & Deployment
- Integration tests
- Load testing
- Security audit
- Production deployment

## API Documentation

For detailed API documentation including request/response examples, see:
- `API_DOCUMENTATION.md` - Complete endpoint reference
- `ENDPOINTS_SUMMARY.md` - Quick endpoint overview
- `E2E_TESTS_DOCUMENTATION.md` - Test scenarios and workflows

## Support

For issues or questions about the backend implementation:
1. Check the documentation files
2. Review the E2E test files for usage examples
3. Check the service layer for business logic details
4. Review the repository layer for database queries
