/**
 * Get Pantry Slots Tool
 * Retrieves available pantry appointment time slots
 */

import axios from "axios";

export interface GetPantrySlotsParams {
  date?: string;
}

export interface GetPantrySlotsResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getPantrySlots(
  params: GetPantrySlotsParams,
  apiBaseUrl: string,
  userToken: string
): Promise<GetPantrySlotsResult> {
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
    if (params.date) {
      queryParams.append("date", params.date);
    }

    // Make API request
    const response = await axios.get(
      `${apiBaseUrl}/pantry/appointments/slots?${queryParams.toString()}`,
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
      error: error.response?.data?.message || error.message || "Failed to get pantry slots",
    };
  }
}

export const getPantrySlotsTool = {
  name: "get_pantry_slots",
  description: "Get available pantry appointment time slots",
  parameters: {
    type: "object",
    properties: {
      date: {
        type: "string",
        description: "Date to check for available slots. Accepts YYYY-MM-DD (e.g. '2026-03-17') or ISO datetime string (e.g. '2026-03-17T16:30:00') — the time portion is ignored.",
      },
    },
    required: [],
  },
};
