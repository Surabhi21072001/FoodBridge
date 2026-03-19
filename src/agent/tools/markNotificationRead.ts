/**
 * Mark Notification Read Tool
 * Marks a notification as read
 */

import axios from "axios";

export interface MarkNotificationReadParams {
  notification_id: string;
}

export interface MarkNotificationReadResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function markNotificationRead(
  params: MarkNotificationReadParams,
  apiBaseUrl: string,
  userToken: string
): Promise<MarkNotificationReadResult> {
  try {
    // Validate input
    if (!params.notification_id) {
      return {
        success: false,
        error: "notification_id is required",
      };
    }

    if (!apiBaseUrl || !userToken) {
      return {
        success: false,
        error: "Missing API base URL or user token",
      };
    }

    // Make API request
    const response = await axios.patch(
      `${apiBaseUrl}/notifications/${params.notification_id}/read`,
      {},
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
      error: error.response?.data?.message || error.message || "Failed to mark notification as read",
    };
  }
}

export const markNotificationReadTool = {
  name: "mark_notification_read",
  description: "Mark a notification as read",
  parameters: {
    type: "object",
    properties: {
      notification_id: {
        type: "string",
        description: "The ID of the notification to mark as read",
      },
    },
    required: ["notification_id"],
  },
};
