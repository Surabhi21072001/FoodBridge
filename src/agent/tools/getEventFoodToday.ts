/**
 * Get Event Food Today Tool
 * Retrieves food available from events today
 */

import axios from "axios";

export interface GetEventFoodTodayParams {
  // No parameters required
}

export interface GetEventFoodTodayResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getEventFoodToday(
  _params: GetEventFoodTodayParams,
  apiBaseUrl: string,
  userToken: string
): Promise<GetEventFoodTodayResult> {
  try {
    // Validate input
    if (!apiBaseUrl || !userToken) {
      return {
        success: false,
        error: "Missing API base URL or user token",
      };
    }

    // Make API request to today's event food endpoint
    const response = await axios.get(`${apiBaseUrl}/event-food/today`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to get today's event food",
    };
  }
}

export const getEventFoodTodayTool = {
  name: "get_event_food_today",
  description: "Get food available from events today",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
};
