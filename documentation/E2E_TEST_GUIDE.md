# End-to-End Student Flow Test Guide

This guide explains how to test the complete student journey through the FoodBridge platform.

## Test Flow Overview

The test covers the following student journey:

1. **Register** - Create a new student account
2. **Login** - Authenticate and receive JWT token
3. **Browse Listings** - View available food listings
4. **Get Details** - View detailed information about a specific listing
5. **Reserve Food** - Create a reservation for food items
6. **View Reservations** - Check all user reservations
7. **Confirm Pickup** - Confirm food pickup with confirmation code
8. **Check Notifications** - View notifications about reservations
9. **Unread Count** - Get count of unread notifications

## Prerequisites

### 1. Database Setup

Ensure PostgreSQL is running and the database is set up:

```bash
# Create database
psql -U postgres -c "CREATE DATABASE foodbridge;"

# Run schema
psql -U postgres -d foodbridge -f database/schema.sql

# Load sample data
psql -U postgres -d foodbridge -f database/seeds/sample_data.sql
```

### 2. Environment Configuration

Create `.env` file in the backend directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=foodbridge
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Start the Server

```bash
npm run dev
```

The server should start on `http://localhost:3000`

## Running the Tests

### Option 1: Bash Script (Recommended for Unix/Linux/Mac)

```bash
cd backend
chmod +x test-student-flow.sh
./test-student-flow.sh
```

### Option 2: Node.js Script (Cross-platform)

```bash
cd backend
node test-student-flow.js
```

## Expected Output

Both test scripts will output colored, step-by-step results:

```
========================================
Checking Server Health
========================================

✓ Server is running

========================================
STEP 1: Register New Student User
========================================

✓ User registered successfully
ℹ User ID: 12345678-1234-1234-1234-123456789abc

========================================
STEP 2: Login and Get JWT Token
========================================

✓ Login successful
ℹ JWT Token obtained (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

... (continues for all steps)

========================================
TEST SUMMARY
========================================

✓ All tests passed successfully!

Test User Details:
  Email: test.student.1234567890@university.edu
  Password: TestPassword123!
  User ID: 12345678-1234-1234-1234-123456789abc

Test Results:
  Reservation ID: 87654321-4321-4321-4321-210987654321
  Confirmation Code: ABC123
  Listing Reserved: Vegetarian Pasta Bowl
  Notifications: 1

ℹ End-to-end student flow completed successfully!
```

## Manual Testing with cURL

You can also test individual endpoints manually:

### 1. Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manual.test@university.edu",
    "password": "TestPassword123!",
    "role": "student",
    "firstName": "Manual",
    "lastName": "Test",
    "phone": "555-1234"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manual.test@university.edu",
    "password": "TestPassword123!"
  }'
```

Save the JWT token from the response.

### 3. Browse Listings

```bash
curl -X GET "http://localhost:3000/api/listings?status=active&limit=10" \
  -H "Content-Type: application/json"
```

### 4. Create Reservation

```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "listingId": "LISTING_ID_FROM_STEP_3",
    "quantity": 2
  }'
```

### 5. Confirm Pickup

```bash
curl -X POST http://localhost:3000/api/reservations/RESERVATION_ID/confirm-pickup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "confirmationCode": "CONFIRMATION_CODE_FROM_STEP_4"
  }'
```

### 6. Check Notifications

```bash
curl -X GET http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing with Postman

Import the following collection structure:

1. Create a new collection: "FoodBridge Student Flow"
2. Add environment variables:
   - `base_url`: `http://localhost:3000/api`
   - `jwt_token`: (will be set after login)
   - `listing_id`: (will be set after browsing)
   - `reservation_id`: (will be set after reservation)
   - `confirmation_code`: (will be set after reservation)

3. Add requests in order:
   - POST `/auth/register`
   - POST `/auth/login` (save token to environment)
   - GET `/listings?status=active`
   - POST `/reservations`
   - POST `/reservations/:id/confirm-pickup`
   - GET `/notifications`

## Troubleshooting

### Server Not Running

```
✗ Server is not running at http://localhost:3000/api
```

**Solution**: Start the server with `npm run dev` in the backend directory.

### No Active Listings Found

```
✗ No active listings found. Please ensure sample data is loaded.
```

**Solution**: Load sample data:
```bash
psql -U postgres -d foodbridge -f database/seeds/sample_data.sql
```

### Database Connection Error

```
Error: connect ECONNREFUSED
```

**Solution**: 
1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify database exists: `psql -U postgres -l | grep foodbridge`

### JWT Token Invalid

```
✗ Unauthorized
```

**Solution**: 
1. Ensure JWT_SECRET in `.env` matches what was used to create the token
2. Check token hasn't expired (default: 7 days)
3. Re-login to get a fresh token

### Reservation Failed - Insufficient Quantity

```
✗ Insufficient quantity available
```

**Solution**: The listing may have been fully reserved. Either:
1. Reload sample data
2. Choose a different listing
3. Reduce the quantity in the reservation request

## API Endpoints Reference

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login and get JWT |
| GET | `/api/listings` | No | Browse food listings |
| GET | `/api/listings/:id` | No | Get listing details |
| POST | `/api/reservations` | Yes (Student) | Create reservation |
| GET | `/api/reservations` | Yes (Student) | Get user reservations |
| POST | `/api/reservations/:id/confirm-pickup` | Yes | Confirm pickup |
| GET | `/api/notifications` | Yes | Get notifications |
| GET | `/api/notifications/unread-count` | Yes | Get unread count |

## Next Steps

After successful testing, you can:

1. Test provider flows (create listings, manage reservations)
2. Test pantry appointment booking
3. Test notification marking as read
4. Test filtering and search functionality
5. Integrate with frontend application
6. Set up automated integration tests

## Sample Test Users

From `database/seeds/sample_data.sql`:

**Students:**
- alice.student@university.edu (password: password123)
- bob.student@university.edu (password: password123)
- carol.student@university.edu (password: password123)

**Providers:**
- dining.hall@university.edu (password: password123)
- pizza.place@restaurant.com (password: password123)

**Admin:**
- admin@university.edu (password: password123)

Note: The test scripts create new users to avoid conflicts.
