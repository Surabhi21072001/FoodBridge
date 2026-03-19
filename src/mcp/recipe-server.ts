import {
  Server,
} from "@modelcontextprotocol/sdk/server/index.js";
import {
  StdioServerTransport,
} from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Recipe API configuration
const RECIPE_API_KEY = process.env.SPOONACULAR_API_KEY || "";
const RECIPE_API_BASE = "https://api.spoonacular.com/recipes";

interface RecipeSearchResult {
  id: number;
  title: string;
  image: string;
  usedIngredients?: Array<{ name: string; amount: number; unit: string }>;
  missedIngredients?: Array<{ name: string; amount: number; unit: string }>;
}

interface RecipeDetails {
  id: number;
  title: string;
  image: string;
  servings: number;
  readyInMinutes: number;
  cuisines: string[];
  diets: string[];
  extendedIngredients: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  instructions: string;
  sourceUrl: string;
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Initialize MCP server
const server = new Server({
  name: "foodbridge-recipe-service",
  version: "1.0.0",
});

// Tool definitions
const tools: Tool[] = [
  {
    name: "search_recipes",
    description:
      "Search for recipes based on available pantry ingredients. Returns recipes that can be made with the provided ingredients.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ingredients: {
          type: "array",
          items: { type: "string" },
          description:
            "List of ingredients available in the pantry (e.g., ['chicken', 'rice', 'tomato'])",
        },
        number: {
          type: "number",
          description: "Number of recipes to return (default: 10, max: 20)",
          default: 10,
        },
        ranking: {
          type: "string",
          enum: ["maximize", "minimize"],
          description:
            "Ranking method: maximize uses most ingredients, minimize uses fewest (default: maximize)",
          default: "maximize",
        },
        diet: {
          type: "string",
          enum: [
            "vegetarian",
            "vegan",
            "gluten free",
            "dairy free",
            "paleo",
            "keto",
          ],
          description: "Optional dietary restriction filter",
        },
        intolerances: {
          type: "array",
          items: { type: "string" },
          description:
            "Ingredients to avoid (e.g., ['peanuts', 'shellfish', 'dairy'])",
        },
      },
      required: ["ingredients"],
    },
  },
  {
    name: "get_recipe_details",
    description:
      "Get detailed information about a specific recipe including ingredients, instructions, and nutritional information.",
    inputSchema: {
      type: "object" as const,
      properties: {
        recipe_id: {
          type: "number",
          description: "The unique identifier of the recipe",
        },
        include_nutrition: {
          type: "boolean",
          description: "Include nutritional information (default: true)",
          default: true,
        },
      },
      required: ["recipe_id"],
    },
  },
  {
    name: "search_recipes_by_cuisine",
    description:
      "Search for recipes by cuisine type and available ingredients.",
    inputSchema: {
      type: "object" as const,
      properties: {
        cuisine: {
          type: "string",
          enum: [
            "italian",
            "asian",
            "mexican",
            "american",
            "indian",
            "mediterranean",
            "thai",
            "chinese",
            "japanese",
            "french",
          ],
          description: "Cuisine type to search for",
        },
        ingredients: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of ingredients to filter by",
        },
        number: {
          type: "number",
          description: "Number of recipes to return (default: 10)",
          default: 10,
        },
      },
      required: ["cuisine"],
    },
  },
  {
    name: "get_recipe_nutrition",
    description:
      "Get detailed nutritional information for a specific recipe.",
    inputSchema: {
      type: "object" as const,
      properties: {
        recipe_id: {
          type: "number",
          description: "The unique identifier of the recipe",
        },
      },
      required: ["recipe_id"],
    },
  },
];

// Tool implementations
async function searchRecipes(params: any): Promise<ToolResult> {
  try {
    const {
      ingredients,
      number = 10,
      ranking = "maximize",
      diet,
      intolerances,
    } = params;

    if (!ingredients || ingredients.length === 0) {
      return {
        success: false,
        error: "At least one ingredient is required",
      };
    }

    const ingredientString = ingredients.join(",");
    const url = new URL(`${RECIPE_API_BASE}/findByIngredients`);
    url.searchParams.append("apiKey", RECIPE_API_KEY);
    url.searchParams.append("ingredients", ingredientString);
    url.searchParams.append("number", Math.min(number, 20).toString());
    url.searchParams.append("ranking", ranking);
    url.searchParams.append("addRecipeInformation", "true");

    const response = await fetch(url.toString());
    if (!response.ok) {
      // Fallback to complexSearch if findByIngredients fails
      return await searchRecipesComplex(ingredients, number, diet, intolerances);
    }

    const recipes = (await response.json()) as RecipeSearchResult[];

    // Filter by intolerances if specified
    let filtered = recipes;
    if (intolerances && intolerances.length > 0) {
      filtered = filtered.filter((recipe) => {
        const recipeIngredients = [
          ...(recipe.usedIngredients || []),
          ...(recipe.missedIngredients || []),
        ].map((i) => i.name.toLowerCase());
        return !intolerances.some((intolerance: string) =>
          recipeIngredients.some((ing) =>
            ing.includes(intolerance.toLowerCase())
          )
        );
      });
    }

    return {
      success: true,
      data: {
        recipes: filtered.map((recipe) => ({
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          usedIngredients: recipe.usedIngredients || [],
          missedIngredients: recipe.missedIngredients || [],
          usedIngredientCount: (recipe.usedIngredients || []).length,
          missedIngredientCount: (recipe.missedIngredients || []).length,
        })),
        count: filtered.length,
        query: {
          ingredients,
          ranking,
          diet: diet || "none",
          intolerances: intolerances || [],
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search recipes: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function searchRecipesComplex(
  ingredients: string[],
  number: number,
  diet?: string,
  intolerances?: string[]
): Promise<ToolResult> {
  try {
    const url = new URL(`${RECIPE_API_BASE}/complexSearch`);
    url.searchParams.append("apiKey", RECIPE_API_KEY);
    url.searchParams.append("includeIngredients", ingredients.join(","));
    url.searchParams.append("number", Math.min(number, 20).toString());
    if (diet) {
      url.searchParams.append("diet", diet);
    }
    if (intolerances && intolerances.length > 0) {
      url.searchParams.append("intolerances", intolerances.join(","));
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      return {
        success: false,
        error: `Recipe API error: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as {
      results: Array<{ id: number; title: string; image: string }>;
    };
    return {
      success: true,
      data: {
        recipes: (data.results || []).map((recipe) => ({
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          usedIngredients: [],
          missedIngredients: [],
          usedIngredientCount: 0,
          missedIngredientCount: 0,
        })),
        count: (data.results || []).length,
        query: {
          ingredients,
          ranking: "complex",
          diet: diet || "none",
          intolerances: intolerances || [],
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search recipes: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function getRecipeDetails(params: any): Promise<ToolResult> {
  try {
    const { recipe_id, include_nutrition = true } = params;

    if (!recipe_id) {
      return {
        success: false,
        error: "recipe_id is required",
      };
    }

    const url = new URL(`${RECIPE_API_BASE}/${recipe_id}/information`);
    url.searchParams.append("apiKey", RECIPE_API_KEY);
    if (include_nutrition) {
      url.searchParams.append("includeNutrition", "true");
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      return {
        success: false,
        error: `Recipe API error: ${response.statusText}`,
      };
    }

    const recipe = (await response.json()) as RecipeDetails;

    return {
      success: true,
      data: {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        servings: recipe.servings,
        readyInMinutes: recipe.readyInMinutes,
        cuisines: recipe.cuisines,
        diets: recipe.diets,
        ingredients: recipe.extendedIngredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        })),
        instructions: recipe.instructions,
        sourceUrl: recipe.sourceUrl,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get recipe details: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function searchRecipesByCuisine(params: any): Promise<ToolResult> {
  try {
    const { cuisine, ingredients, number = 10 } = params;

    if (!cuisine) {
      return {
        success: false,
        error: "cuisine is required",
      };
    }

    const url = new URL(`${RECIPE_API_BASE}/complexSearch`);
    url.searchParams.append("apiKey", RECIPE_API_KEY);
    url.searchParams.append("cuisine", cuisine);
    url.searchParams.append("number", Math.min(number, 20).toString());

    if (ingredients && ingredients.length > 0) {
      url.searchParams.append("includeIngredients", ingredients.join(","));
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      return {
        success: false,
        error: `Recipe API error: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as {
      results: Array<{ id: number; title: string; image: string }>;
    };

    return {
      success: true,
      data: {
        recipes: data.results.map((recipe) => ({
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
        })),
        count: data.results.length,
        cuisine,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search recipes by cuisine: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function getRecipeNutrition(params: any): Promise<ToolResult> {
  try {
    const { recipe_id } = params;

    if (!recipe_id) {
      return {
        success: false,
        error: "recipe_id is required",
      };
    }

    const url = new URL(`${RECIPE_API_BASE}/${recipe_id}/nutritionWidget.json`);
    url.searchParams.append("apiKey", RECIPE_API_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) {
      return {
        success: false,
        error: `Recipe API error: ${response.statusText}`,
      };
    }

    const nutrition = await response.json();

    return {
      success: true,
      data: nutrition,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get recipe nutrition: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// MCP request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  let result: ToolResult;

  switch (name) {
    case "search_recipes":
      result = await searchRecipes(args);
      break;
    case "get_recipe_details":
      result = await getRecipeDetails(args);
      break;
    case "search_recipes_by_cuisine":
      result = await searchRecipesByCuisine(args);
      break;
    case "get_recipe_nutrition":
      result = await getRecipeNutrition(args);
      break;
    default:
      result = {
        success: false,
        error: `Unknown tool: ${name}`,
      };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result),
      },
    ],
  };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("FoodBridge Recipe Service MCP server running on stdio");
}

main().catch(console.error);
