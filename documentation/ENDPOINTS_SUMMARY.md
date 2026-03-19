# API Endpoints Summary

## ✅ Implemented Endpoints

### Auth Endpoints (`/api/auth`)
- ✅ `POST /api/auth/register` - Register a new user
- ✅ `POST /api/auth/login` - Login and get JWT token

### User Endpoints (`/api/users`)
- ✅ `GET /api/users/profile` - Get authenticated user's profile
- ✅ `PUT /api/users/profile` - Update authenticated user's profile
- ✅ `POST /api/users/change-password` - Change authenticated user's password
- ✅ `GET /api/users` - List all users (Admin only)
- ✅ `GET /api/users/:id` - Get user by ID (Admin only)
- ✅ `PUT /api/users/:id` - Update user by ID (Admin only)
- ✅ `DELETE /api/users/:id` - Delete user by ID (Admin only)

### Listing Endpoints (`/api/listings`)
- ✅ `POST /api/listings` - Create a food listing (Provider only)
- ✅ `GET /api/listings` - Get all listings with filters (Public)
- ✅ `GET /api/listings/:id` - Get single listing by ID (Public)
- ✅ `PUT /api/listings/:id` - Update listing (Provider only - own listings)
- ✅ `DELETE /api/listings/:id` - Delete listing (Provider only - own listings)
- ✅ `GET /api/listings/provider/my-listings` - Get provider's own listings (Provider only)

### Other Endpoints
- ✅ `GET /health` - Health check endpoint

## 📝 Testing

All endpoints can be tested using:
- **curl** - See `backend/API_TESTS.md` for curl commands
- **Postman** - Import the collection from `backend/API_TESTS.md`
- **Thunder Client** - VS Code extension with manual setup

## 🔐 Authentication

Most endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

Get a token by:
1. Registering: `POST /api/auth/register`
2. Logging in: `POST /api/auth/login`

## 👥 User Roles

- **student** - Can view listings, make reservations, book pantry appointments
- **provider** - Can create and manage food listings
- **admin** - Full access to manage users and system

## 🚀 Quick Start

1. Start the server:
   ```bash
   cd backend && npm run dev
   ```

2. Register a user:
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Pass123!","first_name":"Test","last_name":"User","role":"student"}'
   ```

3. Login and save the token:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Pass123!"}'
   ```

4. Use the token for authenticated requests:
   ```bash
   curl -X GET http://localhost:3000/api/users/profile \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

## 📚 Documentation

- Full API testing guide: `backend/API_TESTS.md`
- API documentation: `backend/API_DOCUMENTATION.md`
- Quick start guide: `backend/QUICK_START.md`
