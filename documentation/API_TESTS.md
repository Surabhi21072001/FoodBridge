# API Testing Guide

## Prerequisites
1. Start the backend server: `cd backend && npm run dev`
2. Ensure PostgreSQL is running with the database set up
3. Server should be running on `http://localhost:3000`

## Auth Endpoints

### 1. Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "phone": "+1234567890"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "SecurePass123!"
  }'
```

**Save the token from the response for authenticated requests!**

## User Endpoints

### 3. Get User Profile (Authenticated)
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 4. Update User Profile (Authenticated)
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Updated",
    "phone": "+1234567890"
  }'
```

### 5. Change Password (Authenticated)
```bash
curl -X POST http://localhost:3000/api/users/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "SecurePass123!",
    "new_password": "NewSecurePass456!"
  }'
```

### 6. List All Users (Admin Only)
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN_HERE"
```

### 7. Get User by ID (Admin Only)
```bash
curl -X GET http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN_HERE"
```

### 8. Update User by ID (Admin Only)
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "last_name": "Name",
    "is_active": true
  }'
```

### 9. Delete User by ID (Admin Only)
```bash
curl -X DELETE http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN_HERE"
```

## Postman Collection - Auth & Users

Import this JSON into Postman:

```json
{
  "info": {
    "name": "FoodBridge API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"student@example.com\",\n  \"password\": \"SecurePass123!\",\n  \"first_name\": \"John\",\n  \"last_name\": \"Doe\",\n  \"role\": \"student\",\n  \"phone\": \"+1234567890\"\n}"
            },
            "url": {"raw": "http://localhost:3000/api/auth/register"}
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"student@example.com\",\n  \"password\": \"SecurePass123!\"\n}"
            },
            "url": {"raw": "http://localhost:3000/api/auth/login"}
          }
        }
      ]
    },
    {
      "name": "Users",
      "item": [
        {
          "name": "Get Profile",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": {"raw": "http://localhost:3000/api/users/profile"}
          }
        },
        {
          "name": "Update Profile",
          "request": {
            "method": "PUT",
            "header": [
              {"key": "Authorization", "value": "Bearer {{token}}"},
              {"key": "Content-Type", "value": "application/json"}
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"first_name\": \"John\",\n  \"last_name\": \"Updated\"\n}"
            },
            "url": {"raw": "http://localhost:3000/api/users/profile"}
          }
        },
        {
          "name": "List Users (Admin)",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{admin_token}}"}],
            "url": {"raw": "http://localhost:3000/api/users?page=1&limit=10"}
          }
        },
        {
          "name": "Get User by ID (Admin)",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{admin_token}}"}],
            "url": {"raw": "http://localhost:3000/api/users/1"}
          }
        },
        {
          "name": "Update User by ID (Admin)",
          "request": {
            "method": "PUT",
            "header": [
              {"key": "Authorization", "value": "Bearer {{admin_token}}"},
              {"key": "Content-Type", "value": "application/json"}
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"first_name\": \"Updated\",\n  \"is_active\": true\n}"
            },
            "url": {"raw": "http://localhost:3000/api/users/1"}
          }
        },
        {
          "name": "Delete User by ID (Admin)",
          "request": {
            "method": "DELETE",
            "header": [{"key": "Authorization", "value": "Bearer {{admin_token}}"}],
            "url": {"raw": "http://localhost:3000/api/users/1"}
          }
        }
      ]
    }
  ]
}
```

## Thunder Client (VS Code Extension)

If using Thunder Client in VS Code:
1. Install Thunder Client extension
2. Create a new request
3. Set method and URL from examples above
4. Add headers and body as shown
5. Save token as environment variable for reuse

## Testing Flow - Auth & Users

1. Register a new user → Save the token
2. Login with that user → Verify token matches
3. Get profile → Verify user data
4. Update profile → Verify changes
5. Change password → Login again with new password
6. (Admin) List all users → Verify pagination
7. (Admin) Get user by ID → Verify specific user data
8. (Admin) Update user by ID → Verify changes
9. (Admin) Delete user by ID → Verify deletion


---

## Food Listing Endpoints

### 1. Create a Food Listing (Provider Only)
```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Authorization: Bearer YOUR_PROVIDER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Surplus Pizza from Event",
    "description": "10 large pizzas left over from campus event",
    "food_type": "prepared_meal",
    "quantity": 10,
    "unit": "pizzas",
    "pickup_location": "Student Center Room 201",
    "available_from": "2026-03-11T18:00:00Z",
    "available_until": "2026-03-11T21:00:00Z",
    "dietary_info": ["vegetarian_option"],
    "allergen_info": ["gluten", "dairy"],
    "image_url": "https://example.com/pizza.jpg"
  }'
```

### 2. Get All Listings (Public)
```bash
# Basic listing
curl -X GET http://localhost:3000/api/listings

# Filter by category
curl -X GET "http://localhost:3000/api/listings?category=meal"

# Filter by location (partial match, case-insensitive)
curl -X GET "http://localhost:3000/api/listings?location=campus"
curl -X GET "http://localhost:3000/api/listings?location=student"

# Filter by status
curl -X GET "http://localhost:3000/api/listings?status=active"

# Pagination
curl -X GET "http://localhost:3000/api/listings?page=1&limit=10"
curl -X GET "http://localhost:3000/api/listings?page=2&limit=5"

# Combined filters
curl -X GET "http://localhost:3000/api/listings?category=meal&location=campus&page=1&limit=5"
curl -X GET "http://localhost:3000/api/listings?category=meal&status=active&location=student"
```

### 3. Get Single Listing by ID (Public)
```bash
curl -X GET http://localhost:3000/api/listings/1
```

### 4. Update a Listing (Provider Only - Own Listings)
```bash
curl -X PUT http://localhost:3000/api/listings/1 \
  -H "Authorization: Bearer YOUR_PROVIDER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated: Surplus Pizza from Event",
    "quantity": 8,
    "description": "8 large pizzas remaining"
  }'
```

### 5. Delete a Listing (Provider Only - Own Listings)
```bash
curl -X DELETE http://localhost:3000/api/listings/1 \
  -H "Authorization: Bearer YOUR_PROVIDER_JWT_TOKEN"
```

### 6. Get Provider's Own Listings (Provider Only)
```bash
curl -X GET http://localhost:3000/api/listings/provider/my-listings \
  -H "Authorization: Bearer YOUR_PROVIDER_JWT_TOKEN"
```

### ❌ Missing Endpoint
- `GET /api/listings/provider/:providerId` - Get listings by specific provider ID

The current implementation has `/api/listings/provider/my-listings` which returns the authenticated provider's own listings, but there's no endpoint to get listings by a specific provider ID.

## Postman Collection - Listings

Add this to your Postman collection:

```json
{
  "name": "Listings",
  "item": [
    {
      "name": "Create Listing",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Authorization", "value": "Bearer {{provider_token}}"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"title\": \"Surplus Pizza from Event\",\n  \"description\": \"10 large pizzas left over from campus event\",\n  \"food_type\": \"prepared_meal\",\n  \"quantity\": 10,\n  \"unit\": \"pizzas\",\n  \"pickup_location\": \"Student Center Room 201\",\n  \"available_from\": \"2026-03-11T18:00:00Z\",\n  \"available_until\": \"2026-03-11T21:00:00Z\",\n  \"dietary_info\": [\"vegetarian_option\"],\n  \"allergen_info\": [\"gluten\", \"dairy\"]\n}"
        },
        "url": {"raw": "http://localhost:3000/api/listings"}
      }
    },
    {
      "name": "Get All Listings",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:3000/api/listings?page=1&limit=10",
          "query": [
            {"key": "page", "value": "1"},
            {"key": "limit", "value": "10"},
            {"key": "food_type", "value": "prepared_meal", "disabled": true},
            {"key": "dietary_info", "value": "vegetarian", "disabled": true},
            {"key": "search", "value": "pizza", "disabled": true}
          ]
        }
      }
    },
    {
      "name": "Get Listing by ID",
      "request": {
        "method": "GET",
        "url": {"raw": "http://localhost:3000/api/listings/1"}
      }
    },
    {
      "name": "Update Listing",
      "request": {
        "method": "PUT",
        "header": [
          {"key": "Authorization", "value": "Bearer {{provider_token}}"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"title\": \"Updated: Surplus Pizza\",\n  \"quantity\": 8\n}"
        },
        "url": {"raw": "http://localhost:3000/api/listings/1"}
      }
    },
    {
      "name": "Delete Listing",
      "request": {
        "method": "DELETE",
        "header": [{"key": "Authorization", "value": "Bearer {{provider_token}}"}],
        "url": {"raw": "http://localhost:3000/api/listings/1"}
      }
    },
    {
      "name": "Get My Listings (Provider)",
      "request": {
        "method": "GET",
        "header": [{"key": "Authorization", "value": "Bearer {{provider_token}}"}],
        "url": {"raw": "http://localhost:3000/api/listings/provider/my-listings"}
      }
    }
  ]
}
```

## Testing Flow - Listings

1. Register a provider account (role: "provider")
2. Login as provider → Save token as `provider_token`
3. Create a listing → Save the listing ID
4. Get all listings → Verify your listing appears
5. Get single listing by ID → Verify details
6. Update the listing → Verify changes
7. Get my listings → Verify it shows your listings
8. Delete the listing → Verify it's removed

## Query Parameters for GET /api/listings

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### Filters
- `category` - Filter by category (exact match)
  - Values: `meal`, `snack`, `beverage`, `pantry_item`, `deal`, `event_food`
- `location` - Filter by pickup location (partial match, case-insensitive)
  - Example: `location=campus` matches "Campus Dining Hall"
- `status` - Filter by status (exact match)
  - Values: `active`, `reserved`, `completed`, `cancelled`, `expired`
- `dietary_tags` - Filter by dietary tags (comma-separated)
  - Example: `dietary_tags=vegetarian,vegan`
- `available_now` - Filter by current availability (boolean)
  - Values: `true`, `false`
- `provider_id` - Filter by provider UUID

### Examples
```bash
# Category filter
GET /api/listings?category=meal

# Location filter (partial match)
GET /api/listings?location=campus
GET /api/listings?location=student

# Combined filters
GET /api/listings?category=meal&location=campus&page=1&limit=10
```
