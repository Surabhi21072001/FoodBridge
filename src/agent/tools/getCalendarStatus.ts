/**
 * Get Google Calendar Connection Status Tool
 * Checks whether the current user has connected their Google Calendar
 */

import axios from "axios";

export interface GetCalendarStatusResult {
  success: boolean;
  data?: { connected: boolean };
  error?: string;
}

export async function getCalendarStatus(
  _params: Record<string, never>,
  _userId: string,
  apiBaseUrl: string,
  userToken: string
): Promise<GetCalendarStatusResult> {
  try {
    if (!apiBaseUrl || !userToken) {
      return { success: false, error: "Missing API base URL or user token" };
    }

    const response = await axios.get(`${apiBaseUrl}/auth/google/calendar/status`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to retrieve calendar status",
    };
  }
}
