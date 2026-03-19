/**
 * Get Pantry Appointment By ID Tool
 * Retrieves a specific pantry appointment by its ID
 */

import axios from "axios";

export interface GetPantryAppointmentByIdParams {
  appointment_id: string;
}

export interface GetPantryAppointmentByIdResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getPantryAppointmentById(
  params: GetPantryAppointmentByIdParams,
  apiBaseUrl: string,
  userToken: string
): Promise<GetPantryAppointmentByIdResult> {
  try {
    if (!params.appointment_id) {
      return { success: false, error: "appointment_id is required" };
    }

    if (!apiBaseUrl || !userToken) {
      return { success: false, error: "Missing API base URL or user token" };
    }

    const response = await axios.get(
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
      error: error.response?.data?.message || error.message || "Failed to get pantry appointment",
    };
  }
}

export const getPantryAppointmentByIdTool = {
  name: "get_pantry_appointment_by_id",
  description: "Get details of a specific pantry appointment by its ID",
  parameters: {
    type: "object",
    properties: {
      appointment_id: {
        type: "string",
        description: "The unique ID of the pantry appointment",
      },
    },
    required: ["appointment_id"],
  },
};
