/**
 * Get Dining Deals Tool
 * Retrieves current dining discounts and special offers
 */

import axios from "axios";

export interface GetDiningDealsParams {
  limit?: number;
  page?: number;
}

export interface GetDiningDealsResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getDiningDeals(
  params: GetDiningDealsParams,
  apiBaseUrl: string,
  userToken: string
): Promise<GetDiningDealsResult> {
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
    queryParams.append("category", "deal");
    if (params.limit) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params.page) {
      queryParams.append("page", params.page.toString());
    }

    // Make API request
    const response = await axios.get(`${apiBaseUrl}/listings?${queryParams.toString()}`, {
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
      error: error.response?.data?.message || error.message || "Failed to get dining deals",
    };
  }
}

export const getDiningDealsTool = {
  name: "get_dining_deals",
  description: "Get current dining discounts and special offers",
  parameters: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Number of deals to return",
      },
      page: {
        type: "number",
        description: "Page number for pagination",
      },
    },
    required: [],
  },
};
