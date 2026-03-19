/**
 * Disconnect Google Calendar Tool
 * Removes the Google Calendar integration for the current user
 */

import axios from "axios";

export interface DisconnectCalendarResult {
  success: boolean;
  error?: string;
}

export async function disconnectCalendar(
  _params: Record<string, never>,
  _userId: string,
  apiBaseUrl: string,
  userToken: string
): Promise<DisconnectCalendarResult> {
  try {
    if (!apiBaseUrl || !userToken) {
      return { success: false, error: "Missing API base URL or user token" };
    }

    await axios.delete(`${apiBaseUrl}/auth/google/calendar`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
    });

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to disconnect Google Calendar",
    };
  }
}
