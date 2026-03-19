/**
 * Get Event Food Tool
 * Retrieves food available from events
 */

import axios from "axios";

export interface GetEventFoodParams {
  limit?: number;
  page?: number;
  available_now?: boolean;
}

export interface GetEventFoodResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getEventFood(
  params: GetEventFoodParams,
  apiBaseUrl: string,
  userToken: string
): Promise<GetEventFoodResult> {
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
    if (params.limit) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params.page) {
      queryParams.append("page", params.page.toString());
    }
    if (params.available_now) {
      queryParams.append("available_now", "true");
    }

    // Make API request to dedicated event-food endpoint
    const response = await axios.get(`${apiBaseUrl}/event-food?${queryParams.toString()}`, {
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
      error: error.response?.data?.message || error.message || "Failed to get event food",
    };
  }
}

export const getEventFoodTool = {
  name: "get_event_food",
  description: "Get food available from events",
  parameters: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Number of items to return",
      },
      page: {
        type: "number",
        description: "Page number for pagination",
      },
      available_now: {
        type: "boolean",
        description: "Only show currently available food",
      },
    },
    required: [],
  },
};
