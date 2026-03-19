# Quick E2E Test Guide

## Quick Start (5 minutes)

### 1. Setup Database
```bash
psql -U postgres -c "CREATE DATABASE foodbridge;"
psql -U postgres -d foodbridge -f database/schema.sql
psql -U postgres -d foodbridge -f database/seeds/sample_data.sql
```

### 2. Configure Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Start Server
```bash
npm install
npm run dev
```

### 4. Run Tests (in another terminal)
```bash
cd backend

# Test 1: Student Flow (20 seconds)
node test-student-flow.js

# Test 2: Provider Flow (15 seconds)
node test-provider-flow.js

# Test 3: Combined Flow (20 seconds)
node test-combined-flow.js
```

---

## Test Summary

| Test | What It Tests | Duration | Status |
|------|---------------|----------|--------|
| **Student Flow** | Register → Login → Browse → Reserve → Confirm → Notify | 20s | ✅ |
| **Provider Flow** | Register → Login → Create Listing → View Reservations → Confirm | 15s | ✅ |
| **Combined Flow** | Provider creates listing → Student reserves → Provider confirms | 20s | ✅ |

---

## What Gets Tested

### Student Flow
```
Register User
    ↓
Login (get JWT)
    ↓
Browse Listings
    ↓
View Listing Details
    ↓
Make Reservation
    ↓
View My Reservations
    ↓
Confirm Pickup
    ↓
Check Notifications
    ↓
Get Unread Count
```

### Provider Flow
```
Register Provider
    ↓
Login (get JWT)
    ↓
Create Food Listing
    ↓
View My Listings
    ↓
View Reservations for Listing
    ↓
Confirm Student Pickup
    ↓
Update Listing
```

### Combined Flow
```
Provider Creates Listing
    ↓
Student Finds Listing
    ↓
Student Makes Reservation
    ↓
Provider Views Reservation
    ↓
Provider Confirms Pickup
    ↓
Student Gets Notification
```

---

## Expected Results

### ✅ All Tests Pass
```
✓ Server is running
✓ User registered successfully
✓ Login successful
✓ Listings retrieved successfully
✓ Reservation created successfully
✓ Pickup confirmed successfully
✓ Notifications retrieved
```

### ❌ Common Issues

| Issue | Solution |
|-------|----------|
| Server not running | Run `npm run dev` |
| Database error | Check `.env` credentials |
| No listings found | Load sample data |
| Listing not available | Use existing sample listings |
| JWT token invalid | Re-login to get fresh token |

---

## Key Endpoints Tested

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get JWT token

### Listings
- `GET /api/listings` - Browse food
- `POST /api/listings` - Create listing (provider)
- `GET /api/listings/provider/my-listings` - My listings

### Reservations
- `POST /api/reservations` - Reserve food
- `GET /api/reservations` - My reservations
- `GET /api/reservations/listing/:id` - Listing reservations (provider)
- `POST /api/reservations/:id/confirm-pickup` - Confirm pickup

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Unread count

---

## Test Data Created

Each test creates new users:
- **Student**: `test.student.{timestamp}@university.edu`
- **Provider**: `test.provider.{timestamp}@restaurant.com`

Sample listings available:
- Vegetarian Pasta Bowl
- Cheese Pizza Slices
- Cultural Night Leftovers

---

## Performance

- **Total test time**: ~55 seconds (all 3 tests)
- **API calls per test**: 7-9 endpoints
- **Database operations**: ~30 per test
- **Network latency**: <100ms per request

---

## Next Steps

After tests pass:
1. ✅ Core API is working
2. ✅ Database is configured
3. ✅ Authentication is functional
4. ✅ Reservations work end-to-end

Ready for:
- Frontend development
- Additional feature testing
- Load testing
- Security testing

---

## Files

- `test-student-flow.js` - Student journey test
- `test-provider-flow.js` - Provider journey test
- `test-combined-flow.js` - Provider-student interaction test
- `E2E_TESTS_DOCUMENTATION.md` - Full documentation
- `E2E_TEST_GUIDE.md` - Detailed guide
- `E2E_TEST_RESULTS.md` - Test results

---

## Support

**Server not starting?**
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Try again
npm run dev
```

**Database issues?**
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Recreate database
dropdb -U postgres foodbridge
psql -U postgres -c "CREATE DATABASE foodbridge;"
psql -U postgres -d foodbridge -f database/schema.sql
```

**Tests failing?**
```bash
# Check server is running
curl http://localhost:3000/health

# Check database connection
psql -U postgres -d foodbridge -c "SELECT COUNT(*) FROM users;"

# Check .env file
cat .env
```

---

## Success Criteria

✅ All tests pass
✅ No errors in output
✅ Notifications are created
✅ Reservations are confirmed
✅ Status transitions work correctly

You're ready to go! 🚀
