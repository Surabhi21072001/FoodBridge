/**
 * Book Pantry Tool
 * Books a pantry appointment for a specific time slot
 */

import axios from "axios";

export interface BookPantryParams {
  appointment_time: string;
  duration_minutes?: number;
  notes?: string;
}

export interface BookPantryResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function bookPantry(
  params: BookPantryParams,
  apiBaseUrl: string,
  userToken: string
): Promise<BookPantryResult> {
  try {
    // Validate input
    if (!params.appointment_time) {
      return {
        success: false,
        error: "appointment_time is required",
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
      `${apiBaseUrl}/pantry/appointments`,
      {
        appointment_time: params.appointment_time,
        duration_minutes: params.duration_minutes || 30,
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
      error: error.response?.data?.message || error.message || "Failed to book pantry appointment",
    };
  }
}

export const bookPantryTool = {
  name: "book_pantry",
  description: "Book a pantry appointment for a specific time slot",
  parameters: {
    type: "object",
    properties: {
      appointment_time: {
        type: "string",
        description: "Appointment time (ISO 8601 format)",
      },
      duration_minutes: {
        type: "number",
        description: "Duration of appointment in minutes (default: 30)",
      },
      notes: {
        type: "string",
        description: "Special notes or requests",
      },
    },
    required: ["appointment_time"],
  },
};
