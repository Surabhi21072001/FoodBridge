# API Reference Update - March 2026

## Summary of Changes

Updated `docs/api_reference.md` to reflect the current backend implementation with the addition of the `search` parameter to the listings endpoint.

## Changes Made

### GET /listings Endpoint

**New Query Parameter Added:**
- `search` (string): Search query to filter listings by food name or description

**Updated Query Parameters Section:**
- Added `search` parameter documentation
- Clarified that authentication is optional
- Added example queries demonstrating search usage

**Search Parameter Behavior:**
- Searches across food name and description fields
- Case-insensitive matching
- Partial matches are supported (e.g., "piz" matches "pizza")
- Can be combined with other filters for refined results
- Example: `search=vegetarian%20pasta` finds listings with "vegetarian pasta" in name or description

## Query Examples

The following examples now demonstrate the search parameter:

```
GET /api/listings?search=pizza&dietary_tags=vegetarian,vegan&location=Building%20A
GET /api/listings?search=salad&dietary_tags=gluten-free&available_now=true
GET /api/listings?search=pasta&page=2&limit=10
```

## Backend Implementation Details

### ListingController.listListings()

The endpoint now accepts the `search` parameter and passes it to the listing service:

```typescript
const { category, status, dietary_tags, available_now, location, search, max_price, min_price, page = 1, limit = 20 } = req.query;

const result = await this.listingService.listListings({
  category: category as string,
  status: status as string,
  dietary_tags: parsedDietaryTags,
  available_now: available_now === 'true',
  location: location as string,
  search: search as string,  // NEW
  max_price: max_price ? Number(max_price) : undefined,
  min_price: min_price ? Number(min_price) : undefined,
  page: Number(page),
  limit: Number(limit),
});
```

## Compatibility

- **Backward Compatible**: The `search` parameter is optional and does not affect existing queries
- **Frontend Integration**: Frontend services can now use the search parameter for text-based filtering
- **AI Agent Tools**: The agent's searchFood tool can leverage this parameter for natural language queries

## Documentation Files Updated

- `docs/api_reference.md` - Main API reference documentation

## Related Files

- `backend/src/controllers/listingController.ts` - Controller implementation
- `backend/src/services/listingService.ts` - Service layer (search logic)
- `foodbridge-frontend/src/services/listingsService.ts` - Frontend service

## Testing Recommendations

1. Test search with various query strings
2. Test search combined with other filters (dietary_tags, location, etc.)
3. Test case-insensitive matching
4. Test partial matches
5. Test URL encoding of search terms with spaces

## Next Steps

- Update frontend listing service to support search parameter
- Update AI agent tools to utilize search functionality
- Add integration tests for search functionality
- Consider adding search result ranking/relevance scoring
