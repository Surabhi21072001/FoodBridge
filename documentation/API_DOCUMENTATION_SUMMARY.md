# API Documentation Update Summary

## Overview

The FoodBridge Backend API Reference has been comprehensively updated to document the Listings endpoints with complete schema transformation details, request/response examples, and authentication requirements.

## Files Updated/Created

### 1. **API_REFERENCE.md** (Updated)
- **Location**: `backend/documentation/API_REFERENCE.md`
- **Changes**: Added complete Listings endpoints section with 6 endpoints
- **Size**: Comprehensive documentation with examples and schema details

### 2. **LISTINGS_API_UPDATE.md** (New)
- **Location**: `backend/documentation/LISTINGS_API_UPDATE.md`
- **Purpose**: Detailed documentation of the Listings API update
- **Contents**: Schema transformation mapping, implementation details, example workflows

### 3. **LISTINGS_QUICK_REFERENCE.md** (New)
- **Location**: `backend/documentation/LISTINGS_QUICK_REFERENCE.md`
- **Purpose**: Quick reference guide for developers
- **Contents**: Endpoint summary, curl examples, common errors, dietary tags

## Listings Endpoints Documented

### 1. List All Listings
- **Endpoint**: `GET /api/listings`
- **Auth**: Not required (public)
- **Features**: Filtering, pagination, dietary tags
- **Response**: Paginated list with transformed schema

### 2. Get Listing by ID
- **Endpoint**: `GET /api/listings/:id`
- **Auth**: Not required (public)
- **Features**: Single listing retrieval
- **Response**: Complete listing details

### 3. Create Listing
- **Endpoint**: `POST /api/listings`
- **Auth**: Required (Provider role)
- **Features**: Create new food listing
- **Response**: Created listing with ID

### 4. Update Listing
- **Endpoint**: `PUT /api/listings/:id`
- **Auth**: Required (Provider role, owner only)
- **Features**: Partial updates supported
- **Response**: Updated listing

### 5. Delete Listing
- **Endpoint**: `DELETE /api/listings/:id`
- **Auth**: Required (Provider role, owner only)
- **Features**: Remove listing
- **Response**: Success confirmation

### 6. Get Provider's Listings
- **Endpoint**: `GET /api/listings/provider/my-listings`
- **Auth**: Required (Provider role)
- **Features**: Filtering by status, pagination
- **Response**: Provider's listings with pagination

## Schema Transformation Documentation

The documentation clearly explains the backend-to-frontend schema transformation:

| Backend Field | Frontend Field | Purpose |
|---|---|---|
| `id` | `listing_id` | Unique identifier |
| `title` | `food_name` | Food item name |
| `quantity_available + quantity_reserved` | `quantity` | Total quantity |
| `quantity_available` | `available_quantity` | Available for reservation |
| `pickup_location` | `location` | Pickup location |
| `available_from` | `pickup_window_start` | Pickup window start |
| `available_until` | `pickup_window_end` | Pickup window end |
| `cuisine_type` or `category` | `food_type` | Type of food |
| `dietary_tags` | `dietary_tags` | Dietary information |
| `category` | `listing_type` | Mapped: event_food→event, deal→dining_deal |
| `status` | `status` | Active/expired status |
| `created_at` | `created_at` | Creation timestamp |
| `updated_at` | `updated_at` | Last update timestamp |

## Documentation Features

### For Each Endpoint:
- ✅ HTTP method and path
- ✅ Authentication requirements
- ✅ Query/path/body parameters with types
- ✅ Complete response examples
- ✅ Status codes and meanings
- ✅ curl command examples
- ✅ Error handling information

### Additional Documentation:
- ✅ Schema transformation mapping
- ✅ Pagination details
- ✅ Filtering options
- ✅ Dietary tags reference
- ✅ Listing types reference
- ✅ Example workflows
- ✅ Common errors and solutions

## Implementation Details

### Backend Components:
- **Controller**: `ListingController` (backend/src/controllers/listingController.ts)
  - Handles all listing operations
  - Applies schema transformation
  - Manages authentication/authorization

- **Routes**: `listingRoutes` (backend/src/routes/listingRoutes.ts)
  - Defines endpoint paths
  - Applies middleware
  - Validates requests

- **Service**: `ListingService` (backend/src/services/listingService.ts)
  - Business logic implementation
  - Database operations

### Frontend Integration:
- **Service**: `listingsService` (foodbridge-frontend/src/services/listingsService.ts)
  - Consumes transformed schema
  - Provides TypeScript interfaces
  - Handles API communication

## Query Parameters

### Filtering:
- `category` - Filter by category (donation, deal, event_food)
- `status` - Filter by status (active, expired)
- `dietary_tags` - Filter by dietary tags
- `available_now` - Only available listings
- `location` - Filter by location
- `min_price` / `max_price` - Price range

### Pagination:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

## Authentication

### Public Endpoints:
- `GET /api/listings` - List all listings
- `GET /api/listings/:id` - Get single listing

### Protected Endpoints (Provider role required):
- `POST /api/listings` - Create listing
- `PUT /api/listings/:id` - Update listing (owner only)
- `DELETE /api/listings/:id` - Delete listing (owner only)
- `GET /api/listings/provider/my-listings` - Get provider's listings

## Response Format

### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "message": "optional message"
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 500 | Server Error |

## Dietary Tags Supported

- `vegetarian`
- `vegan`
- `gluten_free`
- `dairy_free`
- `nut_free`
- `halal`
- `kosher`

## Listing Types

- `donation` - Free food donation
- `event` - Food from events
- `dining_deal` - Discounted meals

## Example Workflows

### Discover Food
```bash
curl "http://localhost:3000/api/listings?dietary_tags=vegetarian&available_now=true"
```

### Create Listing (Provider)
```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "food_name": "Pizza",
    "description": "Leftover pizza",
    "quantity": 10,
    "location": "Building A",
    "pickup_window_start": "2024-03-15T12:00:00Z",
    "pickup_window_end": "2024-03-15T14:00:00Z",
    "food_type": "Italian",
    "dietary_tags": ["vegetarian"],
    "listing_type": "donation"
  }'
```

### Manage Listings (Provider)
```bash
curl "http://localhost:3000/api/listings/provider/my-listings?status=active" \
  -H "Authorization: Bearer TOKEN"
```

## Documentation Quality Checklist

- ✅ All endpoints documented
- ✅ Request/response examples provided
- ✅ Authentication requirements specified
- ✅ Query parameters documented
- ✅ Status codes explained
- ✅ Schema transformation documented
- ✅ Error handling covered
- ✅ curl examples provided
- ✅ Pagination explained
- ✅ Filtering options listed
- ✅ Quick reference guide created
- ✅ Implementation details provided

## Related Documentation

- **Main API Reference**: `backend/documentation/API_REFERENCE.md`
- **Listings Update Details**: `backend/documentation/LISTINGS_API_UPDATE.md`
- **Quick Reference**: `backend/documentation/LISTINGS_QUICK_REFERENCE.md`
- **Controller Implementation**: `backend/src/controllers/listingController.ts`
- **Routes Definition**: `backend/src/routes/listingRoutes.ts`
- **Frontend Service**: `foodbridge-frontend/src/services/listingsService.ts`

## Next Steps

1. **Review Documentation**: Verify all endpoints are correctly documented
2. **Test Endpoints**: Use curl examples to test each endpoint
3. **Frontend Integration**: Ensure frontend service matches documented schema
4. **Update Tests**: Add tests for schema transformation
5. **Monitor Usage**: Track API usage patterns

## Notes

- Schema transformation ensures consistency between frontend and backend
- All list endpoints support pagination
- Public endpoints allow discovery without authentication
- Provider endpoints require authentication and authorization
- Comprehensive error handling with meaningful messages
- Rate limiting applied to chat endpoint (20 req/min per user)

---

**Documentation Version**: 1.0.0
**Last Updated**: March 2026
**Status**: Complete and Ready for Use
