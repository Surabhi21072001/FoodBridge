/**
 * Retrieve User Preferences Tool
 * Gets current user's dietary preferences and restrictions
 */

import axios from "axios";

export interface RetrieveUserPreferencesParams {
  // No parameters needed - uses user context
}

export interface RetrieveUserPreferencesResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function retrieveUserPreferences(
  _params: RetrieveUserPreferencesParams,
  userId: string,
  apiBaseUrl: string,
  userToken: string
): Promise<RetrieveUserPreferencesResult> {
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

    // Make API request
    const response = await axios.get(`${apiBaseUrl}/preferences/user/${userId}`, {
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
      error: error.response?.data?.message || error.message || "Failed to retrieve user preferences",
    };
  }
}

export const retrieveUserPreferencesTool = {
  name: "retrieve_user_preferences",
  description: "Get current user's dietary preferences and restrictions",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
};
