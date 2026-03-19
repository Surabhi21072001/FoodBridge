# API Documentation Index

## Quick Links

### Main Documentation
- **[API Reference](../../docs/api_reference.md)** - Complete API endpoint documentation
- **[Product Overview](../../docs/product_prd.md)** - Product requirements and features
- **[Agent Specification](../../docs/agent_prd.md)** - AI agent technical specification

### Recent Updates (March 2026)
- **[Documentation Update Summary](./DOCUMENTATION_UPDATE_SUMMARY_MARCH_2026.md)** - Overview of all documentation changes
- **[API Reference Update](./API_REFERENCE_UPDATE_MARCH_2026.md)** - Details on search parameter addition
- **[API Reference Verification](./API_REFERENCE_VERIFICATION_MARCH_2026.md)** - Verification checklist for all endpoints
- **[Search Parameter Implementation Guide](./SEARCH_PARAMETER_IMPLEMENTATION_GUIDE.md)** - Detailed implementation guide

## API Endpoints by Category

### Authentication (2 endpoints)
- POST /auth/login
- POST /auth/register

### Chat & AI Assistant (2 endpoints)
- POST /chat
- POST /chat/:sessionId/end

### Food Listings (6 endpoints)
- GET /listings - **[UPDATED]** Now supports search parameter
- GET /listings/:id
- POST /listings
- PUT /listings/:id
- DELETE /listings/:id
- GET /listings/provider/my-listings

### Reservations (7 endpoints)
- POST /reservations
- GET /reservations
- GET /reservations/:id
- DELETE /reservations/:id
- POST /reservations/:id/confirm-pickup
- GET /reservations/listing/:id
- GET /reservations/student/:id

### Pantry Appointments (6 endpoints)
- GET /pantry/appointments/slots
- POST /pantry/appointments
- GET /pantry/appointments
- GET /pantry/appointments/:id
- PUT /pantry/appointments/:id
- DELETE /pantry/appointments/:id

### Pantry Orders & Cart (8 endpoints)
- GET /pantry/orders/cart
- POST /pantry/orders/cart/items
- PUT /pantry/orders/cart/items/:inventory_id
- DELETE /pantry/orders/cart/items/:inventory_id
- DELETE /pantry/orders/cart
- POST /pantry/orders/cart/submit
- GET /pantry/orders
- GET /pantry/orders/:id

### Smart Pantry Cart (6 endpoints)
- GET /pantry/cart/generate
- POST /pantry/cart/generate-and-add
- GET /pantry/cart/usual-items
- GET /pantry/cart/preference-based
- GET /pantry/cart/popular
- GET /pantry/cart/suggestion

### Notifications (5 endpoints)
- GET /notifications
- GET /notifications/unread-count
- PUT /notifications/:id/read
- PUT /notifications/read-all
- DELETE /notifications/:id

### User Preferences (9 endpoints)
- GET /preferences/user/:userId
- PUT /preferences/user/:userId
- POST /preferences/track/pantry-selection
- POST /preferences/track/reservation
- POST /preferences/track/filter-application
- GET /preferences/user/:userId/frequent-items
- GET /preferences/user/:userId/frequent-providers
- GET /preferences/user/:userId/recommendations
- GET /preferences/user/:userId/history

### Event Food (5 endpoints)
- GET /event-food
- GET /event-food/today
- GET /event-food/upcoming
- GET /event-food/:id
- GET /event-food/provider/:providerId

### Health Check (1 endpoint)
- GET /health

## Search Parameter Documentation

### Overview
The search parameter enables text-based filtering of food listings by name and description.

### Endpoint
```
GET /api/listings?search=<query>
```

### Features
- Case-insensitive matching
- Partial matches supported
- Combinable with all other filters
- Optional parameter (backward compatible)

### Examples
```
GET /api/listings?search=pizza
GET /api/listings?search=pasta&dietary_tags=vegan
GET /api/listings?search=salad&location=Building%20A&available_now=true
```

### Implementation Details
- **Backend**: `backend/src/controllers/listingController.ts`
- **Service**: `backend/src/services/listingService.ts`
- **Frontend**: `foodbridge-frontend/src/services/listingsService.ts`
- **Component**: `foodbridge-frontend/src/components/listings/ListingFilters.tsx`
- **AI Agent**: `backend/src/agent/tools/searchFood.ts`

## Documentation Standards

### For Each Endpoint
- HTTP method and path
- Authentication requirements
- Query parameters with types and defaults
- Path parameters
- Request body format (if applicable)
- Response format with status codes
- Error responses
- Example requests and responses

### General Standards
- Base URL specified
- Authentication method explained
- Rate limiting documented
- Error handling format documented
- Common status codes explained
- Pagination format documented

## Integration Guides

### Frontend Integration
See: [Search Parameter Implementation Guide](./SEARCH_PARAMETER_IMPLEMENTATION_GUIDE.md#frontend-integration)

Steps:
1. Update `listingsService.ts` to support search parameter
2. Add search input to `ListingFilters` component
3. Pass search query to API calls

### AI Agent Integration
See: [Search Parameter Implementation Guide](./SEARCH_PARAMETER_IMPLEMENTATION_GUIDE.md#ai-agent-integration)

Steps:
1. Update `searchFood` tool to use search parameter
2. Extract search terms from user intent
3. Pass search query to API

### Testing
See: [Search Parameter Implementation Guide](./SEARCH_PARAMETER_IMPLEMENTATION_GUIDE.md#testing)

Test cases:
- Simple search queries
- Search with filters
- Case-insensitive matching
- Partial matches
- URL encoding

## API Statistics

| Metric | Value |
|--------|-------|
| Total Endpoints | 50+ |
| Documented Endpoints | 50+ |
| Authentication Methods | 1 (JWT Bearer) |
| Rate Limit | 20 req/min (chat), 1000 req/15min (general) |
| Response Format | JSON |
| Pagination Support | Yes (page, limit) |
| Search Support | Yes (new) |
| Filtering Support | Yes (multiple filters) |

## Common Query Patterns

### Search Only
```
GET /api/listings?search=pizza
```

### Search with Dietary Filters
```
GET /api/listings?search=pasta&dietary_tags=vegan,gluten-free
```

### Search with Location
```
GET /api/listings?search=salad&location=Building%20A
```

### Search with Availability
```
GET /api/listings?search=sandwich&available_now=true
```

### Search with Pagination
```
GET /api/listings?search=pizza&page=2&limit=10
```

### Complex Query
```
GET /api/listings?search=pasta&dietary_tags=vegan&location=Building%20A&available_now=true&page=1&limit=20
```

## Error Handling

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### Common Status Codes
- 200 OK - Successful request
- 201 Created - Resource created
- 400 Bad Request - Invalid parameters
- 401 Unauthorized - Authentication required
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Resource not found
- 500 Internal Server Error - Server error

## Rate Limiting

- **Chat Endpoint**: 20 requests per minute per user
- **General API**: 1000 requests per 15 minutes per IP
- **Development**: Rate limiting disabled

Rate limit headers:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Unix timestamp when limit resets

## Authentication

### JWT Bearer Token
```
Authorization: Bearer <jwt-token>
```

### Token Acquisition
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Token Usage
Include in all authenticated requests:
```
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/listings
```

## Related Documentation

### Specifications
- [FoodBridge Frontend Spec](./.kiro/specs/foodbridge-frontend/)
- [FoodBridge Platform Spec](./.kiro/specs/foodbridge-platform/)

### Implementation Guides
- [Search Parameter Implementation Guide](./SEARCH_PARAMETER_IMPLEMENTATION_GUIDE.md)
- [API Reference Update](./API_REFERENCE_UPDATE_MARCH_2026.md)

### Verification
- [API Reference Verification](./API_REFERENCE_VERIFICATION_MARCH_2026.md)
- [Documentation Update Summary](./DOCUMENTATION_UPDATE_SUMMARY_MARCH_2026.md)

## Support & Questions

For questions about:
- **API Endpoints**: See [API Reference](../../docs/api_reference.md)
- **Search Parameter**: See [Search Parameter Implementation Guide](./SEARCH_PARAMETER_IMPLEMENTATION_GUIDE.md)
- **Frontend Integration**: See [Search Parameter Implementation Guide - Frontend](./SEARCH_PARAMETER_IMPLEMENTATION_GUIDE.md#frontend-integration)
- **AI Agent Integration**: See [Search Parameter Implementation Guide - AI Agent](./SEARCH_PARAMETER_IMPLEMENTATION_GUIDE.md#ai-agent-integration)
- **Testing**: See [Search Parameter Implementation Guide - Testing](./SEARCH_PARAMETER_IMPLEMENTATION_GUIDE.md#testing)

## Document Metadata

- **Last Updated**: March 14, 2026
- **Status**: Complete
- **Version**: 1.0
- **Maintained By**: Kiro Documentation System
- **Total Endpoints**: 50+
- **Documentation Coverage**: 100%
