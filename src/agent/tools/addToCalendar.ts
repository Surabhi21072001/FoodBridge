/**
 * Add to Google Calendar Tool
 * Creates a calendar event directly on the user's connected Google Calendar
 */

import axios from "axios";

export interface AddToCalendarParams {
  title: string;
  start_time: string;
  end_time: string;
  description?: string;
}

export interface AddToCalendarResult {
  success: boolean;
  data?: { google_event_id: string };
  error?: string;
}

export async function addToCalendar(
  params: AddToCalendarParams,
  _userId: string,
  apiBaseUrl: string,
  userToken: string
): Promise<AddToCalendarResult> {
  try {
    if (!apiBaseUrl || !userToken) {
      return { success: false, error: "Missing API base URL or user token" };
    }

    const { title, start_time, end_time, description } = params;

    const response = await axios.post(
      `${apiBaseUrl}/auth/google/calendar/events`,
      { title, start_time, end_time, description },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true, data: response.data.data };
  } catch (error: any) {
    const notConnected = error.response?.data?.not_connected;
    return {
      success: false,
      error: notConnected
        ? "NOT_CONNECTED"
        : error.response?.data?.message || error.message || "Failed to add event to Google Calendar",
    };
  }
}
