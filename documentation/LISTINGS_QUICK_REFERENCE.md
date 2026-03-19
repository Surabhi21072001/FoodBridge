# Listings API - Quick Reference

## Endpoint Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/listings` | No | List all listings with filters |
| GET | `/api/listings/:id` | No | Get single listing details |
| POST | `/api/listings` | Yes* | Create new listing |
| PUT | `/api/listings/:id` | Yes* | Update listing |
| DELETE | `/api/listings/:id` | Yes* | Delete listing |
| GET | `/api/listings/provider/my-listings` | Yes* | Get provider's listings |

*Provider role required

## Quick Examples

### List Listings
```bash
# All listings
curl http://localhost:3000/api/listings

# With filters
curl "http://localhost:3000/api/listings?category=donation&dietary_tags=vegetarian&page=1&limit=20"

# Available now
curl "http://localhost:3000/api/listings?available_now=true"
```

### Get Single Listing
```bash
curl http://localhost:3000/api/listings/listing-123
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

### Update Listing (Provider)
```bash
curl -X PUT http://localhost:3000/api/listings/listing-123 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 8,
    "status": "active"
  }'
```

### Delete Listing (Provider)
```bash
curl -X DELETE http://localhost:3000/api/listings/listing-123 \
  -H "Authorization: Bearer TOKEN"
```

### Get Provider's Listings
```bash
curl "http://localhost:3000/api/listings/provider/my-listings?status=active" \
  -H "Authorization: Bearer TOKEN"
```

## Response Schema

### Listing Object
```json
{
  "listing_id": "string",
  "provider_id": "string",
  "food_name": "string",
  "description": "string",
  "quantity": "number",
  "available_quantity": "number",
  "location": "string",
  "pickup_window_start": "ISO8601 datetime",
  "pickup_window_end": "ISO8601 datetime",
  "food_type": "string",
  "dietary_tags": ["string"],
  "listing_type": "donation|event|dining_deal",
  "status": "active|expired",
  "created_at": "ISO8601 datetime",
  "updated_at": "ISO8601 datetime"
}
```

## Query Parameters

### Filtering
- `category` - Filter by category
- `status` - Filter by status (active, expired)
- `dietary_tags` - Filter by dietary tags (comma-separated)
- `available_now` - Only available listings (true/false)
- `location` - Filter by location
- `min_price` - Minimum price
- `max_price` - Maximum price

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

## Common Errors

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```
**Solution**: Add Authorization header with valid JWT token

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied"
}
```
**Solution**: Ensure you have provider role or are listing owner

### 404 Not Found
```json
{
  "success": false,
  "message": "Listing not found"
}
```
**Solution**: Verify listing ID is correct

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid input: [field] is required"
}
```
**Solution**: Check request body and query parameters

## Listing Types

- `donation` - Free food donation
- `event` - Food from events
- `dining_deal` - Discounted meals

## Dietary Tags

- `vegetarian`
- `vegan`
- `gluten_free`
- `dairy_free`
- `nut_free`
- `halal`
- `kosher`

## Frontend Integration

The frontend service (`listingsService.ts`) provides these methods:

```typescript
// Get all listings
listingsService.getListings(filters?)

// Get single listing
listingsService.getListingById(id)

// Create listing (provider)
listingsService.createListing(data)

// Update listing (provider)
listingsService.updateListing(id, data)

// Delete listing (provider)
listingsService.deleteListing(id)

// Get provider's listings
listingsService.getProviderListings()
```

## Schema Transformation

Backend → Frontend mapping:
- `id` → `listing_id`
- `title` → `food_name`
- `quantity_available + quantity_reserved` → `quantity`
- `quantity_available` → `available_quantity`
- `pickup_location` → `location`
- `available_from` → `pickup_window_start`
- `available_until` → `pickup_window_end`
- `cuisine_type` or `category` → `food_type`
- `category` → `listing_type` (event_food→event, deal→dining_deal)

---

For detailed documentation, see `API_REFERENCE.md`
