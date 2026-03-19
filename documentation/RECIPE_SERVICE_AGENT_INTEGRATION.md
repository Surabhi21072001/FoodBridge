# Recipe Service Agent Integration Guide

## Overview

This guide explains how to integrate the Recipe Service MCP with the FoodBridge AI agent to enable natural language recipe discovery and recommendations.

## Architecture

```
User Message
    ↓
Agent (Claude)
    ↓
Tool Selection
    ├─ search_recipes (MCP)
    ├─ get_recipe_details (MCP)
    ├─ search_food (API)
    ├─ get_user_preferences (API)
    └─ get_frequent_items (API)
    ↓
Response Generation
    ↓
User Response
```

## Integration Steps

### Step 1: Update Agent Prompts

Add recipe capabilities to the system prompt in `backend/src/agent/llm/prompts.ts`:

```typescript
export const SYSTEM_PROMPT = `
You are FoodBridge, an AI assistant helping students discover and access affordable food.

You have access to the following capabilities:

## Food Discovery
- Search available food listings with dietary filters
- Get detailed information about specific listings
- Check pantry availability and book appointments
- View current dining deals and special offers

## Recipe Suggestions
- Search for recipes based on available pantry ingredients
- Get detailed recipe instructions and cooking times
- Discover recipes by cuisine type
- View nutritional information for recipes
- Suggest recipes that match dietary preferences

## Smart Recommendations
- Learn user preferences (dietary restrictions, favorite cuisines)
- Generate personalized pantry carts
- Suggest recipes using frequently purchased items
- Recommend meals based on available food and pantry items

## User Preferences
- Dietary restrictions (vegetarian, vegan, gluten-free, etc.)
- Food intolerances and allergies
- Favorite cuisines and meal types
- Budget constraints

When a user asks about recipes or what they can cook:
1. First, understand their available ingredients (pantry items or food listings)
2. Consider their dietary preferences and restrictions
3. Search for matching recipes using the search_recipes tool
4. Provide recipe suggestions with cooking time and ingredient match
5. Offer to show full recipe details if interested

When suggesting recipes:
- Prioritize recipes that use most of their available ingredients
- Filter by dietary preferences automatically
- Mention cooking time and servings
- Highlight any missing ingredients
- Offer nutritional information if asked
`;
```

### Step 2: Add Recipe Tool Handlers

Update `backend/src/agent/tools/mcpExecutor.ts` to include recipe tools:

```typescript
// Add to MCPToolExecutor class

private async mcpSearchRecipes(args: Record<string, any>): Promise<ToolResult> {
  try {
    return await this.executeMCPTool("search_recipes", args);
  } catch (error) {
    return {
      success: false,
      error: `Failed to search recipes: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

private async mcpGetRecipeDetails(args: Record<string, any>): Promise<ToolResult> {
  try {
    return await this.executeMCPTool("get_recipe_details", args);
  } catch (error) {
    return {
      success: false,
      error: `Failed to get recipe details: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

private async mcpSearchRecipesByCuisine(args: Record<string, any>): Promise<ToolResult> {
  try {
    return await this.executeMCPTool("search_recipes_by_cuisine", args);
  } catch (error) {
    return {
      success: false,
      error: `Failed to search recipes by cuisine: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

private async mcpGetRecipeNutrition(args: Record<string, any>): Promise<ToolResult> {
  try {
    return await this.executeMCPTool("get_recipe_nutrition", args);
  } catch (error) {
    return {
      success: false,
      error: `Failed to get recipe nutrition: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Update execute() method to handle recipe tools
async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
  // ... existing code ...
  
  // Add recipe tool cases
  case "search_recipes":
    return this.mcpSearchRecipes(args);
  case "get_recipe_details":
    return this.mcpGetRecipeDetails(args);
  case "search_recipes_by_cuisine":
    return this.mcpSearchRecipesByCuisine(args);
  case "get_recipe_nutrition":
    return this.mcpGetRecipeNutrition(args);
  
  // ... rest of cases ...
}
```

### Step 3: Update Tool Registry

Add recipe tools to the agent's tool registry in `backend/src/agent/tools/registry.ts`:

```typescript
export const AGENT_TOOLS = [
  // ... existing tools ...
  
  // Recipe Service Tools
  {
    name: "search_recipes",
    description: "Search for recipes based on available pantry ingredients",
    category: "recipe",
    source: "mcp:foodbridge-recipes",
  },
  {
    name: "get_recipe_details",
    description: "Get detailed recipe information including ingredients and instructions",
    category: "recipe",
    source: "mcp:foodbridge-recipes",
  },
  {
    name: "search_recipes_by_cuisine",
    description: "Search for recipes filtered by cuisine type",
    category: "recipe",
    source: "mcp:foodbridge-recipes",
  },
  {
    name: "get_recipe_nutrition",
    description: "Get nutritional information for a recipe",
    category: "recipe",
    source: "mcp:foodbridge-recipes",
  },
];
```

## Usage Workflows

### Workflow 1: Ingredient-Based Recipe Discovery

**User:** "I have chicken, rice, and tomato. What can I cook?"

**Agent Flow:**
```typescript
// 1. Parse ingredients from user message
const ingredients = ["chicken", "rice", "tomato"];

// 2. Get user preferences
const preferences = await apiGetUserPreferences();

// 3. Search recipes
const recipes = await mcpSearchRecipes({
  ingredients,
  ranking: "maximize",
  diet: preferences.diet,
  intolerances: preferences.intolerances,
  number: 5
});

// 4. Format and present results
return formatRecipeResults(recipes.data.recipes);
```

### Workflow 2: Pantry-Based Recommendations

**User:** "What recipes can I make with my pantry items?"

**Agent Flow:**
```typescript
// 1. Get user's frequent items
const frequentItems = await apiGetFrequentItems();
const ingredients = frequentItems.map(item => item.name);

// 2. Get user preferences
const preferences = await apiGetUserPreferences();

// 3. Search recipes
const recipes = await mcpSearchRecipes({
  ingredients,
  diet: preferences.diet,
  intolerances: preferences.intolerances,
  number: 10
});

// 4. Get details for top recipes
const topRecipes = recipes.data.recipes.slice(0, 3);
const details = await Promise.all(
  topRecipes.map(r => mcpGetRecipeDetails({ recipe_id: r.id }))
);

// 5. Present with full details
return formatDetailedRecipes(details);
```

### Workflow 3: Cuisine-Based Discovery

**User:** "I want to try Thai food. What can I make?"

**Agent Flow:**
```typescript
// 1. Get user's pantry items
const pantryItems = await apiGetFrequentItems();
const ingredients = pantryItems.map(item => item.name);

// 2. Search by cuisine
const recipes = await mcpSearchRecipesByCuisine({
  cuisine: "thai",
  ingredients: ingredients.length > 0 ? ingredients : undefined,
  number: 10
});

// 3. Get details for selected recipes
const selectedRecipe = recipes.data.recipes[0];
const details = await mcpGetRecipeDetails({
  recipe_id: selectedRecipe.id
});

// 4. Present recipe with instructions
return formatRecipeWithInstructions(details.data);
```

### Workflow 4: Nutritional Awareness

**User:** "Show me high-protein recipes I can make"

**Agent Flow:**
```typescript
// 1. Get pantry items
const ingredients = await getPantryIngredients();

// 2. Search recipes
const recipes = await mcpSearchRecipes({
  ingredients,
  number: 15
});

// 3. Get nutrition for each recipe
const nutritionData = await Promise.all(
  recipes.data.recipes.map(r => 
    mcpGetRecipeNutrition({ recipe_id: r.id })
  )
);

// 4. Filter and sort by protein
const highProtein = nutritionData
  .filter(n => extractProtein(n.data) > 25)
  .sort((a, b) => extractProtein(b.data) - extractProtein(a.data));

// 5. Present sorted results
return formatNutritionResults(highProtein);
```

## Response Formatting

### Recipe Search Results

```typescript
function formatRecipeResults(recipes: any[]): string {
  return recipes
    .map((recipe, i) => `
${i + 1}. **${recipe.title}**
   - Uses ${recipe.usedIngredientCount} of your ingredients
   - Missing ${recipe.missedIngredientCount} ingredients
   - [View Recipe](recipe://${recipe.id})
    `)
    .join("\n");
}
```

### Detailed Recipe Format

```typescript
function formatRecipeWithInstructions(recipe: any): string {
  return `
**${recipe.title}**

⏱️ **Cooking Time:** ${recipe.readyInMinutes} minutes
👥 **Servings:** ${recipe.servings}
🍽️ **Cuisines:** ${recipe.cuisines.join(", ")}

**Ingredients:**
${recipe.ingredients.map(i => `- ${i.amount} ${i.unit} ${i.name}`).join("\n")}

**Instructions:**
${recipe.instructions}

[Full Recipe](${recipe.sourceUrl})
  `;
}
```

## Error Handling

```typescript
async function handleRecipeToolError(error: any): Promise<string> {
  if (error.message.includes("Invalid API Key")) {
    return "Recipe service is not properly configured. Please contact support.";
  }
  
  if (error.message.includes("Rate limit")) {
    return "Recipe service is temporarily unavailable. Please try again later.";
  }
  
  if (error.message.includes("No recipes found")) {
    return "No recipes found with those ingredients. Try different items or remove dietary filters.";
  }
  
  return "Unable to search recipes. Please try again.";
}
```

## Testing Integration

### Test Case 1: Basic Recipe Search

```typescript
test("should search recipes by ingredients", async () => {
  const result = await agent.execute("search_recipes", {
    ingredients: ["chicken", "rice"],
    number: 5
  });
  
  expect(result.success).toBe(true);
  expect(result.data.recipes.length).toBeGreaterThan(0);
  expect(result.data.recipes[0]).toHaveProperty("id");
  expect(result.data.recipes[0]).toHaveProperty("title");
});
```

### Test Case 2: Recipe Details

```typescript
test("should get recipe details", async () => {
  const result = await agent.execute("get_recipe_details", {
    recipe_id: 123456
  });
  
  expect(result.success).toBe(true);
  expect(result.data).toHaveProperty("ingredients");
  expect(result.data).toHaveProperty("instructions");
});
```

### Test Case 3: Cuisine Search

```typescript
test("should search recipes by cuisine", async () => {
  const result = await agent.execute("search_recipes_by_cuisine", {
    cuisine: "thai",
    number: 10
  });
  
  expect(result.success).toBe(true);
  expect(result.data.recipes.length).toBeGreaterThan(0);
});
```

## Performance Optimization

### Caching Strategy

```typescript
class RecipeCache {
  private cache = new Map<string, any>();
  private ttl = 24 * 60 * 60 * 1000; // 24 hours

  set(key: string, value: any): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
}
```

### Request Batching

```typescript
async function batchGetRecipeDetails(recipeIds: number[]): Promise<any[]> {
  const results = await Promise.all(
    recipeIds.map(id => mcpGetRecipeDetails({ recipe_id: id }))
  );
  return results.map(r => r.data);
}
```

## Monitoring and Logging

```typescript
function logRecipeToolUsage(toolName: string, args: any, result: any): void {
  console.log({
    timestamp: new Date().toISOString(),
    tool: toolName,
    args,
    success: result.success,
    resultCount: result.data?.recipes?.length || 0
  });
}
```

## Deployment Checklist

- [ ] Recipe server files created
- [ ] MCP configuration updated
- [ ] API key configured in environment
- [ ] Agent prompts updated
- [ ] Tool handlers added to mcpExecutor
- [ ] Tool registry updated
- [ ] Response formatting implemented
- [ ] Error handling added
- [ ] Integration tests written
- [ ] End-to-end testing completed
- [ ] Documentation updated
- [ ] Deployed to production

## Support

For integration issues:
1. Check MCP server logs
2. Verify API key is valid
3. Test tools individually in Kiro
4. Review agent prompts
5. Check error handling

---

**Integration Status:** Ready for Implementation
**Last Updated:** March 11, 2026
**Version:** 1.0.0
