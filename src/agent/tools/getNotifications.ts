/**
 * Get Notifications Tool
 * Retrieves user notifications about food alerts, reservations, and bookings
 */

import axios from "axios";

export interface GetNotificationsParams {
  is_read?: boolean;
  type?: string;
  limit?: number;
  page?: number;
}

export interface GetNotificationsResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getNotifications(
  params: GetNotificationsParams,
  userId: string,
  apiBaseUrl: string,
  userToken: string
): Promise<GetNotificationsResult> {
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
    if (params.is_read !== undefined) {
      queryParams.append("is_read", params.is_read.toString());
    }
    if (params.type) {
      queryParams.append("type", params.type);
    }
    if (params.limit) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params.page) {
      queryParams.append("page", params.page.toString());
    }

    // Make API request
    const response = await axios.get(
      `${apiBaseUrl}/notifications/user/${userId}?${queryParams.toString()}`,
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
      error: error.response?.data?.message || error.message || "Failed to get notifications",
    };
  }
}

export const getNotificationsTool = {
  name: "get_notifications",
  description: "Retrieve user notifications about food alerts, reservations, and bookings",
  parameters: {
    type: "object",
    properties: {
      is_read: {
        type: "boolean",
        description: "Filter by read status",
      },
      type: {
        type: "string",
        description: "Filter by notification type",
      },
      limit: {
        type: "number",
        description: "Number of notifications to retrieve",
      },
      page: {
        type: "number",
        description: "Page number for pagination",
      },
    },
    required: [],
  },
};
