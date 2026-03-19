/**
 * Search Food Tool
 * Searches for available food listings with optional filters
 */

import axios from "axios";

export interface SearchFoodParams {
  dietary_filters?: string[];
  category?: "meal" | "snack" | "beverage" | "pantry_item" | "deal" | "event_food";
  available_now?: boolean;
  search?: string;
  max_price?: number;
  min_price?: number;
  provider_id?: string;
  page?: number;
  limit?: number;
}

export interface SearchFoodResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function searchFood(
  params: SearchFoodParams,
  apiBaseUrl: string,
  userToken: string
): Promise<SearchFoodResult> {
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
    if (params.dietary_filters?.length) {
      queryParams.append("dietary_tags", params.dietary_filters.join(","));
    }
    if (params.category) {
      queryParams.append("category", params.category);
    }
    if (params.available_now) {
      queryParams.append("available_now", "true");
    }
    if (params.search) {
      queryParams.append("search", params.search);
    }
    if (params.max_price !== undefined) {
      queryParams.append("max_price", params.max_price.toString());
    }
    if (params.min_price !== undefined) {
      queryParams.append("min_price", params.min_price.toString());
    }
    if (params.provider_id) {
      queryParams.append("provider_id", params.provider_id);
    }
    if (params.page) {
      queryParams.append("page", params.page.toString());
    }
    if (params.limit) {
      queryParams.append("limit", params.limit.toString());
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
      error: error.response?.data?.message || error.message || "Failed to search food",
    };
  }
}

export const searchFoodTool = {
  name: "search_food",
  description: "Search for available food listings with optional filters like dietary preferences, location, price range, and food type",
  parameters: {
    type: "object",
    properties: {
      dietary_filters: {
        type: "array",
        description: "Dietary tags to filter by (e.g., vegetarian, vegan, gluten-free)",
        items: { type: "string" },
      },
      category: {
        type: "string",
        description: "Food category",
        enum: ["meal", "snack", "beverage", "pantry_item", "deal", "event_food"],
      },
      available_now: {
        type: "boolean",
        description: "Only show currently available food",
      },
      max_price: {
        type: "number",
        description: "Maximum price filter (in dollars)",
      },
      min_price: {
        type: "number",
        description: "Minimum price filter (in dollars)",
      },
      provider_id: {
        type: "string",
        description: "Filter listings by a specific provider ID",
      },
      page: {
        type: "number",
        description: "Page number for pagination",
      },
      limit: {
        type: "number",
        description: "Number of results per page",
      },
    },
    required: [],
  },
};
