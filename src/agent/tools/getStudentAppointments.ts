/**
 * Get Student Appointments Tool
 * Retrieves pantry appointments for a specific student (admin/staff use)
 */

import axios from "axios";

export interface GetStudentAppointmentsParams {
  student_id: string;
  status?: string;
  upcoming?: boolean;
  page?: number;
  limit?: number;
}

export interface GetStudentAppointmentsResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getStudentAppointments(
  params: GetStudentAppointmentsParams,
  apiBaseUrl: string,
  userToken: string
): Promise<GetStudentAppointmentsResult> {
  try {
    if (!params.student_id) {
      return { success: false, error: "student_id is required" };
    }

    if (!apiBaseUrl || !userToken) {
      return { success: false, error: "Missing API base URL or user token" };
    }

    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append("status", params.status);
    if (params.upcoming !== undefined) queryParams.append("upcoming", params.upcoming.toString());
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const response = await axios.get(
      `${apiBaseUrl}/pantry/appointments/student/${params.student_id}?${queryParams.toString()}`,
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
      error: error.response?.data?.message || error.message || "Failed to get student appointments",
    };
  }
}

export const getStudentAppointmentsTool = {
  name: "get_student_appointments",
  description: "Get pantry appointments for a specific student by their ID (admin/staff use)",
  parameters: {
    type: "object",
    properties: {
      student_id: {
        type: "string",
        description: "The unique ID of the student",
      },
      status: {
        type: "string",
        description: "Filter by appointment status (scheduled, confirmed, completed, cancelled)",
      },
      upcoming: {
        type: "boolean",
        description: "Only show upcoming appointments",
      },
      page: {
        type: "number",
        description: "Page number for pagination (default: 1)",
      },
      limit: {
        type: "number",
        description: "Number of results per page (default: 20)",
      },
    },
    required: ["student_id"],
  },
};
