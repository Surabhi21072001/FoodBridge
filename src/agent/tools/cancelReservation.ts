/**
 * Cancel Reservation Tool
 * Cancels an existing reservation
 */

import axios from "axios";

export interface CancelReservationParams {
  reservation_id: string;
}

export interface CancelReservationResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function cancelReservation(
  params: CancelReservationParams,
  apiBaseUrl: string,
  userToken: string
): Promise<CancelReservationResult> {
  try {
    // Validate input
    if (!params.reservation_id) {
      return {
        success: false,
        error: "reservation_id is required",
      };
    }

    if (!apiBaseUrl || !userToken) {
      return {
        success: false,
        error: "Missing API base URL or user token",
      };
    }

    // Make API request
    const response = await axios.delete(`${apiBaseUrl}/reservations/${params.reservation_id}`, {
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
      error: error.response?.data?.message || error.message || "Failed to cancel reservation",
    };
  }
}

export const cancelReservationTool = {
  name: "cancel_reservation",
  description: "Cancel an existing reservation",
  parameters: {
    type: "object",
    properties: {
      reservation_id: {
        type: "string",
        description: "The ID of the reservation to cancel",
      },
    },
    required: ["reservation_id"],
  },
};
