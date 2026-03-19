# API Reference Update - Dietary Tags Parsing

## Summary

Updated the API reference documentation to reflect the dietary tags parsing implementation in the `GET /listings` endpoint.

## Changes Made

### GET /listings Endpoint

**File Updated:** `docs/api_reference.md`

#### Query Parameters Enhancement

Added comprehensive documentation for the `dietary_tags` parameter:

```
- `dietary_tags` (string): Comma-separated dietary filters (e.g., "vegetarian,vegan,gluten-free"). Can also be passed as array.
```

#### Dietary Tags Parsing Rules

Documented the parsing behavior implemented in `backend/src/controllers/listingController.ts`:

1. **Comma-separated string**: `"vegetarian,vegan"` → parsed to `["vegetarian", "vegan"]`
2. **Array format**: `["vegetarian", "vegan"]` → passed as-is
3. **Whitespace trimming**: `"vegetarian , vegan"` → `["vegetarian", "vegan"]`
4. **Empty tag filtering**: `"vegetarian,,vegan"` → `["vegetarian", "vegan"]`

#### Query Examples

Added practical examples showing different ways to use the dietary_tags parameter:

```
GET /api/listings?page=1&limit=20
GET /api/listings?dietary_tags=vegetarian,vegan&location=Building%20A
GET /api/listings?dietary_tags=gluten-free&available_now=true
```

#### Additional Query Parameters

Documented all available query parameters for the listings endpoint:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `dietary_tags` (string): Comma-separated dietary filters
- `category` (string): Category filter (donation, event_food, deal)
- `status` (string): Status filter (active, inactive, expired)
- `location` (string): Location filter
- `available_now` (boolean): Only currently available listings
- `min_price` (number): Minimum price filter
- `max_price` (number): Maximum price filter

## Implementation Details

### Backend Implementation

**File:** `backend/src/controllers/listingController.ts` (Lines 76-85)

```typescript
// Parse dietary_tags from comma-separated string to array
let parsedDietaryTags: string[] | undefined;
if (dietary_tags) {
  parsedDietaryTags = typeof dietary_tags === 'string' 
    ? dietary_tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    : Array.isArray(dietary_tags) ? dietary_tags : [];
}
```

### Parsing Logic

1. **Type Check**: Determines if `dietary_tags` is a string or array
2. **String Parsing**: Splits by comma, trims whitespace, filters empty strings
3. **Array Handling**: Passes arrays directly without modification
4. **Fallback**: Returns empty array for invalid types

## Frontend Usage

### Example API Calls

**Using comma-separated string:**
```javascript
const response = await api.get('/listings', {
  dietary_tags: 'vegetarian,vegan'
});
```

**Using array:**
```javascript
const response = await api.get('/listings', {
  dietary_tags: ['vegetarian', 'vegan']
});
```

**Combined with other filters:**
```javascript
const response = await api.get('/listings', {
  dietary_tags: 'vegetarian,gluten-free',
  location: 'Building A',
  available_now: true,
  page: 1,
  limit: 20
});
```

## Response Format

The endpoint returns paginated results with the following structure:

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "listing_id": "uuid",
        "provider_id": "uuid",
        "food_name": "Pizza",
        "description": "Leftover pizza",
        "quantity": 5,
        "available_quantity": 5,
        "location": "Building A",
        "pickup_window_start": "2024-01-15T12:00:00Z",
        "pickup_window_end": "2024-01-15T14:00:00Z",
        "food_type": "Italian",
        "dietary_tags": ["vegetarian"],
        "listing_type": "donation",
        "status": "active",
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "total_count": 42,
      "page": 1,
      "limit": 20,
      "total_pages": 3
    }
  }
}
```

## Error Handling

Invalid parameters return a 400 error:

```json
{
  "success": false,
  "message": "Invalid query parameters"
}
```

## Testing

The dietary tags parsing can be tested with:

1. **Comma-separated values**: `dietary_tags=vegetarian,vegan`
2. **With spaces**: `dietary_tags=vegetarian%20,%20vegan`
3. **Array format**: `dietary_tags[]=vegetarian&dietary_tags[]=vegan`
4. **Empty values**: `dietary_tags=vegetarian,,vegan` (empty values filtered)
5. **Single value**: `dietary_tags=vegetarian`

## Related Files

- **API Reference**: `docs/api_reference.md`
- **Controller**: `backend/src/controllers/listingController.ts`
- **Service**: `backend/src/services/listingService.ts`
- **Frontend Service**: `foodbridge-frontend/src/services/listingsService.ts`

## Notes

- The dietary_tags parameter is optional
- Multiple dietary tags can be combined with commas
- Whitespace around tags is automatically trimmed
- Empty tags are automatically filtered out
- The parameter is case-sensitive
- All valid dietary tags should be pre-defined in the system
