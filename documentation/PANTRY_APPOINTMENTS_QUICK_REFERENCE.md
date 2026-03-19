# Pantry Appointments API - Quick Reference

## Endpoint Summary

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| POST | `/pantry/appointments` | ✅ | Student | Create appointment |
| GET | `/pantry/appointments` | ✅ | Student | List user's appointments |
| GET | `/pantry/appointments/slots` | ❌ | Public | Get available slots |
| GET | `/pantry/appointments/student/:id` | ✅ | Admin | Get student's appointments |
| GET | `/pantry/appointments/:id` | ✅ | Student/Admin | Get specific appointment |
| PUT | `/pantry/appointments/:id` | ✅ | Student | Update appointment |
| DELETE | `/pantry/appointments/:id` | ✅ | Student | Cancel appointment |
| GET | `/pantry/appointments/admin/all` | ✅ | Admin | List all appointments |

## Common Use Cases

### 1. Student Books an Appointment

**Step 1: Get Available Slots** (No auth required)
```bash
curl -X GET "http://localhost:3000/api/pantry/appointments/slots?date=2024-01-20"
```

**Step 2: Create Appointment** (Requires auth)
```bash
curl -X POST "http://localhost:3000/api/pantry/appointments" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "slot_id": "550e8400-e29b-41d4-a716-446655440000",
    "notes": "I have dietary restrictions"
  }'
```

### 2. Student Views Their Appointments

```bash
curl -X GET "http://localhost:3000/api/pantry/appointments?status=confirmed&upcoming=true" \
  -H "Authorization: Bearer <token>"
```

### 3. Student Reschedules an Appointment

```bash
curl -X PUT "http://localhost:3000/api/pantry/appointments/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "slot_id": "660e8400-e29b-41d4-a716-446655440001",
    "notes": "Updated notes"
  }'
```

### 4. Student Cancels an Appointment

```bash
curl -X DELETE "http://localhost:3000/api/pantry/appointments/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>"
```

### 5. Admin Views All Appointments

```bash
curl -X GET "http://localhost:3000/api/pantry/appointments/admin/all?status=confirmed&page=1&limit=50" \
  -H "Authorization: Bearer <admin-token>"
```

### 6. Admin Views Specific Student's Appointments

```bash
curl -X GET "http://localhost:3000/api/pantry/appointments/student/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <admin-token>"
```

## Query Parameters Reference

### GET /pantry/appointments
- `status` (string): confirmed, cancelled, completed
- `upcoming` (boolean): true/false
- `page` (number): default 1
- `limit` (number): default 20

### GET /pantry/appointments/slots
- `date` (string): YYYY-MM-DD format
- `limit` (number): default 20

### GET /pantry/appointments/student/:id
- `status` (string): confirmed, cancelled, completed
- `upcoming` (boolean): true/false
- `page` (number): default 1
- `limit` (number): default 20

### GET /pantry/appointments/admin/all
- `status` (string): confirmed, cancelled, completed
- `date` (string): YYYY-MM-DD format
- `page` (number): default 1
- `limit` (number): default 20

## Response Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Request completed successfully |
| 201 | Created | Appointment created successfully |
| 400 | Bad Request | Invalid parameters or data |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions for the action |
| 404 | Not Found | Appointment or resource not found |
| 409 | Conflict | Slot no longer available or appointment already cancelled |

## Authentication

All endpoints except `/slots` require JWT authentication:

```
Authorization: Bearer <jwt-token>
```

Token obtained from `/auth/login` endpoint.

## Request/Response Examples

### Create Appointment Request
```json
{
  "slot_id": "550e8400-e29b-41d4-a716-446655440000",
  "notes": "I have dietary restrictions"
}
```

### Create Appointment Response (201)
```json
{
  "success": true,
  "data": {
    "appointment_id": "660e8400-e29b-41d4-a716-446655440001",
    "student_id": "770e8400-e29b-41d4-a716-446655440002",
    "slot_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "confirmed",
    "notes": "I have dietary restrictions",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  },
  "message": "Appointment created successfully"
}
```

### List Appointments Response (200)
```json
{
  "success": true,
  "data": [
    {
      "appointment_id": "660e8400-e29b-41d4-a716-446655440001",
      "student_id": "770e8400-e29b-41d4-a716-446655440002",
      "slot_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "confirmed",
      "notes": "I have dietary restrictions",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total_count": 5,
    "page": 1,
    "limit": 20,
    "total_pages": 1
  }
}
```

### Get Available Slots Response (200)
```json
{
  "success": true,
  "data": [
    {
      "slot_id": "550e8400-e29b-41d4-a716-446655440000",
      "start_time": "2024-01-15T10:00:00Z",
      "end_time": "2024-01-15T10:30:00Z",
      "available_spots": 5,
      "total_spots": 10
    },
    {
      "slot_id": "550e8400-e29b-41d4-a716-446655440001",
      "start_time": "2024-01-15T10:30:00Z",
      "end_time": "2024-01-15T11:00:00Z",
      "available_spots": 3,
      "total_spots": 10
    }
  ]
}
```

### Error Response (400)
```json
{
  "success": false,
  "message": "Invalid appointment data"
}
```

### Error Response (401)
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### Error Response (403)
```json
{
  "success": false,
  "message": "Only students can book appointments"
}
```

### Error Response (404)
```json
{
  "success": false,
  "message": "Appointment not found"
}
```

### Error Response (409)
```json
{
  "success": false,
  "message": "Slot is no longer available"
}
```

## Important Notes

1. **Route Ordering**: `/slots` must come before `/:id` routes to prevent route conflicts
2. **Public Endpoint**: `/slots` is the only public endpoint (no authentication required)
3. **Slot Duration**: Slots are typically 30 minutes long
4. **Timestamps**: All timestamps are in ISO 8601 format (UTC)
5. **Pagination**: Default page size is 20 items
6. **Status Values**: confirmed, cancelled, completed
7. **Admin Access**: Admin can view any student's appointments via `/student/:id`
8. **Student Access**: Students can only view and manage their own appointments

## Frontend Integration Checklist

- [ ] Implement slot selection UI using `/slots` endpoint
- [ ] Implement appointment booking using `POST /pantry/appointments`
- [ ] Implement appointment list view using `GET /pantry/appointments`
- [ ] Implement appointment detail view using `GET /pantry/appointments/:id`
- [ ] Implement appointment rescheduling using `PUT /pantry/appointments/:id`
- [ ] Implement appointment cancellation using `DELETE /pantry/appointments/:id`
- [ ] Implement admin dashboard using `GET /pantry/appointments/admin/all`
- [ ] Implement error handling for all status codes
- [ ] Implement pagination for list endpoints
- [ ] Implement date filtering for slots

## Troubleshooting

### Issue: 409 Conflict when creating appointment
**Cause**: Slot is no longer available (already fully booked)
**Solution**: Refresh available slots and try a different slot

### Issue: 403 Forbidden when creating appointment
**Cause**: User role is not 'student'
**Solution**: Ensure user is logged in as a student

### Issue: 404 Not Found when updating appointment
**Cause**: Appointment ID doesn't exist or belongs to different user
**Solution**: Verify appointment ID and that you own the appointment

### Issue: 401 Unauthorized
**Cause**: Missing or invalid JWT token
**Solution**: Login again to get a fresh token

## Related Endpoints

- **Authentication**: `POST /auth/login`, `POST /auth/register`
- **Pantry Orders**: `GET /pantry/orders`, `POST /pantry/orders/cart/submit`
- **Pantry Inventory**: `GET /pantry/inventory`
- **Notifications**: `GET /notifications`

## API Documentation

For complete API documentation, see: `docs/api_reference.md`
