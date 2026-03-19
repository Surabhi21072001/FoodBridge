/**
 * Get Upcoming Event Food Tool
 * Retrieves food available from upcoming events
 */

import axios from "axios";

export interface GetUpcomingEventFoodParams {
  days?: number;
}

export interface GetUpcomingEventFoodResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getUpcomingEventFood(
  params: GetUpcomingEventFoodParams,
  apiBaseUrl: string,
  userToken: string
): Promise<GetUpcomingEventFoodResult> {
  try {
    // Validate input
    if (!apiBaseUrl || !userToken) {
      return {
        success: false,
        error: "Missing API base URL or user token",
      };
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.days) {
      queryParams.append("days", params.days.toString());
    }

    // Make API request to upcoming event food endpoint
    const response = await axios.get(
      `${apiBaseUrl}/event-food/upcoming?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to get upcoming event food",
    };
  }
}

export const getUpcomingEventFoodTool = {
  name: "get_upcoming_event_food",
  description: "Get food available from upcoming events",
  parameters: {
    type: "object",
    properties: {
      days: {
        type: "number",
        description: "Number of days to look ahead (default: 7)",
      },
    },
    required: [],
  },
};
