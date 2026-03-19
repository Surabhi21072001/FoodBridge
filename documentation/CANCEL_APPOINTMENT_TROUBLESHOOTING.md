# Cancel Pantry Appointment - Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "No appointment found for the specified date and time"

**Possible Causes:**
1. **Timezone mismatch**: The appointment time stored in the database might be in a different timezone than what you're providing
2. **Time format issue**: The time format might not match exactly (e.g., "14:30" vs "2:30 PM")
3. **Date format issue**: The date format might not be YYYY-MM-DD
4. **Appointment doesn't exist**: The appointment might have already been cancelled or deleted

**Solutions:**
1. **Check your appointments first**: Ask the chatbot "What are my upcoming appointments?" to see the exact date and time format
2. **Use the exact format**: Ensure you're using:
   - Date: YYYY-MM-DD (e.g., 2026-03-20)
   - Time: HH:MM in 24-hour format (e.g., 14:30 for 2:30 PM)
3. **Account for timezone**: If your appointment shows "2:30 PM" in the UI, convert to 24-hour format (14:30)
4. **Check appointment status**: The appointment might already be cancelled or completed

### Issue 2: "Appointment is already cancelled"

**Cause:** You're trying to cancel an appointment that's already been cancelled.

**Solution:** Check your appointments list to see which ones are still active.

### Issue 3: "Cannot cancel a completed appointment"

**Cause:** The appointment has already been completed (you've already picked up the items).

**Solution:** Completed appointments cannot be cancelled. If you need to make changes, contact the pantry directly.

## How to Get Your Appointment Details

To find the exact date and time of your appointment:

1. Ask the chatbot: "Show me my pantry appointments"
2. The chatbot will display your appointments with exact dates and times
3. Use those exact dates and times when cancelling

Example response format:
```
Your upcoming appointments:
- March 20, 2026 at 14:30 (2:30 PM)
- March 25, 2026 at 10:00 (10:00 AM)
```

When cancelling, use:
- Date: 2026-03-20
- Time: 14:30

## Debugging Steps

If you're still having issues:

1. **Verify the appointment exists**
   - Ask: "What are my pantry appointments?"
   - Confirm the date and time match what you're trying to cancel

2. **Check the exact format**
   - Date should be: YYYY-MM-DD
   - Time should be: HH:MM (24-hour format)
   - Example: "Cancel my appointment on 2026-03-20 at 14:30"

3. **Try with a different appointment**
   - If you have multiple appointments, try cancelling a different one
   - This helps determine if it's a specific appointment issue or a general problem

4. **Contact support**
   - If the issue persists, provide:
     - The exact date and time you're trying to cancel
     - The error message you received
     - Your user ID (if available)

## Technical Details

### Backend Endpoint
- **URL**: DELETE `/api/pantry/appointments/cancel-by-datetime`
- **Parameters**: 
  - `date` (query): YYYY-MM-DD format
  - `time` (query): HH:MM format (24-hour)
- **Authentication**: Required (JWT token)
- **Response**: Cancelled appointment details

### Time Matching Logic
The system uses UTC time for comparison with a 1-minute tolerance to account for minor time differences.

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "No appointment found for..." | Appointment doesn't exist at that date/time | Check your appointments list |
| "Appointment is already cancelled" | Already cancelled | Check your appointments list |
| "Cannot cancel a completed appointment" | Already picked up | Contact pantry directly |
| "date and time query parameters are required" | Missing parameters | Provide both date and time |

## Example Conversations

### Successful Cancellation
```
User: "Cancel my pantry appointment on 2026-03-20 at 14:30"
Bot: "I'll cancel your appointment for March 20, 2026 at 2:30 PM."
Bot: "Your appointment has been cancelled successfully."
```

### Appointment Not Found
```
User: "Cancel my appointment on 2026-03-20 at 14:30"
Bot: "No appointment found for 2026-03-20 at 14:30. Your upcoming appointments are: 2026-03-25 at 10:00"
```

### Already Cancelled
```
User: "Cancel my appointment on 2026-03-20 at 14:30"
Bot: "That appointment is already cancelled."
```

## Prevention Tips

1. **Write down your appointment details** when you book
2. **Use the exact date and time** from your confirmation
3. **Cancel early** if you know you can't make it
4. **Check your appointments regularly** to stay organized
