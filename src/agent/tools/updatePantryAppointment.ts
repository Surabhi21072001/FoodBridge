/**
 * Update Pantry Appointment Tool
 * Updates an existing pantry appointment (reschedule or modify notes)
 */

import axios from "axios";

export interface UpdatePantryAppointmentParams {
  appointment_id: string;
  appointment_time?: string;
  duration_minutes?: number;
  notes?: string;
}

export interface UpdatePantryAppointmentResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function updatePantryAppointment(
  params: UpdatePantryAppointmentParams,
  apiBaseUrl: string,
  userToken: string
): Promise<UpdatePantryAppointmentResult> {
  try {
    if (!params.appointment_id) {
      return { success: false, error: "appointment_id is required" };
    }

    if (!params.appointment_time && params.duration_minutes === undefined && !params.notes) {
      return { success: false, error: "At least one field to update is required (appointment_time, duration_minutes, or notes)" };
    }

    if (!apiBaseUrl || !userToken) {
      return { success: false, error: "Missing API base URL or user token" };
    }

    const body: Record<string, any> = {};
    if (params.appointment_time) body.appointment_time = params.appointment_time;
    if (params.duration_minutes !== undefined) body.duration_minutes = params.duration_minutes;
    if (params.notes !== undefined) body.notes = params.notes;

    const response = await axios.put(
      `${apiBaseUrl}/pantry/appointments/${params.appointment_id}`,
      body,
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
      error: error.response?.data?.message || error.message || "Failed to update pantry appointment",
    };
  }
}

export const updatePantryAppointmentTool = {
  name: "update_pantry_appointment",
  description: "Update an existing pantry appointment — reschedule it or modify notes",
  parameters: {
    type: "object",
    properties: {
      appointment_id: {
        type: "string",
        description: "The unique ID of the pantry appointment to update",
      },
      appointment_time: {
        type: "string",
        description: "New appointment time (ISO 8601 format)",
      },
      duration_minutes: {
        type: "number",
        description: "New duration in minutes",
      },
      notes: {
        type: "string",
        description: "Updated notes or special requests",
      },
    },
    required: ["appointment_id"],
  },
};
