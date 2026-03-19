# API Reference Update - March 15, 2026

## Summary

Updated `docs/api_reference.md` with comprehensive documentation for all Pantry Appointment endpoints, reflecting the recent route reorganization in `backend/src/routes/pantryAppointmentRoutes.ts`.

## Key Changes

### Route Reorganization
The pantry appointment routes were reorganized to fix route ordering issues:
- **Before**: `/slots` was defined first, then other routes
- **After**: `/slots` is now defined after authenticated routes but before `/:id` routes to prevent route conflicts

### Documentation Enhancements

#### 1. **POST /pantry/appointments** - Create Appointment
- Added detailed request body with field descriptions
- Added complete request example with headers
- Added multiple error responses (400, 401, 403, 409)
- Clarified student-only requirement

#### 2. **GET /pantry/appointments** - List User Appointments
- Added query parameters: `status`, `upcoming`, `page`, `limit`
- Added multiple query examples
- Added pagination response structure
- Added error responses for unauthorized/forbidden access

#### 3. **GET /pantry/appointments/slots** - Get Available Slots (PUBLIC)
- **Marked as public endpoint** (no authentication required)
- Added query parameters: `date`, `limit`
- Added multiple query examples
- Added response fields: `available_spots`, `total_spots`
- Added notes about slot duration and availability
- Added error handling for invalid date format

#### 4. **GET /pantry/appointments/student/:id** - Get Student Appointments (ADMIN)
- Added admin-only requirement
- Added path parameter: `id` (student ID)
- Added query parameters: `status`, `upcoming`, `page`, `limit`
- Added multiple query examples
- Added pagination response structure
- Added error responses for unauthorized/forbidden access

#### 5. **GET /pantry/appointments/:id** - Get Specific Appointment
- Added detailed path parameter description
- Added request example with authorization header
- Added complete response structure
- Added error responses (401, 403, 404)

#### 6. **PUT /pantry/appointments/:id** - Update Appointment
- Added detailed request body with field descriptions
- Added complete request example with headers
- Added response with updated timestamps
- Added error responses (400, 401, 403, 404, 409)

#### 7. **DELETE /pantry/appointments/:id** - Cancel Appointment
- Added detailed path parameter description
- Added request example with authorization header
- Added response showing cancelled status
- Added error responses (401, 403, 404, 409)

#### 8. **GET /pantry/appointments/admin/all** - List All Appointments (ADMIN)
- Added admin-only requirement
- Added query parameters: `status`, `date`, `page`, `limit`
- Added multiple query examples
- Added pagination response structure
- Added error responses for unauthorized/forbidden access

### Documentation Standards Applied

Each endpoint now includes:
- ✅ HTTP method and path
- ✅ Authentication requirements
- ✅ Path parameters (if applicable)
- ✅ Query parameters with descriptions and defaults
- ✅ Request body structure (if applicable)
- ✅ Request examples with headers
- ✅ Success response (200/201) with complete JSON structure
- ✅ Error responses with status codes and messages
- ✅ Additional notes and clarifications

### Route Ordering Notes

The documentation now includes a critical note about route ordering:

```
Notes:
- Route ordering: `/slots` must come before `/:id` routes to avoid route conflicts
- `/slots` is public and does not require authentication
- `/student/:id` requires admin role
- `/:id` requires authentication (student or admin)
- All other routes require student role
```

This ensures developers understand why the routes are ordered this way in the implementation.

## Files Modified

- **docs/api_reference.md**: Updated Pantry Appointments section (lines 540-1050+)

## Related Implementation Files

- **backend/src/routes/pantryAppointmentRoutes.ts**: Route definitions with correct ordering
- **backend/src/controllers/pantryAppointmentController.ts**: Endpoint implementations

## Verification Checklist

- [x] All 8 endpoints documented
- [x] Authentication requirements clearly specified
- [x] Query parameters documented with defaults
- [x] Request/response examples provided
- [x] Error responses included for each endpoint
- [x] Route ordering explained
- [x] Public vs. authenticated endpoints distinguished
- [x] Admin-only endpoints marked
- [x] Student-only endpoints marked
- [x] Pagination structure documented
- [x] Status codes documented (200, 201, 400, 401, 403, 404, 409)

## Next Steps

1. Review the updated documentation for accuracy
2. Verify all endpoints match the current implementation
3. Test endpoints using the provided examples
4. Update frontend API client to match documented endpoints
5. Consider adding integration tests based on documented examples

## Notes

- The `/slots` endpoint is intentionally public to allow unauthenticated users to view available appointment slots
- All timestamps are in ISO 8601 format (UTC)
- Pagination uses `page` and `limit` query parameters consistently across all list endpoints
- Error responses follow a standard format with `success`, `message`, and optional `error` fields
