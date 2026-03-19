/**
 * Suggest Recipes Tool
 * Provides simple recipes using pantry items (LLM-based helper)
 * This tool doesn't call a backend API - it's implemented as an LLM helper
 */

export interface SuggestRecipesParams {
  pantry_items?: string[];
  dietary_restrictions?: string[];
  cuisine_type?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface SuggestRecipesResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function suggestRecipes(
  params: SuggestRecipesParams
): Promise<SuggestRecipesResult> {
  try {
    // Validate input
    if (!params.pantry_items || params.pantry_items.length === 0) {
      return {
        success: false,
        error: "At least one pantry item is required",
      };
    }

    // This is a helper function that returns structured data
    // The actual recipe generation is handled by the LLM
    // This tool just validates and formats the request
    const recipeRequest = {
      items: params.pantry_items,
      dietary_restrictions: params.dietary_restrictions || [],
      cuisine_type: params.cuisine_type || "any",
      difficulty: params.difficulty || "easy",
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      data: {
        request: recipeRequest,
        message: "Recipe suggestions will be generated based on your pantry items and preferences",
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to suggest recipes",
    };
  }
}

export const suggestRecipesTool = {
  name: "suggest_recipes",
  description: "Provides simple recipes using pantry items (LLM-based helper)",
  parameters: {
    type: "object",
    properties: {
      pantry_items: {
        type: "array",
        description: "List of pantry items to use in recipes",
        items: { type: "string" },
      },
      dietary_restrictions: {
        type: "array",
        description: "Dietary restrictions to consider",
        items: { type: "string" },
      },
      cuisine_type: {
        type: "string",
        description: "Preferred cuisine type (e.g., Italian, Asian, Mexican)",
      },
      difficulty: {
        type: "string",
        description: "Recipe difficulty level",
        enum: ["easy", "medium", "hard"],
      },
    },
    required: ["pantry_items"],
  },
};
