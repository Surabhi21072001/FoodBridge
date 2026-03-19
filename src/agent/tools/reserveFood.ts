/**
 * Reserve Food Tool
 * Creates a reservation for a food listing
 */

import axios from "axios";

export interface ReserveFoodParams {
  listing_id: string;
  quantity: number;
  pickup_time?: string;
  notes?: string;
}

export interface ReserveFoodResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function reserveFood(
  params: ReserveFoodParams,
  apiBaseUrl: string,
  userToken: string
): Promise<ReserveFoodResult> {
  try {
    // Validate input
    if (!params.listing_id || !params.quantity) {
      return {
        success: false,
        error: "listing_id and quantity are required",
      };
    }

    if (params.quantity <= 0) {
      return {
        success: false,
        error: "Quantity must be greater than 0",
      };
    }

    if (!apiBaseUrl || !userToken) {
      return {
        success: false,
        error: "Missing API base URL or user token",
      };
    }

    // Make API request
    const response = await axios.post(
      `${apiBaseUrl}/reservations`,
      {
        listing_id: params.listing_id,
        quantity: params.quantity,
        pickup_time: params.pickup_time,
        notes: params.notes,
      },
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
      error: error.response?.data?.message || error.message || "Failed to reserve food",
    };
  }
}

export const reserveFoodTool = {
  name: "reserve_food",
  description: "Create a reservation for a food listing. IMPORTANT: Always call get_user_profile first to check the user's allergies and dietary restrictions before calling this tool. If the food item contains any of the user's allergens, do NOT call this tool — warn the user instead.",
  parameters: {
    type: "object",
    properties: {
      listing_id: {
        type: "string",
        description: "The ID of the food listing to reserve",
      },
      quantity: {
        type: "number",
        description: "Number of servings to reserve",
      },
      pickup_time: {
        type: "string",
        description: "Preferred pickup time (ISO 8601 format)",
      },
      notes: {
        type: "string",
        description: "Special notes or requests",
      },
    },
    required: ["listing_id", "quantity"],
  },
};
