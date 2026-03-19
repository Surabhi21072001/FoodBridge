/**
 * Cancel Pantry Appointment By ID Tool
 * Cancels an existing pantry appointment using its unique ID
 */

import axios from "axios";

export interface CancelPantryAppointmentByIdParams {
  appointment_id: string;
}

export interface CancelPantryAppointmentByIdResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function cancelPantryAppointmentById(
  params: CancelPantryAppointmentByIdParams,
  apiBaseUrl: string,
  userToken: string
): Promise<CancelPantryAppointmentByIdResult> {
  try {
    if (!params.appointment_id) {
      return { success: false, error: "appointment_id is required" };
    }

    if (!apiBaseUrl || !userToken) {
      return { success: false, error: "Missing API base URL or user token" };
    }

    const response = await axios.delete(
      `${apiBaseUrl}/pantry/appointments/${params.appointment_id}`,
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to cancel pantry appointment",
    };
  }
}

export const cancelPantryAppointmentByIdTool = {
  name: "cancel_pantry_appointment_by_id",
  description: "Cancel an existing pantry appointment using its unique appointment ID",
  parameters: {
    type: "object",
    properties: {
      appointment_id: {
        type: "string",
        description: "The unique ID of the pantry appointment to cancel",
      },
    },
    required: ["appointment_id"],
  },
};
