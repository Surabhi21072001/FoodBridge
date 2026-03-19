# API Reference Update - Cancel Appointment by DateTime

**Date:** March 15, 2026  
**Status:** Complete  
**File Updated:** `docs/api_reference.md`

## Summary

Added comprehensive documentation for the new `DELETE /pantry/appointments/cancel-by-datetime` endpoint to the API reference guide.

## New Endpoint Documentation

### DELETE /pantry/appointments/cancel-by-datetime

**Purpose:** Cancel a pantry appointment by specifying the date and time instead of the appointment ID.

**Authentication:** Required (student role)

**Query Parameters:**
- `date` (string, required): Date in YYYY-MM-DD format
- `time` (string, required): Time in HH:mm format (24-hour)

**Request Example:**
```
DELETE /api/pantry/appointments/cancel-by-datetime?date=2024-01-15&time=10:00
Authorization: Bearer <jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "appointment_id": "uuid",
    "student_id": "uuid",
    "slot_id": "uuid",
    "status": "cancelled",
    "notes": "Optional notes",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:45:00Z"
  },
  "message": "Appointment cancelled successfully"
}
```

**Error Responses:**
- **400 - Missing Parameters:** `date and time query parameters are required`
- **401 - Unauthorized:** `Authentication required`
- **403 - Forbidden:** `You can only cancel your own appointments`
- **404 - Not Found:** `Appointment not found`
- **409 - Conflict:** `Appointment is already cancelled`

## Key Features

1. **Alternative Cancellation Method:** Allows users to cancel appointments without needing the appointment ID
2. **Date/Time Based Lookup:** Finds appointments by date and time instead of ID
3. **User-Specific:** Only cancels appointments belonging to the authenticated user
4. **Conflict Handling:** Prevents cancelling already-cancelled appointments
5. **Comprehensive Error Handling:** Clear error messages for all failure scenarios

## Implementation Details

**Controller Method:** `cancelAppointmentByDateTime`  
**Service Method:** `appointmentService.cancelAppointmentByDateTime(userId, date, time)`

**Validation:**
- Both `date` and `time` query parameters are required
- Date format: YYYY-MM-DD (e.g., 2024-01-15)
- Time format: HH:mm in 24-hour format (e.g., 10:00, 14:30)

**Behavior:**
- Finds the first appointment matching the user ID, date, and time
- Returns the cancelled appointment with updated status
- If multiple appointments exist for the same date/time, the first one is cancelled
- Useful for cancelling appointments when the user doesn't have the appointment ID

## Documentation Location

The endpoint documentation has been added to `docs/api_reference.md` in the **Pantry Appointments** section, positioned after the `DELETE /pantry/appointments/:id` endpoint for logical grouping.

## Related Files

- **Controller:** `backend/src/controllers/pantryAppointmentController.ts`
- **Service:** `backend/src/services/pantryAppointmentService.ts`
- **API Reference:** `docs/api_reference.md`

## Testing Recommendations

1. **Valid Cancellation:** Test cancelling an appointment with valid date and time
2. **Missing Parameters:** Test with missing `date` or `time` query parameters
3. **Invalid Format:** Test with incorrectly formatted date/time
4. **Non-existent Appointment:** Test with date/time that doesn't match any appointment
5. **Already Cancelled:** Test cancelling an already-cancelled appointment
6. **Authorization:** Test with different user roles (student, provider, admin)
7. **Multiple Appointments:** Test behavior when multiple appointments exist for the same date/time

## Notes

- This endpoint provides a user-friendly alternative to the ID-based cancellation endpoint
- Particularly useful for mobile clients or voice-based interfaces where appointment IDs may not be readily available
- The endpoint maintains consistency with existing error handling patterns
- All timestamps are in ISO 8601 format (UTC)
