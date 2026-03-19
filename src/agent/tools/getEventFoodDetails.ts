/**
 * Get Event Food Details Tool
 * Retrieves detailed information about a specific event food listing
 */

import axios from "axios";

export interface GetEventFoodDetailsParams {
  listing_id: string;
}

export interface GetEventFoodDetailsResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getEventFoodDetails(
  params: GetEventFoodDetailsParams,
  apiBaseUrl: string,
  userToken: string
): Promise<GetEventFoodDetailsResult> {
  try {
    // Validate input
    if (!apiBaseUrl || !userToken) {
      return {
        success: false,
        error: "Missing API base URL or user token",
      };
    }

    if (!params.listing_id) {
      return {
        success: false,
        error: "Listing ID is required",
      };
    }

    // Make API request to event food details endpoint
    const response = await axios.get(
      `${apiBaseUrl}/event-food/${params.listing_id}`,
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
      error: error.response?.data?.message || error.message || "Failed to get event food details",
    };
  }
}

export const getEventFoodDetailsTool = {
  name: "get_event_food_details",
  description: "Get detailed information about a specific event food listing",
  parameters: {
    type: "object",
    properties: {
      listing_id: {
        type: "string",
        description: "The ID of the event food listing",
      },
    },
    required: ["listing_id"],
  },
};
