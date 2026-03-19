/**
 * Cancel Pantry Appointment Tool
 * Cancels an existing pantry appointment by date and time
 */

import axios from "axios";

export interface CancelPantryAppointmentParams {
  date: string;
  time: string;
}

export interface CancelPantryAppointmentResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function cancelPantryAppointment(
  params: CancelPantryAppointmentParams,
  apiBaseUrl: string,
  userToken: string
): Promise<CancelPantryAppointmentResult> {
  try {
    // Validate input
    if (!params.date || !params.time) {
      return {
        success: false,
        error: "date and time are required",
      };
    }

    if (!apiBaseUrl || !userToken) {
      return {
        success: false,
        error: "Missing API base URL or user token",
      };
    }

    // Make API request with date and time as query parameters
    const response = await axios.delete(`${apiBaseUrl}/pantry/appointments/cancel-by-datetime`, {
      params: {
        date: params.date,
        time: params.time,
      },
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
      error: error.response?.data?.message || error.message || "Failed to cancel pantry appointment",
    };
  }
}

export const cancelPantryAppointmentTool = {
  name: "cancel_pantry_appointment",
  description: "Cancel an existing pantry appointment by providing the date and time",
  parameters: {
    type: "object",
    properties: {
      date: {
        type: "string",
        description: "The date of the appointment to cancel (YYYY-MM-DD format)",
      },
      time: {
        type: "string",
        description: "The time of the appointment to cancel (HH:MM format, 24-hour)",
      },
    },
    required: ["date", "time"],
  },
};
