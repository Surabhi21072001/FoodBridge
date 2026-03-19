/**
 * Generate Pantry Cart Tool
 * Generates a recommended pantry cart based on user's history and preferences
 */

import axios from "axios";

export interface GeneratePantryCartParams {
  include_frequent?: boolean;
  respect_preferences?: boolean;
  max_items?: number;
}

export interface GeneratePantryCartResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function generatePantryCart(
  params: GeneratePantryCartParams,
  userId: string,
  apiBaseUrl: string,
  userToken: string
): Promise<GeneratePantryCartResult> {
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
    if (params.include_frequent !== undefined) {
      queryParams.append("include_frequent", params.include_frequent.toString());
    }
    if (params.respect_preferences !== undefined) {
      queryParams.append("respect_preferences", params.respect_preferences.toString());
    }

    // Make API request to the updated endpoint
    const response = await axios.get(
      `${apiBaseUrl}/pantry/cart/generate?${queryParams.toString()}`,
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
      error: error.response?.data?.message || error.message || "Failed to generate pantry cart",
    };
  }
}

export const generatePantryCartTool = {
  name: "generate_pantry_cart",
  description: "Generate a recommended pantry cart based on user's history and preferences. Returns items, total count, and generation timestamp.",
  parameters: {
    type: "object",
    properties: {
      include_frequent: {
        type: "boolean",
        description: "Include frequently selected items",
      },
      respect_preferences: {
        type: "boolean",
        description: "Respect dietary preferences",
      },
      max_items: {
        type: "number",
        description: "Maximum number of items to include in the cart (default: 10)",
      },
    },
    required: [],
  },
};
