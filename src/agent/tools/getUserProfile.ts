/**
 * Get User Profile Tool
 * Retrieves the current user's profile including dietary preferences and restrictions
 */

import axios from "axios";

export interface GetUserProfileParams {
  // No parameters needed - uses user context
}

export interface GetUserProfileResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getUserProfile(
  _params: GetUserProfileParams,
  userId: string,
  apiBaseUrl: string,
  userToken: string
): Promise<GetUserProfileResult> {
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

    // Make API request to get user profile
    const response = await axios.get(`${apiBaseUrl}/users/profile`, {
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
      error: error.response?.data?.message || error.message || "Failed to retrieve user profile",
    };
  }
}

export const getUserProfileTool = {
  name: "get_user_profile",
  description: "Get current user's profile including dietary preferences, allergies, and preferred food types",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
};
