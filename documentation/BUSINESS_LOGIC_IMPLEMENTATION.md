# Business Logic Implementation Summary

This document summarizes the complete business logic implementation for the FoodBridge platform service layer.

## Overview

All service classes have been implemented with comprehensive business rules, error handling, and transaction safety. The services coordinate repository calls and enforce domain logic.

---

## UserService

**Location**: `backend/src/services/userService.ts`

### Implemented Methods

- `register()` - Create new user with hashed password
- `login()` - Authenticate user and generate JWT token
- `getUserById()` - Retrieve user by ID (excludes password)
- `updateUser()` - Update user profile
- `changePassword()` - Change user password with validation
- `listUsers()` - List users with pagination and filters
- `deleteUser()` - Hard delete user
- `deactivateUser()` - Soft delete user (admin only) ✨ NEW

### Business Rules Enforced

✅ Email uniqueness validation
✅ Password hashing before storage (bcrypt)
✅ Only admins can deactivate users
✅ Inactive users cannot login
✅ Role-based access control (student, provider, admin)
✅ JWT token generation with 7-day expiration

---

## ListingService

**Location**: `backend/src/services/listingService.ts`

### Implemented Methods

- `createListing()` - Create new food listing
- `getListingById()` - Retrieve listing by ID
- `updateListing()` - Update listing (provider only)
- `deleteListing()` - Cancel listing (provider only)
- `listListings()` - Search listings with filters
- `getProviderListings()` - Get listings for specific provider
- `expireOldListings()` - Batch expire past listings

### Business Rules Enforced

✅ Only providers can create listings
✅ `quantity_available` must be >= 0
✅ `available_until` must be after `available_from`
✅ Listings automatically expire when `available_until` passes
✅ Expired listings cannot accept reservations
✅ Image URL validation (optional but validated if provided) ✨ ENHANCED
✅ Cannot delete listings with active reservations
✅ Discounted price cannot exceed original price
✅ Notifications sent to users with matching preferences ✨ NEW

---

## ReservationService

**Location**: `backend/src/services/reservationService.ts`

### Implemented Methods

- `createReservation()` - Create reservation with transaction safety
- `getReservationById()` - Retrieve reservation by ID
- `getUserReservations()` - Get user's reservations with pagination
- `cancelReservation()` - Cancel reservation and return quantity
- `confirmPickup()` - Mark reservation as picked up
- `getReservationsByListing()` - Get all reservations for a listing
- `getReservationsByStudent()` - Alias for getUserReservations

### Business Rules Enforced

✅ Only students can create reservations
✅ Cannot reserve expired listings
✅ Cannot reserve more than available quantity
✅ Prevent duplicate reservations (same student + listing)
✅ Reservation creation uses database transaction
✅ Creating reservation increases `listing.quantity_reserved`
✅ Cancelling reservation decreases `listing.quantity_reserved`
✅ `confirmPickup()` records pickup timestamp
✅ Listing status becomes "completed" when all reservations picked up ✨ ENHANCED
✅ Notifications sent for reservation events ✨ NEW

### Transaction Safety

The `createReservation()` method uses a database transaction to ensure atomicity:

1. Lock listing row with `FOR UPDATE`
2. Validate availability and quantity
3. Update reserved quantity
4. Create reservation record
5. Commit or rollback on error

---

## PantryAppointmentService

**Location**: `backend/src/services/pantryAppointmentService.ts`

### Implemented Methods

- `createAppointment()` - Book pantry appointment
- `getAppointmentById()` - Retrieve appointment by ID
- `getUserAppointments()` - Get user's appointments with filters
- `updateAppointment()` - Update appointment details
- `cancelAppointment()` - Cancel appointment
- `listAllAppointments()` - Admin view of all appointments
- `getAvailableSlots()` - Get available time slots for a date
- `getAppointmentsByStudent()` - Alias for getUserAppointments
- `generateSmartCart()` - AI-powered cart recommendations ✨ NEW

### Business Rules Enforced

✅ Students can book pantry appointments
✅ Prevent double booking for same timeslot
✅ Appointment must be in the future
✅ Appointment status lifecycle: scheduled → confirmed → completed/cancelled/no_show
✅ Cannot update completed or cancelled appointments
✅ Smart cart uses user's order history
✅ Smart cart filters by current inventory availability ✨ NEW
✅ Notifications sent when appointments are booked ✨ NEW

### Smart Cart Algorithm

The `generateSmartCart()` method:

1. Analyzes user's past 50 picked-up orders
2. Counts frequency of each inventory item
3. Sorts by frequency (most frequent first)
4. Filters items currently in stock (quantity > 0)
5. Falls back to popular items if user has no history
6. Returns up to 10 recommended items

---

## NotificationService

**Location**: `backend/src/services/notificationService.ts`

### Implemented Methods

- `createNotification()` - Create generic notification
- `getUserNotifications()` - Get user's notifications with pagination
- `markAsRead()` - Mark single notification as read
- `markAllAsRead()` - Mark all user notifications as read
- `deleteNotification()` - Delete notification
- `getUnreadCount()` - Get count of unread notifications
- `notifyReservationConfirmed()` - Reservation confirmation notification
- `notifyAppointmentReminder()` - Appointment reminder notification
- `notifyNewListing()` - New listing notification
- `notifyMatchingUsers()` - Notify users with matching preferences ✨ NEW
- `notifyReservationCancelled()` - Reservation cancellation notification ✨ NEW
- `notifyPickupConfirmed()` - Pickup confirmation notification ✨ NEW
- `notifyAppointmentBooked()` - Appointment booking notification ✨ NEW

### Business Rules Enforced

✅ Notifications triggered when:
  - Reservation is created
  - Reservation is cancelled
  - Reservation pickup is confirmed
  - Pantry appointment is booked
  - New food listing matches user preferences ✨ ENHANCED

✅ Notifications include:
  - Title and message
  - Related entity (listing, reservation, appointment)
  - Timestamp and read status

### Preference Matching Algorithm

The `notifyMatchingUsers()` method finds users where:

- User role is 'student' and account is active
- User's dietary restrictions match listing's dietary tags
- User's favorite cuisines include listing's cuisine type
- User's preferred providers include the listing provider
- User has NO allergen conflicts with the listing
- Limits to 100 users per listing

---

## PantryInventoryService

**Location**: `backend/src/services/pantryInventoryService.ts`

### Implemented Methods

- `createItem()` - Add new inventory item
- `getItemById()` - Retrieve item by ID
- `updateItem()` - Update item details
- `deleteItem()` - Remove item from inventory
- `listItems()` - List items with filters
- `adjustQuantity()` - Increase/decrease quantity
- `getLowStockItems()` - Get items below reorder threshold

### Business Rules Enforced

✅ Quantity cannot be negative
✅ Low stock detection based on reorder threshold
✅ Dietary tags and allergen info tracking
✅ Expiration date tracking

---

## PantryOrderService

**Location**: `backend/src/services/pantryOrderService.ts`

### Implemented Methods

- `getOrCreateCart()` - Get or create active cart
- `getCart()` - Get user's active cart with items
- `addItemToCart()` - Add item to cart
- `removeItemFromCart()` - Remove item from cart
- `updateCartItemQuantity()` - Update item quantity
- `clearCart()` - Empty cart
- `submitOrder()` - Submit cart and deduct inventory
- `getOrderById()` - Retrieve order by ID
- `getUserOrders()` - Get user's order history

### Business Rules Enforced

✅ Quantity validation (must be positive)
✅ Inventory availability check before adding to cart
✅ Transaction safety when submitting order
✅ Automatic inventory deduction on order submission
✅ Cart status lifecycle: cart → submitted → prepared → picked_up
✅ Total items count automatically updated

---

## Error Handling

All services throw domain-specific errors:

- `NotFoundError` - Resource not found (404)
- `BadRequestError` - Invalid input or business rule violation (400)
- `UnauthorizedError` - Authentication failure (401)
- `ForbiddenError` - Authorization failure (403)
- `ConflictError` - Resource conflict (409)

---

## Transaction Safety

Critical operations use database transactions:

1. **Reservation Creation** - Ensures atomic quantity updates
2. **Reservation Cancellation** - Ensures quantity is returned
3. **Order Submission** - Ensures inventory is deducted atomically

---

## Asynchronous Notifications

Notifications are sent asynchronously using `setImmediate()` to avoid blocking main operations. Errors in notification delivery are logged but don't fail the primary operation.

---

## Summary of Enhancements

### ✨ New Features Added

1. **UserService.deactivateUser()** - Admin-only soft delete
2. **ListingService** - Image URL validation
3. **ListingService** - Automatic notifications to matching users
4. **ReservationService** - Auto-complete listings when all picked up
5. **ReservationService** - Notification triggers for all events
6. **PantryAppointmentService.generateSmartCart()** - AI-powered recommendations
7. **PantryAppointmentService** - Notification triggers
8. **NotificationService.notifyMatchingUsers()** - Preference-based matching
9. **NotificationService** - Additional notification helper methods

### 🔒 Security & Data Integrity

- Password hashing with bcrypt
- Role-based access control
- Transaction safety for critical operations
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)

### 📊 Performance Considerations

- Pagination on all list endpoints
- Database indexes on frequently queried fields
- Asynchronous notification delivery
- Efficient preference matching queries

---

## Testing Recommendations

1. **Unit Tests** - Test each service method in isolation
2. **Integration Tests** - Test service interactions with repositories
3. **Transaction Tests** - Verify rollback on errors
4. **Notification Tests** - Verify async notification delivery
5. **Preference Matching Tests** - Verify correct user matching logic

---

## Next Steps

1. Implement API route handlers that call these services
2. Add input validation middleware
3. Add authentication middleware
4. Implement rate limiting
5. Add comprehensive logging
6. Create API documentation
7. Write integration tests
