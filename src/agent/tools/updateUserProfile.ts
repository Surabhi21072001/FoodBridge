/**
 * Update User Profile Tool
 * Updates the current user's profile including dietary preferences and restrictions
 */

import axios from "axios";

export interface UpdateUserProfileParams {
  email?: string;
  dietary_preferences?: string[];
  allergies?: string[];
  preferred_food_types?: string[];
  phone?: string;
  location?: string;
}

export interface UpdateUserProfileResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function updateUserProfile(
  params: UpdateUserProfileParams,
  userId: string,
  apiBaseUrl: string,
  userToken: string
): Promise<UpdateUserProfileResult> {
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

    // Validate that at least one field is provided
    if (!params || Object.keys(params).length === 0) {
      return {
        success: false,
        error: "At least one field must be provided for update",
      };
    }

    // Build update payload
    const updatePayload: Record<string, any> = {};

    if (params.email !== undefined) {
      updatePayload.email = params.email;
    }
    if (params.dietary_preferences !== undefined) {
      updatePayload.dietary_preferences = params.dietary_preferences;
    }
    if (params.allergies !== undefined) {
      updatePayload.allergies = params.allergies;
    }
    if (params.preferred_food_types !== undefined) {
      updatePayload.preferred_food_types = params.preferred_food_types;
    }
    if (params.phone !== undefined) {
      updatePayload.phone = params.phone;
    }
    if (params.location !== undefined) {
      updatePayload.location = params.location;
    }

    // Make API request to update user profile
    const response = await axios.put(`${apiBaseUrl}/users/profile`, updatePayload, {
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
      error: error.response?.data?.message || error.message || "Failed to update user profile",
    };
  }
}

export const updateUserProfileTool = {
  name: "update_user_profile",
  description: "Update current user's profile including email, dietary preferences, allergies, and preferred food types",
  parameters: {
    type: "object",
    properties: {
      email: {
        type: "string",
        description: "User's email address",
      },
      dietary_preferences: {
        type: "array",
        description: "List of dietary preferences (e.g., vegetarian, vegan, gluten-free)",
        items: { type: "string" },
      },
      allergies: {
        type: "array",
        description: "List of food allergies (e.g., peanuts, shellfish, dairy)",
        items: { type: "string" },
      },
      preferred_food_types: {
        type: "array",
        description: "List of preferred food types (e.g., Italian, Asian, Mexican)",
        items: { type: "string" },
      },
      phone: {
        type: "string",
        description: "User's phone number",
      },
      location: {
        type: "string",
        description: "User's preferred location or campus area",
      },
    },
    required: [],
  },
};
