/**
 * Get Frequent Pantry Items Tool
 * Retrieves user's frequently selected pantry items based on history
 */

import axios from "axios";

export interface GetFrequentPantryItemsParams {
  limit?: number;
}

export interface GetFrequentPantryItemsResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getFrequentPantryItems(
  params: GetFrequentPantryItemsParams,
  userId: string,
  apiBaseUrl: string,
  userToken: string
): Promise<GetFrequentPantryItemsResult> {
  try {
    // Validate input
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

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

    // Make API request
    const response = await axios.get(
      `${apiBaseUrl}/preferences/frequent-items/${userId}?${queryParams.toString()}`,
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
      error: error.response?.data?.message || error.message || "Failed to get frequent pantry items",
    };
  }
}

export const getFrequentPantryItemsTool = {
  name: "get_frequent_pantry_items",
  description: "Get user's frequently selected pantry items based on history",
  parameters: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Number of items to return",
      },
    },
    required: [],
  },
};
