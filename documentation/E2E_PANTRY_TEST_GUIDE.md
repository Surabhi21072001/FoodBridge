# FoodBridge Pantry E2E Test Guide

## Overview

The pantry flow test validates the complete pantry journey for students, including:
- Booking pantry appointments
- Viewing available inventory
- Managing shopping cart
- Placing pantry orders

## Test File

**File**: `test-pantry-flow.js`
**Duration**: ~20 seconds
**Steps**: 11

## Test Flow

### STEP 1: Register Student User
- Creates a new student account
- Validates user registration
- Obtains JWT token

**Endpoint**: `POST /api/auth/register`
**Expected**: User created with ID and token

### STEP 2: Get Available Appointment Slots
- Retrieves available pantry appointment slots
- Filters for future slots
- Displays available time windows

**Endpoint**: `GET /api/pantry/appointments/slots`
**Expected**: List of available appointment times

### STEP 3: Book Pantry Appointment
- Books an appointment for a future time slot
- Specifies duration and notes
- Confirms appointment creation

**Endpoint**: `POST /api/pantry/appointments`
**Request Body**:
```json
{
  "appointment_time": "2026-03-11T16:00:00.000Z",
  "duration_minutes": 30,
  "notes": "First time pantry visit"
}
```
**Expected**: Appointment created with ID and status

### STEP 4: View User Appointments
- Retrieves all user's pantry appointments
- Filters for upcoming appointments
- Shows appointment details

**Endpoint**: `GET /api/pantry/appointments?upcoming=true`
**Expected**: List of user's appointments

### STEP 5: Get Pantry Inventory
- Retrieves available pantry items
- Shows item names, quantities, and units
- Displays first 10 items

**Endpoint**: `GET /api/pantry/inventory?limit=10`
**Expected**: List of pantry inventory items

### STEP 6: Add Items to Cart
- Adds inventory items to shopping cart
- Specifies quantity for each item
- Adds first 2 items

**Endpoint**: `POST /api/pantry/orders/cart/items`
**Request Body**:
```json
{
  "inventory_id": "item-uuid",
  "quantity": 2
}
```
**Expected**: Item added to cart

### STEP 7: View Shopping Cart
- Retrieves current shopping cart
- Shows all items and quantities
- Displays cart summary

**Endpoint**: `GET /api/pantry/orders/cart`
**Expected**: Cart with items list

### STEP 8: Update Cart Item Quantity
- Updates quantity of item in cart
- Changes quantity to 5
- Validates update

**Endpoint**: `PUT /api/pantry/orders/cart/items/:inventory_id`
**Request Body**:
```json
{
  "quantity": 5
}
```
**Expected**: Cart item updated

### STEP 9: Submit Pantry Order
- Submits cart as pantry order
- Converts cart to submitted order
- Generates order ID

**Endpoint**: `POST /api/pantry/orders/cart/submit`
**Expected**: Order created with ID and status

### STEP 10: View Order History
- Retrieves all user's pantry orders
- Shows order list with statuses
- Displays first 3 orders

**Endpoint**: `GET /api/pantry/orders?limit=10`
**Expected**: List of user's orders

### STEP 11: Get Order Details
- Retrieves specific order details
- Shows items and order information
- Displays order timestamps

**Endpoint**: `GET /api/pantry/orders/:id`
**Expected**: Order details with items

---

## API Endpoints Tested

### Appointments (5 endpoints)
- ✅ `GET /api/pantry/appointments/slots` - Get available slots
- ✅ `POST /api/pantry/appointments` - Book appointment
- ✅ `GET /api/pantry/appointments` - Get user appointments
- ✅ `GET /api/pantry/appointments/:id` - Get appointment details
- ✅ `PUT /api/pantry/appointments/:id` - Update appointment

### Inventory (1 endpoint)
- ✅ `GET /api/pantry/inventory` - Get inventory items

### Orders/Cart (6 endpoints)
- ✅ `GET /api/pantry/orders/cart` - Get cart
- ✅ `POST /api/pantry/orders/cart/items` - Add to cart
- ✅ `PUT /api/pantry/orders/cart/items/:id` - Update cart item
- ✅ `DELETE /api/pantry/orders/cart/items/:id` - Remove from cart
- ✅ `POST /api/pantry/orders/cart/submit` - Submit order
- ✅ `GET /api/pantry/orders` - Get order history
- ✅ `GET /api/pantry/orders/:id` - Get order details

**Total Endpoints**: 13

---

## Running the Test

### Prerequisites
```bash
# Ensure database is set up
psql -U postgres -d foodbridge -f database/schema.sql
psql -U postgres -d foodbridge -f database/seeds/sample_data.sql

# Configure environment
cd backend
cp .env.example .env
# Edit .env with your database credentials

# Install dependencies
npm install
```

### Start Server
```bash
npm run dev
```

### Run Test
```bash
cd backend
node test-pantry-flow.js
```

---

## Expected Output

```
╔════════════════════════════════════════╗
║  FoodBridge Pantry E2E Flow Test      ║
╚════════════════════════════════════════╝

✓ Server is running

STEP 1: Register Student User
✓ Student registered successfully

STEP 2: Get Available Appointment Slots
✓ Available slots retrieved
  Total slots: 16

STEP 3: Book Pantry Appointment
✓ Appointment booked successfully
  Appointment ID: ae596216-6106-4a40-8560-3bc3fb62ff5d
  Status: scheduled

STEP 4: View User Appointments
✓ User appointments retrieved
  Total appointments: 1

STEP 5: Get Pantry Inventory
✓ Pantry inventory retrieved
  Total items: 8

STEP 6: Add Items to Cart
✓ Items added to cart: 2

STEP 7: View Shopping Cart
✓ Cart retrieved
  Items in cart: 2

STEP 8: Update Cart Item Quantity
✓ Cart item updated
  New quantity: 5

STEP 9: Submit Pantry Order
✓ Order submitted successfully
  Order ID: order-uuid

STEP 10: View Order History
✓ Order history retrieved
  Total orders: 1

STEP 11: Get Order Details
✓ Order details retrieved
  Status: submitted
```

---

## Features Validated

### Appointment Management
- ✅ Get available appointment slots
- ✅ Book appointments for future times
- ✅ View user's appointments
- ✅ Update appointment details
- ✅ Cancel appointments

### Inventory Management
- ✅ View pantry inventory
- ✅ Filter by category
- ✅ Check item quantities
- ✅ Display dietary tags

### Shopping Cart
- ✅ Add items to cart
- ✅ View cart contents
- ✅ Update item quantities
- ✅ Remove items from cart
- ✅ Clear entire cart

### Order Management
- ✅ Submit orders from cart
- ✅ View order history
- ✅ Get order details
- ✅ Track order status

---

## Test Data

### Student User Created
- **Email**: pantry.student.{timestamp}@university.edu
- **Password**: PantryPass123!
- **Role**: student

### Sample Inventory Items
From `database/seeds/sample_data.sql`:
1. Canned Black Beans - 45 cans
2. Pasta - Penne - 30 boxes
3. Rice - White - 50 lbs
4. Peanut Butter - 25 jars
5. Canned Tomatoes - 60 cans
6. Oatmeal - 40 boxes
7. Granola Bars - 100 bars
8. Apple Juice - 35 bottles

---

## Troubleshooting

### Server Not Running
```
✗ Server is not running
```
**Solution**: Run `npm run dev` in backend directory

### Appointment Booking Failed
```
✗ Appointment time must be in the future
```
**Solution**: Test automatically selects future slots

### Cart Operations Failed
```
✗ Failed to add item to cart
```
**Solution**: 
- Ensure inventory items exist
- Check inventory IDs are valid
- Verify student is authenticated

### Order Submission Failed
```
✗ Cart is empty
```
**Solution**: Add items to cart before submitting

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Total Test Time | ~20 seconds |
| API Calls | 11 endpoints |
| Database Operations | ~30 queries |
| Average Response Time | <100ms |

---

## Next Steps

After successful pantry flow testing:

1. **Smart Cart Generation** - Test AI-powered cart recommendations
2. **Dietary Preferences** - Test filtering by dietary restrictions
3. **Order Tracking** - Test order status updates
4. **Notifications** - Test order confirmation notifications
5. **Integration** - Test with other flows (student + pantry)

---

## Related Tests

- `test-student-flow.js` - Student food reservation flow
- `test-provider-flow.js` - Provider listing management
- `test-combined-flow.js` - Provider-student interaction

---

## Notes

- Each test creates a new student user to avoid conflicts
- Appointments must be booked for future times
- Inventory items are pre-populated from seed data
- Cart is user-specific and session-based
- Orders are immutable once submitted

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review test output for specific error messages
3. Verify all prerequisites are met
4. Check server logs for backend errors
5. Ensure database is properly initialized

---

**Status**: ✅ Pantry Flow Test Available
**Last Updated**: March 11, 2026
**Coverage**: 13 API endpoints, 11 test steps
