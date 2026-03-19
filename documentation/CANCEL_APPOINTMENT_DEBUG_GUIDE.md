# Cancel Pantry Appointment - Debug Guide

## Issue: "The date and time might not be in the correct format"

This error typically means the system couldn't find an appointment matching the date and time you provided.

## Root Causes

### 1. Date/Time Format Issues

**Correct Format:**
- Date: `YYYY-MM-DD` (e.g., `2026-03-20`)
- Time: `HH:MM` in 24-hour format (e.g., `14:30` for 2:30 PM)

**Common Mistakes:**
- ❌ Using 12-hour format: "2:30 PM" instead of "14:30"
- ❌ Wrong date format: "03/20/2026" instead of "2026-03-20"
- ❌ Missing leading zeros: "3:30" instead of "03:30"
- ❌ Using seconds: "14:30:00" instead of "14:30"

### 2. Timezone Mismatch

The system stores appointments in UTC time. If your appointment shows "2:30 PM" in the UI, you need to convert it to 24-hour format:
- 12:00 AM = 00:00
- 1:00 AM = 01:00
- 12:00 PM = 12:00
- 1:00 PM = 13:00
- 2:30 PM = 14:30
- 11:59 PM = 23:59

### 3. Appointment Doesn't Exist

The appointment might:
- Already be cancelled
- Already be completed
- Have been deleted
- Be scheduled for a different date/time than you remember

## How to Fix It

### Step 1: Get Your Appointments
Ask the chatbot: **"Show me my pantry appointments"**

The bot will list all your appointments with exact dates and times.

### Step 2: Copy the Exact Date and Time
From the list, find the appointment you want to cancel and note:
- The exact date (YYYY-MM-DD format)
- The exact time (HH:MM format)

### Step 3: Use the Exact Format
Ask the chatbot: **"Cancel my appointment on [DATE] at [TIME]"**

Example:
```
User: "Cancel my appointment on 2026-03-20 at 14:30"
Bot: "I'll cancel your appointment for March 20, 2026 at 2:30 PM."
Bot: "Your appointment has been cancelled successfully."
```

## Troubleshooting Steps

### If you get "No appointment found for..."

1. **Check your appointments list first**
   - Ask: "What are my pantry appointments?"
   - Verify the date and time match exactly

2. **Check the appointment status**
   - The appointment might already be cancelled
   - The appointment might be completed (already picked up items)

3. **Verify the format**
   - Date should be: YYYY-MM-DD
   - Time should be: HH:MM (24-hour)
   - No extra spaces or characters

### If you get "Appointment is already cancelled"

- The appointment has already been cancelled
- You don't need to cancel it again

### If you get "Cannot cancel a completed appointment"

- You've already picked up the items
- Completed appointments cannot be cancelled
- Contact the pantry directly if you need to make changes

## Example Scenarios

### Scenario 1: Correct Cancellation
```
User: "Cancel my appointment on 2026-03-20 at 14:30"
Bot: "I'll cancel your appointment for March 20, 2026 at 2:30 PM."
Bot: "Your appointment has been cancelled successfully."
```

### Scenario 2: Wrong Format
```
User: "Cancel my appointment on 03/20/2026 at 2:30 PM"
Bot: "Invalid date format. Use YYYY-MM-DD (e.g., 2026-03-20)"
Bot: "Invalid time format. Use HH:MM in 24-hour format (e.g., 14:30)"
```

### Scenario 3: Appointment Not Found
```
User: "Cancel my appointment on 2026-03-20 at 14:30"
Bot: "No appointment found for 2026-03-20 at 14:30."
Bot: "Your upcoming appointments are: 2026-03-25 at 10:00"
```

## Technical Details

### Backend Endpoint
- **URL**: `DELETE /api/pantry/appointments/cancel-by-datetime`
- **Parameters**:
  - `date` (query): YYYY-MM-DD format
  - `time` (query): HH:MM format (24-hour)
- **Authentication**: Required (JWT token)

### Time Matching Logic
- Uses UTC time for comparison
- Allows 1-minute tolerance for minor time differences
- Compares year, month, day, hour, and minute

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid date format" | Date not in YYYY-MM-DD | Use format: 2026-03-20 |
| "Invalid time format" | Time not in HH:MM | Use format: 14:30 |
| "No appointment found for..." | Appointment doesn't exist | Check your appointments list |
| "Appointment is already cancelled" | Already cancelled | No action needed |
| "Cannot cancel a completed appointment" | Already picked up | Contact pantry directly |

## Prevention Tips

1. **Write down your appointment details** when you book
2. **Use the exact date and time** from your confirmation
3. **Cancel early** if you know you can't make it
4. **Check your appointments regularly** to stay organized
5. **Keep the format consistent**: YYYY-MM-DD and HH:MM

## Still Having Issues?

If you've followed all these steps and still can't cancel:

1. **Try asking for your appointments first**
   - "Show me my pantry appointments"
   - Copy the exact date and time shown

2. **Verify the format one more time**
   - Date: YYYY-MM-DD (4 digits, dash, 2 digits, dash, 2 digits)
   - Time: HH:MM (2 digits, colon, 2 digits)

3. **Contact support** with:
   - The exact date and time you're trying to cancel
   - The error message you received
   - Your user ID (if available)
