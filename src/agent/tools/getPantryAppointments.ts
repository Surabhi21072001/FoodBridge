/**
 * Get Pantry Appointments Tool
 * Retrieves user's pantry appointments
 */

import axios from "axios";

export interface GetPantryAppointmentsParams {
  status?: string;
  upcoming?: boolean;
  limit?: number;
}

export interface GetPantryAppointmentsResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getPantryAppointments(
  params: GetPantryAppointmentsParams,
  apiBaseUrl: string,
  userToken: string
): Promise<GetPantryAppointmentsResult> {
  try {
    if (!apiBaseUrl || !userToken) {
      return {
        success: false,
        error: "Missing API base URL or user token",
      };
    }

    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append("status", params.status);
    if (params.upcoming !== undefined) queryParams.append("upcoming", params.upcoming.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());

    // Make API request
    const response = await axios.get(
      `${apiBaseUrl}/pantry/appointments?${queryParams.toString()}`,
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
      error: error.response?.data?.message || error.message || "Failed to get pantry appointments",
    };
  }
}

export const getPantryAppointmentsTool = {
  name: "get_pantry_appointments",
  description: "Get your pantry appointments to see scheduled dates and times",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        description: "Filter by appointment status (scheduled, confirmed, completed, cancelled)",
      },
      upcoming: {
        type: "boolean",
        description: "Only show upcoming appointments (default: true)",
      },
      limit: {
        type: "number",
        description: "Maximum number of appointments to return (default: 20)",
      },
    },
    required: [],
  },
};
