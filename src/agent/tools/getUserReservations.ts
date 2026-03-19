/**
 * Get User Reservations Tool
 * Retrieves all reservations for the current user
 */

import axios from "axios";

export interface GetUserReservationsParams {
  status?: "pending" | "confirmed" | "picked_up" | "cancelled" | "no_show";
  page?: number;
  limit?: number;
}

export interface GetUserReservationsResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getUserReservations(
  params: GetUserReservationsParams,
  userId: string,
  apiBaseUrl: string,
  userToken: string
): Promise<GetUserReservationsResult> {
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
    if (params.status) {
      queryParams.append("status", params.status);
    }
    if (params.page) {
      queryParams.append("page", params.page.toString());
    }
    if (params.limit) {
      queryParams.append("limit", params.limit.toString());
    }

    // Make API request
    const response = await axios.get(
      `${apiBaseUrl}/reservations/student/${userId}?${queryParams.toString()}`,
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
      error: error.response?.data?.message || error.message || "Failed to get reservations",
    };
  }
}

export const getUserReservationsTool = {
  name: "get_user_reservations",
  description: "Get all reservations for the current user",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        description: "Filter by reservation status",
        enum: ["pending", "confirmed", "picked_up", "cancelled", "no_show"],
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
