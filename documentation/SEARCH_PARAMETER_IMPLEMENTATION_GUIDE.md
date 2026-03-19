# Search Parameter Implementation Guide

## Overview

The `search` parameter has been added to the GET `/listings` endpoint to enable text-based filtering of food listings by name and description.

## Backend Implementation

### Controller Layer
**File**: `backend/src/controllers/listingController.ts`

```typescript
listListings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      category, 
      status, 
      dietary_tags, 
      available_now, 
      location, 
      search,  // NEW PARAMETER
      max_price, 
      min_price, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    // ... parameter parsing ...
    
    const result = await this.listingService.listListings({
      // ... other parameters ...
      search: search as string,  // Pass to service
      // ... other parameters ...
    });
    
    // ... response handling ...
  } catch (error) {
    next(error);
  }
};
```

### Service Layer
**File**: `backend/src/services/listingService.ts`

The service layer handles the search logic:
- Searches across `title` (food_name) and `description` fields
- Case-insensitive matching
- Partial matches supported
- Combinable with other filters

## API Endpoint

### GET /listings

**New Query Parameter:**
```
search (string, optional)
```

**Examples:**

1. **Simple search:**
   ```
   GET /api/listings?search=pizza
   ```
   Returns all listings with "pizza" in name or description

2. **Search with filters:**
   ```
   GET /api/listings?search=pasta&dietary_tags=vegan&location=Building%20A
   ```
   Returns vegan pasta listings in Building A

3. **Search with pagination:**
   ```
   GET /api/listings?search=salad&page=2&limit=10
   ```
   Returns page 2 of salad listings (10 per page)

4. **Search with availability:**
   ```
   GET /api/listings?search=sandwich&available_now=true
   ```
   Returns currently available sandwich listings

## Frontend Integration

### Update ListingsService

**File**: `foodbridge-frontend/src/services/listingsService.ts`

```typescript
interface ListingsFilter {
  page?: number;
  limit?: number;
  search?: string;  // NEW
  dietary?: string[];
  location?: string;
  food_type?: string;
  listing_type?: string;
}

async getListings(filters?: ListingsFilter): Promise<PaginatedResponse<Listing>> {
  const params = new URLSearchParams();
  
  if (filters?.search) {
    params.append('search', filters.search);
  }
  
  // ... other parameters ...
  
  return api.get('/listings', { params });
}
```

### Update ListingFilters Component

**File**: `foodbridge-frontend/src/components/listings/ListingFilters.tsx`

Add a search input field:

```typescript
const [searchQuery, setSearchQuery] = useState('');

const handleSearch = (query: string) => {
  setSearchQuery(query);
  onFiltersChange({
    ...filters,
    search: query,
  });
};

return (
  <div className="space-y-4">
    {/* Search Input */}
    <Input
      label="Search"
      placeholder="Search by food name or description..."
      value={searchQuery}
      onChange={(e) => handleSearch(e.target.value)}
      type="text"
    />
    
    {/* Other filters... */}
  </div>
);
```

## AI Agent Integration

### Update searchFood Tool

**File**: `backend/src/agent/tools/searchFood.ts`

The tool should leverage the search parameter for natural language queries:

```typescript
async execute(params: SearchFoodParams): Promise<SearchResult> {
  // Extract search terms from user intent
  const searchQuery = params.query || params.dietary_tags?.[0];
  
  const response = await api.get('/listings', {
    search: searchQuery,
    dietary_tags: params.dietary_tags,
    location: params.location,
    available_now: params.available_now,
    page: params.page,
    limit: params.limit,
  });
  
  return response.data;
}
```

## Search Behavior

### Matching Rules
- **Case-insensitive**: "Pizza" matches "pizza", "PIZZA", "PiZzA"
- **Partial matches**: "piz" matches "pizza"
- **Word boundaries**: Searches across entire text
- **Special characters**: Handled by database query engine

### Examples

| Search Query | Matches |
|---|---|
| `pizza` | "Pizza", "PIZZA", "Pepperoni Pizza", "Pizza Slices" |
| `veg` | "Vegetarian", "Veggie", "Vegetables" |
| `salad` | "Caesar Salad", "Green Salad", "Salad Bar" |
| `pasta` | "Pasta", "Spaghetti Pasta", "Pasta Primavera" |

### Combination with Other Filters

The search parameter works seamlessly with other filters:

```
GET /api/listings?search=pasta&dietary_tags=vegan&location=Building%20A&available_now=true
```

This query returns:
- Listings with "pasta" in name/description
- AND tagged as vegan
- AND located in Building A
- AND currently available

## Testing

### Unit Tests

Test the search functionality:

```typescript
describe('Search Parameter', () => {
  it('should filter listings by search query', async () => {
    const result = await listingsService.getListings({
      search: 'pizza',
    });
    
    expect(result.listings).toContainEqual(
      expect.objectContaining({
        food_name: expect.stringMatching(/pizza/i),
      })
    );
  });

  it('should support partial matches', async () => {
    const result = await listingsService.getListings({
      search: 'piz',
    });
    
    expect(result.listings.length).toBeGreaterThan(0);
  });

  it('should combine search with other filters', async () => {
    const result = await listingsService.getListings({
      search: 'pasta',
      dietary_tags: ['vegan'],
    });
    
    expect(result.listings).toContainEqual(
      expect.objectContaining({
        dietary_tags: expect.arrayContaining(['vegan']),
      })
    );
  });
});
```

### Integration Tests

Test the API endpoint:

```bash
# Simple search
curl "http://localhost:3000/api/listings?search=pizza"

# Search with filters
curl "http://localhost:3000/api/listings?search=pasta&dietary_tags=vegan"

# Search with pagination
curl "http://localhost:3000/api/listings?search=salad&page=2&limit=10"
```

## Performance Considerations

1. **Database Indexing**: Ensure `title` and `description` fields are indexed for optimal search performance
2. **Query Optimization**: Consider full-text search indexes for large datasets
3. **Pagination**: Always use pagination with search to limit result sets
4. **Caching**: Consider caching popular search queries

## Future Enhancements

1. **Search Result Ranking**: Implement relevance scoring
2. **Autocomplete**: Add search suggestions based on popular queries
3. **Advanced Search**: Support boolean operators (AND, OR, NOT)
4. **Search Analytics**: Track popular search terms
5. **Typo Tolerance**: Implement fuzzy matching for misspellings

## Documentation

- **API Reference**: `docs/api_reference.md` - GET /listings endpoint
- **Update Summary**: `backend/documentation/API_REFERENCE_UPDATE_MARCH_2026.md`
- **Verification**: `backend/documentation/API_REFERENCE_VERIFICATION_MARCH_2026.md`

## Related Files

- Backend Controller: `backend/src/controllers/listingController.ts`
- Backend Service: `backend/src/services/listingService.ts`
- Frontend Service: `foodbridge-frontend/src/services/listingsService.ts`
- Frontend Component: `foodbridge-frontend/src/components/listings/ListingFilters.tsx`
- AI Agent Tool: `backend/src/agent/tools/searchFood.ts`
