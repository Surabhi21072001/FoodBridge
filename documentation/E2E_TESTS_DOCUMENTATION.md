# FoodBridge End-to-End Tests Documentation

This document provides comprehensive information about the end-to-end tests for the FoodBridge platform, covering student flow, provider flow, and combined interactions.

## Overview

Three complete end-to-end test scripts are available:

1. **Student Flow Test** - Tests the complete student journey
2. **Provider Flow Test** - Tests the complete provider journey
3. **Combined Flow Test** - Tests provider-student interaction

## Test Files

### 1. Student Flow Test (`test-student-flow.js`)

**Purpose**: Validates the complete student user journey from registration through food pickup confirmation.

**Test Steps**:
1. Register new student user
2. Login and get JWT token
3. Browse available food listings
4. Get detailed listing information
5. Create reservation
6. View user's reservations
7. Confirm pickup
8. Check notifications
9. Get unread notification count

**Run Command**:
```bash
node backend/test-student-flow.js
```

**Expected Output**:
```
✓ User registered successfully
✓ Login successful
✓ Listings retrieved successfully
✓ Listing details retrieved
✓ Reservation created successfully
✓ User reservations retrieved
✓ Pickup confirmed successfully
✓ Notifications retrieved
✓ Unread count retrieved
```

**Key Validations**:
- User authentication and JWT token generation
- Food listing discovery and filtering
- Reservation creation with quantity validation
- Automatic confirmation code generation
- Notification creation on reservation
- Pickup confirmation with status transition

---

### 2. Provider Flow Test (`test-provider-flow.js`)

**Purpose**: Validates the complete provider journey from registration through managing reservations.

**Test Steps**:
1. Register new provider user
2. Login and get JWT token
3. Create food listing
4. View provider's listings
5. View reservations for listing
6. Confirm student pickup
7. Update listing (optional)

**Run Command**:
```bash
node backend/test-provider-flow.js
```

**Expected Output**:
```
✓ Provider registered successfully
✓ Login successful
✓ Listing created successfully
✓ Provider listings retrieved
✓ Reservations retrieved
✓ Pickup confirmed successfully
✓ Listing updated successfully
```

**Key Validations**:
- Provider authentication
- Listing creation with all required fields
- Listing retrieval and filtering
- Reservation viewing for provider's listings
- Pickup confirmation capability
- Listing updates (quantity, pricing)

---

### 3. Combined Flow Test (`test-combined-flow.js`)

**Purpose**: Validates the complete interaction between provider and student users.

**Test Steps**:
1. Provider registers
2. Provider creates listing
3. Student registers
4. Student browses listings
5. Student makes reservation
6. Provider views reservations
7. Provider confirms pickup
8. Student checks notifications

**Run Command**:
```bash
node backend/test-combined-flow.js
```

**Expected Output**:
```
✓ Provider registered
✓ Listing created
✓ Student registered
✓ Listings retrieved
✓ Reservation created
✓ Reservations retrieved
✓ Pickup confirmed
✓ Notifications retrieved
```

**Key Validations**:
- End-to-end provider-student interaction
- Listing visibility to students
- Reservation tracking for providers
- Notification delivery to students
- Complete workflow from listing to pickup

---

## API Endpoints Tested

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Listings
- `GET /api/listings` - Browse listings
- `GET /api/listings/:id` - Get listing details
- `POST /api/listings` - Create listing (provider)
- `PUT /api/listings/:id` - Update listing (provider)
- `GET /api/listings/provider/my-listings` - Get provider's listings

### Reservations
- `POST /api/reservations` - Create reservation (student)
- `GET /api/reservations` - Get user's reservations (student)
- `GET /api/reservations/listing/:id` - Get reservations for listing (provider)
- `POST /api/reservations/:id/confirm-pickup` - Confirm pickup

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count

---

## Prerequisites

### Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE foodbridge;"

# Run schema
psql -U postgres -d foodbridge -f database/schema.sql

# Load sample data
psql -U postgres -d foodbridge -f database/seeds/sample_data.sql
```

### Environment Configuration

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

### Install Dependencies

```bash
cd backend
npm install
```

### Start Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

---

## Test Data

### Student Test User
- **Email**: test.student.{timestamp}@university.edu
- **Password**: TestPassword123!
- **Role**: student

### Provider Test User
- **Email**: test.provider.{timestamp}@restaurant.com
- **Password**: ProviderPass123!
- **Role**: provider

### Sample Listings (from seed data)
1. **Vegetarian Pasta Bowl** - Campus Dining Hall
2. **Cheese Pizza Slices** - Pizza Palace
3. **Cultural Night Leftovers** - Student Club

---

## Test Results Summary

### Student Flow Test Results
- **Status**: ✅ PASSED
- **Duration**: ~20 seconds
- **Endpoints Tested**: 9
- **Key Features Validated**:
  - User registration and authentication
  - Food discovery and browsing
  - Reservation creation and management
  - Pickup confirmation
  - Notification system

### Provider Flow Test Results
- **Status**: ✅ PASSED
- **Duration**: ~15 seconds
- **Endpoints Tested**: 7
- **Key Features Validated**:
  - Provider registration and authentication
  - Listing creation and management
  - Reservation viewing
  - Pickup confirmation
  - Listing updates

### Combined Flow Test Results
- **Status**: ✅ PASSED
- **Duration**: ~20 seconds
- **Endpoints Tested**: 8
- **Key Features Validated**:
  - Provider-student interaction
  - End-to-end workflow
  - Notification delivery
  - Complete reservation lifecycle

---

## Running All Tests

To run all three tests sequentially:

```bash
# Start server
npm run dev &

# Wait for server to start
sleep 3

# Run all tests
node test-student-flow.js
node test-provider-flow.js
node test-combined-flow.js
```

---

## Troubleshooting

### Server Not Running
```
✗ Server is not running at http://localhost:3000
```
**Solution**: Start the server with `npm run dev`

### Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: 
1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify database exists: `psql -U postgres -l | grep foodbridge`

### No Active Listings Found
```
✗ No active listings found
```
**Solution**: Load sample data with `psql -U postgres -d foodbridge -f database/seeds/sample_data.sql`

### JWT Token Invalid
```
✗ Unauthorized
```
**Solution**: 
1. Ensure JWT_SECRET in `.env` is set
2. Re-login to get a fresh token
3. Check token hasn't expired

### Listing Not Available
```
✗ Listing is not currently available
```
**Solution**: The listing's availability window has passed. The combined test automatically selects an available listing.

---

## Performance Metrics

| Test | Duration | Endpoints | Status |
|------|----------|-----------|--------|
| Student Flow | ~20s | 9 | ✅ PASS |
| Provider Flow | ~15s | 7 | ✅ PASS |
| Combined Flow | ~20s | 8 | ✅ PASS |

---

## Next Steps

After successful E2E testing:

1. **Unit Tests** - Test individual functions and services
2. **Integration Tests** - Test service interactions
3. **Load Testing** - Test with multiple concurrent users
4. **Security Testing** - Test authentication and authorization
5. **Performance Testing** - Measure response times and throughput

---

## Test Coverage

### Features Covered
- ✅ User authentication (registration, login)
- ✅ Food listing management (create, read, update)
- ✅ Reservation system (create, view, confirm)
- ✅ Notification system (create, retrieve)
- ✅ Role-based access control (student, provider)
- ✅ Quantity tracking and validation
- ✅ Confirmation code generation and validation
- ✅ Status transitions (confirmed → picked_up)

### Features Not Yet Tested
- ⏳ Pantry appointment booking
- ⏳ Pantry inventory management
- ⏳ Dining deals
- ⏳ Volunteer coordination
- ⏳ AI assistant integration
- ⏳ User preferences and recommendations

---

## Notes

- Each test creates new users to avoid conflicts
- Tests use real API endpoints (no mocking)
- Tests validate both success and error cases
- Confirmation codes are 6-character alphanumeric strings
- All timestamps are in UTC format
- Tests are idempotent and can be run multiple times

---

## Support

For issues or questions about the tests:

1. Check the troubleshooting section above
2. Review the test output for specific error messages
3. Verify all prerequisites are met
4. Check server logs for backend errors
5. Ensure database is properly initialized

---

## Conclusion

The end-to-end tests provide comprehensive validation of the FoodBridge platform's core functionality. All three test suites pass successfully, confirming that:

- User authentication works correctly
- Food listing management is functional
- Reservation system operates as expected
- Notifications are delivered properly
- Provider-student interactions are seamless
- The complete workflow from listing to pickup is operational

The platform is ready for further development and testing of additional features.
