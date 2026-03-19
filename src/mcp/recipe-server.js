#!/usr/bin/env node

/**
 * FoodBridge Recipe Service MCP Server
 * Implements Model Context Protocol for recipe discovery
 * Exposes tools for searching recipes and getting recipe details
 */

const readline = require("readline");

// Recipe API configuration
const RECIPE_API_KEY = process.env.SPOONACULAR_API_KEY || "";
const RECIPE_API_BASE = "https://api.spoonacular.com/recipes";

// Log startup info
console.error("[MCP] Recipe Service initializing...");
console.error("[MCP] API Key present:", !!RECIPE_API_KEY);
console.error("[MCP] Node version:", process.version);

// Ensure API key is set
if (!RECIPE_API_KEY) {
  console.error("[MCP] ERROR: SPOONACULAR_API_KEY environment variable not set");
  console.error("[MCP] Exiting...");
  process.exit(1);
}

// Tool definitions - MCP format
const TOOLS = [
  {
    name: "search_recipes",
    description:
      "Search for recipes based on available pantry ingredients. Returns recipes that can be made with the provided ingredients.",
    inputSchema: {
      type: "object",
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
      type: "object",
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
      type: "object",
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
      type: "object",
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
async function searchRecipes(params) {
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

    const recipes = await response.json();

    // Filter by intolerances if specified
    let filtered = recipes;
    if (intolerances && intolerances.length > 0) {
      filtered = filtered.filter((recipe) => {
        const recipeIngredients = [
          ...(recipe.usedIngredients || []),
          ...(recipe.missedIngredients || []),
        ].map((i) => i.name.toLowerCase());
        return !intolerances.some((intolerance) =>
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
      error: `Failed to search recipes: ${error.message}`,
    };
  }
}

async function searchRecipesComplex(ingredients, number, diet, intolerances) {
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

    const data = await response.json();
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
      error: `Failed to search recipes: ${error.message}`,
    };
  }
}

async function getRecipeDetails(params) {
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

    const recipe = await response.json();

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
      error: `Failed to get recipe details: ${error.message}`,
    };
  }
}

async function searchRecipesByCuisine(params) {
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

    const data = await response.json();

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
      error: `Failed to search recipes by cuisine: ${error.message}`,
    };
  }
}

async function getRecipeNutrition(params) {
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
      error: `Failed to get recipe nutrition: ${error.message}`,
    };
  }
}

// MCP Protocol Handler
async function handleRequest(request) {
  try {
    const { jsonrpc, id, method, params } = request;

    if (method === "initialize") {
      return {
        jsonrpc,
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          serverInfo: {
            name: "foodbridge-recipe-service",
            version: "1.0.0",
          },
        },
      };
    }

    if (method === "tools/list") {
      return {
        jsonrpc,
        id,
        result: {
          tools: TOOLS,
        },
      };
    }

    if (method === "tools/call") {
      const { name, arguments: args } = params;

      let result;
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
          return {
            jsonrpc,
            id,
            error: {
              code: -32601,
              message: `Unknown tool: ${name}`,
            },
          };
      }

      return {
        jsonrpc,
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result),
            },
          ],
        },
      };
    }

    return {
      jsonrpc,
      id,
      error: {
        code: -32601,
        message: `Unknown method: ${method}`,
      },
    };
  } catch (error) {
    return {
      jsonrpc: request.jsonrpc,
      id: request.id,
      error: {
        code: -32603,
        message: error.message,
      },
    };
  }
}

// Start server
console.error("[MCP] Setting up readline interface...");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

console.error("[MCP] Readline interface created");

let isProcessing = false;
let requestCount = 0;

rl.on("line", async (line) => {
  requestCount++;
  console.error(`[MCP] Received request #${requestCount}`);
  
  if (!line.trim()) {
    console.error("[MCP] Empty line, skipping");
    return;
  }

  try {
    isProcessing = true;
    console.error(`[MCP] Parsing JSON: ${line.substring(0, 50)}...`);
    const request = JSON.parse(line);
    console.error(`[MCP] Processing method: ${request.method}`);
    const response = await handleRequest(request);
    console.error(`[MCP] Sending response for request #${requestCount}`);
    console.log(JSON.stringify(response));
    isProcessing = false;
  } catch (error) {
    console.error(`[MCP] Error processing request #${requestCount}:`, error.message);
    console.error(error.stack);
    isProcessing = false;
  }
});

rl.on("close", async () => {
  console.error("[MCP] Readline closed, shutting down...");
  // Give a moment for any pending operations
  setTimeout(() => {
    process.exit(0);
  }, 100);
});

rl.on("error", (error) => {
  console.error("[MCP] Readline error:", error.message);
  process.exit(1);
});

process.on("SIGINT", async () => {
  console.error("[MCP] Received SIGINT, shutting down...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("[MCP] Received SIGTERM, shutting down...");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("[MCP] Uncaught exception:", error.message);
  console.error(error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[MCP] Unhandled rejection:", reason);
  process.exit(1);
});

console.error("[MCP] Recipe Service ready, waiting for requests...");
