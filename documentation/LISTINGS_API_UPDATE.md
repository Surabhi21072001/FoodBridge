# Listings API Documentation Update

## Summary

The API Reference documentation has been updated to include comprehensive documentation for the Listings endpoints with schema transformation details.

## Changes Made

### Added Listings Endpoints Section

The following endpoints have been documented in `backend/documentation/API_REFERENCE.md`:

#### 1. **List All Listings** - `GET /api/listings`
- Public endpoint (no authentication required)
- Supports filtering by category, status, dietary tags, location, price range
- Pagination support (page, limit)
- Returns transformed frontend schema

#### 2. **Get Listing by ID** - `GET /api/listings/:id`
- Public endpoint
- Returns single listing with transformed schema
- Includes all listing details

#### 3. **Create Listing** - `POST /api/listings`
- Provider-only endpoint (requires authentication)
- Creates new food listing
- Returns created listing with ID

#### 4. **Update Listing** - `PUT /api/listings/:id`
- Provider-only endpoint (must be listing owner)
- Supports partial updates
- Returns updated listing

#### 5. **Delete Listing** - `DELETE /api/listings/:id`
- Provider-only endpoint (must be listing owner)
- Removes listing from system

#### 6. **Get Provider's Listings** - `GET /api/listings/provider/my-listings`
- Provider-only endpoint
- Returns all listings created by authenticated provider
- Supports filtering by status and pagination

## Schema Transformation Details

The backend transforms internal database schema to frontend schema for consistency:

| Backend Field | Frontend Field | Notes |
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
| `category` | `listing_type` | Mapped: event_food→event, deal→dining_deal, others→donation |
| `status` | `status` | Active/expired status |
| `created_at` | `created_at` | Creation timestamp |
| `updated_at` | `updated_at` | Last update timestamp |

## Response Format

All endpoints follow the standard response format:

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "optional message"
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Authentication

- **Public endpoints**: `GET /api/listings`, `GET /api/listings/:id`
- **Provider endpoints**: All other listing endpoints require JWT token in Authorization header
- **Authorization**: Provider role required for create/update/delete operations

## Pagination

List endpoints support pagination:
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page

Response includes pagination metadata:
```json
{
  "pagination": {
    "total_count": 45,
    "page": 1,
    "limit": 20,
    "total_pages": 3
  }
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied (not listing owner) |
| 404 | Not Found - Listing not found |
| 500 | Internal Server Error |

## Implementation Details

### Controller: `ListingController`
- Location: `backend/src/controllers/listingController.ts`
- Handles all listing operations
- Applies schema transformation for all responses

### Routes: `listingRoutes`
- Location: `backend/src/routes/listingRoutes.ts`
- Defines endpoint paths and HTTP methods
- Applies authentication and authorization middleware
- Validates request data

### Service: `ListingService`
- Location: `backend/src/services/listingService.ts`
- Implements business logic
- Handles database operations

## Frontend Integration

The frontend services (`foodbridge-frontend/src/services/listingsService.ts`) consume these endpoints and expect the transformed schema. The schema transformation ensures consistency between frontend and backend data models.

## Example Workflows

### Discover Food Listings
```bash
# Get all available vegetarian listings
curl -X GET "http://localhost:3000/api/listings?dietary_tags=vegetarian&available_now=true"
```

### Create a Food Listing (Provider)
```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "food_name": "Pizza Slices",
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

### Manage Provider Listings
```bash
# Get all active listings for current provider
curl -X GET "http://localhost:3000/api/listings/provider/my-listings?status=active" \
  -H "Authorization: Bearer <token>"
```

## Documentation Location

- **Main API Reference**: `backend/documentation/API_REFERENCE.md`
- **This Update**: `backend/documentation/LISTINGS_API_UPDATE.md`

---

**Last Updated**: March 2026
**API Version**: 1.0.0
