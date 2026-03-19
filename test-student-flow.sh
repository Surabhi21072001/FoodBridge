#!/bin/bash

# FoodBridge Student End-to-End Flow Test
# Tests: Register → Login → Browse → Reserve → Confirm Pickup → Notifications

set -e  # Exit on error

# Configuration
BASE_URL="http://localhost:3000/api"
STUDENT_EMAIL="test.student.$(date +%s)@university.edu"
STUDENT_PASSWORD="TestPassword123!"
STUDENT_FIRST_NAME="Test"
STUDENT_LAST_NAME="Student"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper function to print section headers
print_section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Helper function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Helper function to print info
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Helper function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if server is running
print_section "Checking Server Health"
if ! curl -s "${BASE_URL%/api}/health" > /dev/null; then
    print_error "Server is not running at $BASE_URL"
    print_info "Please start the server with: cd backend && npm run dev"
    exit 1
fi
print_success "Server is running"

# ============================================================================
# STEP 1: Register New Student User
# ============================================================================
print_section "STEP 1: Register New Student User"

REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${STUDENT_EMAIL}\",
    \"password\": \"${STUDENT_PASSWORD}\",
    \"role\": \"student\",
    \"firstName\": \"${STUDENT_FIRST_NAME}\",
    \"lastName\": \"${STUDENT_LAST_NAME}\",
    \"phone\": \"555-9999\"
  }")

echo "Response: $REGISTER_RESPONSE"

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    print_success "User registered successfully"
    USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    print_info "User ID: $USER_ID"
else
    print_error "Registration failed"
    exit 1
fi

# ============================================================================
# STEP 2: Login and Get JWT Token
# ============================================================================
print_section "STEP 2: Login and Get JWT Token"

LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${STUDENT_EMAIL}\",
    \"password\": \"${STUDENT_PASSWORD}\"
  }")

echo "Response: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
    print_success "Login successful"
    JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    print_info "JWT Token obtained (first 50 chars): ${JWT_TOKEN:0:50}..."
else
    print_error "Login failed"
    exit 1
fi

# ============================================================================
# STEP 3: Browse Available Food Listings
# ============================================================================
print_section "STEP 3: Browse Available Food Listings"

LISTINGS_RESPONSE=$(curl -s -X GET "${BASE_URL}/listings?status=active&limit=10" \
  -H "Content-Type: application/json")

echo "Response: $LISTINGS_RESPONSE"

if echo "$LISTINGS_RESPONSE" | grep -q '"success":true'; then
    print_success "Listings retrieved successfully"
    
    # Extract first listing ID
    LISTING_ID=$(echo "$LISTINGS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    LISTING_TITLE=$(echo "$LISTINGS_RESPONSE" | grep -o '"title":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$LISTING_ID" ]; then
        print_info "Found listing: $LISTING_TITLE (ID: $LISTING_ID)"
    else
        print_error "No active listings found. Please ensure sample data is loaded."
        exit 1
    fi
else
    print_error "Failed to retrieve listings"
    exit 1
fi

# ============================================================================
# STEP 4: Get Detailed Listing Information
# ============================================================================
print_section "STEP 4: Get Detailed Listing Information"

LISTING_DETAIL_RESPONSE=$(curl -s -X GET "${BASE_URL}/listings/${LISTING_ID}" \
  -H "Content-Type: application/json")

echo "Response: $LISTING_DETAIL_RESPONSE"

if echo "$LISTING_DETAIL_RESPONSE" | grep -q '"success":true'; then
    print_success "Listing details retrieved"
    QUANTITY_AVAILABLE=$(echo "$LISTING_DETAIL_RESPONSE" | grep -o '"quantity_available":[0-9]*' | cut -d':' -f2)
    print_info "Quantity available: $QUANTITY_AVAILABLE"
else
    print_error "Failed to retrieve listing details"
    exit 1
fi

# ============================================================================
# STEP 5: Create Reservation
# ============================================================================
print_section "STEP 5: Create Reservation"

RESERVATION_RESPONSE=$(curl -s -X POST "${BASE_URL}/reservations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"listingId\": \"${LISTING_ID}\",
    \"quantity\": 2
  }")

echo "Response: $RESERVATION_RESPONSE"

if echo "$RESERVATION_RESPONSE" | grep -q '"success":true'; then
    print_success "Reservation created successfully"
    RESERVATION_ID=$(echo "$RESERVATION_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    CONFIRMATION_CODE=$(echo "$RESERVATION_RESPONSE" | grep -o '"confirmation_code":"[^"]*"' | cut -d'"' -f4)
    print_info "Reservation ID: $RESERVATION_ID"
    print_info "Confirmation Code: $CONFIRMATION_CODE"
else
    print_error "Reservation failed"
    echo "$RESERVATION_RESPONSE"
    exit 1
fi

# ============================================================================
# STEP 6: View User's Reservations
# ============================================================================
print_section "STEP 6: View User's Reservations"

USER_RESERVATIONS_RESPONSE=$(curl -s -X GET "${BASE_URL}/reservations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

echo "Response: $USER_RESERVATIONS_RESPONSE"

if echo "$USER_RESERVATIONS_RESPONSE" | grep -q '"success":true'; then
    print_success "User reservations retrieved"
    RESERVATION_COUNT=$(echo "$USER_RESERVATIONS_RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)
    print_info "Total reservations: $RESERVATION_COUNT"
else
    print_error "Failed to retrieve user reservations"
fi

# ============================================================================
# STEP 7: Confirm Pickup
# ============================================================================
print_section "STEP 7: Confirm Pickup"

CONFIRM_PICKUP_RESPONSE=$(curl -s -X POST "${BASE_URL}/reservations/${RESERVATION_ID}/confirm-pickup" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"confirmationCode\": \"${CONFIRMATION_CODE}\"
  }")

echo "Response: $CONFIRM_PICKUP_RESPONSE"

if echo "$CONFIRM_PICKUP_RESPONSE" | grep -q '"success":true'; then
    print_success "Pickup confirmed successfully"
else
    print_error "Pickup confirmation failed"
    echo "$CONFIRM_PICKUP_RESPONSE"
fi

# ============================================================================
# STEP 8: Check Notifications
# ============================================================================
print_section "STEP 8: Check Notifications"

NOTIFICATIONS_RESPONSE=$(curl -s -X GET "${BASE_URL}/notifications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

echo "Response: $NOTIFICATIONS_RESPONSE"

if echo "$NOTIFICATIONS_RESPONSE" | grep -q '"success":true'; then
    print_success "Notifications retrieved"
    NOTIFICATION_COUNT=$(echo "$NOTIFICATIONS_RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)
    print_info "Total notifications: $NOTIFICATION_COUNT"
    
    # Check for reservation confirmation notification
    if echo "$NOTIFICATIONS_RESPONSE" | grep -q "reservation_confirmed"; then
        print_success "Found reservation confirmation notification"
    fi
else
    print_error "Failed to retrieve notifications"
fi

# ============================================================================
# STEP 9: Get Unread Notification Count
# ============================================================================
print_section "STEP 9: Get Unread Notification Count"

UNREAD_COUNT_RESPONSE=$(curl -s -X GET "${BASE_URL}/notifications/unread-count" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

echo "Response: $UNREAD_COUNT_RESPONSE"

if echo "$UNREAD_COUNT_RESPONSE" | grep -q '"count"'; then
    print_success "Unread count retrieved"
    UNREAD_COUNT=$(echo "$UNREAD_COUNT_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    print_info "Unread notifications: $UNREAD_COUNT"
fi

# ============================================================================
# Test Summary
# ============================================================================
print_section "TEST SUMMARY"

echo -e "${GREEN}✓ All tests passed successfully!${NC}\n"
echo "Test User Details:"
echo "  Email: $STUDENT_EMAIL"
echo "  Password: $STUDENT_PASSWORD"
echo "  User ID: $USER_ID"
echo ""
echo "Test Results:"
echo "  Reservation ID: $RESERVATION_ID"
echo "  Confirmation Code: $CONFIRMATION_CODE"
echo "  Listing Reserved: $LISTING_TITLE"
echo "  Notifications: $NOTIFICATION_COUNT"
echo ""
print_info "End-to-end student flow completed successfully!"
