/**
 * Get Provider Event Food Tool
 * Retrieves event food listings from a specific provider
 */

import axios from "axios";

export interface GetProviderEventFoodParams {
  provider_id: string;
  page?: number;
  limit?: number;
}

export interface GetProviderEventFoodResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getProviderEventFood(
  params: GetProviderEventFoodParams,
  apiBaseUrl: string,
  userToken: string
): Promise<GetProviderEventFoodResult> {
  try {
    // Validate input
    if (!apiBaseUrl || !userToken) {
      return {
        success: false,
        error: "Missing API base URL or user token",
      };
    }

    if (!params.provider_id) {
      return {
        success: false,
        error: "Provider ID is required",
      };
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.page) {
      queryParams.append("page", params.page.toString());
    }
    if (params.limit) {
      queryParams.append("limit", params.limit.toString());
    }

    // Make API request to provider event food endpoint
    const response = await axios.get(
      `${apiBaseUrl}/event-food/provider/${params.provider_id}?${queryParams.toString()}`,
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
      error: error.response?.data?.message || error.message || "Failed to get provider event food",
    };
  }
}

export const getProviderEventFoodTool = {
  name: "get_provider_event_food",
  description: "Get event food listings from a specific provider",
  parameters: {
    type: "object",
    properties: {
      provider_id: {
        type: "string",
        description: "The ID of the provider",
      },
      page: {
        type: "number",
        description: "Page number for pagination",
      },
      limit: {
        type: "number",
        description: "Number of items per page",
      },
    },
    required: ["provider_id"],
  },
};
