# FoodBridge Recipe Service MCP Configuration

## Overview

The Recipe Service MCP extends the FoodBridge AI assistant with recipe discovery and suggestion capabilities. It integrates with the Spoonacular Recipe API to provide intelligent recipe recommendations based on available pantry ingredients, dietary preferences, and cuisine preferences.

## Architecture

```
AI Agent (Claude)
    ↓
MCP Client (Kiro IDE)
    ↓
MCP Recipe Server (foodbridge-recipes)
    ↓
Spoonacular Recipe API
```

The recipe service acts as a bridge between the AI agent and external recipe databases, enabling natural language recipe discovery and personalized recommendations.

## Configuration

### MCP Server Setup

The recipe service is configured in `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "foodbridge-recipes": {
      "command": "node",
      "args": ["backend/src/mcp/recipe-server.js"],
      "env": {
        "SPOONACULAR_API_KEY": "YOUR_SPOONACULAR_API_KEY_HERE",
        "NODE_ENV": "development"
      },
      "disabled": false,
      "autoApprove": [
        "search_recipes",
        "get_recipe_details",
        "search_recipes_by_cuisine",
        "get_recipe_nutrition"
      ]
    }
  }
}
```

### Environment Variables

Update your `.env` file with the Spoonacular API key:

```env
SPOONACULAR_API_KEY=your_api_key_here
```

**Getting a Spoonacular API Key:**
1. Visit https://spoonacular.com/food-api
2. Sign up for a free account
3. Copy your API key from the dashboard
4. Add to `.env` file

Free tier includes:
- 500 requests per day
- Access to all recipe endpoints
- Sufficient for development and testing

## Available Tools

### 1. search_recipes

Search for recipes based on available pantry ingredients. The tool intelligently ranks recipes by how many of your ingredients they use.

**Parameters:**
- `ingredients` (array, required): List of available ingredients (e.g., `["chicken", "rice", "tomato"]`)
- `number` (number, optional): Number of recipes to return (default: 10, max: 20)
- `ranking` (string, optional): Ranking method
  - `maximize`: Uses most of your ingredients (default)
  - `minimize`: Uses fewest ingredients
- `diet` (string, optional): Dietary restriction filter
  - `vegetarian`, `vegan`, `gluten free`, `dairy free`, `paleo`, `keto`
- `intolerances` (array, optional): Ingredients to avoid (e.g., `["peanuts", "shellfish"]`)

**Returns:**
```json
{
  "success": true,
  "data": {
    "recipes": [
      {
        "id": 123456,
        "title": "Chicken Fried Rice",
        "image": "https://...",
        "usedIngredients": [
          { "name": "chicken", "amount": 2, "unit": "cups" },
          { "name": "rice", "amount": 3, "unit": "cups" }
        ],
        "missedIngredients": [
          { "name": "soy sauce", "amount": 3, "unit": "tbsp" }
        ],
        "usedIngredientCount": 2,
        "missedIngredientCount": 1
      }
    ],
    "count": 5,
    "query": {
      "ingredients": ["chicken", "rice", "tomato"],
      "ranking": "maximize",
      "diet": "none",
      "intolerances": []
    }
  }
}
```

**Use Cases:**
- "What can I make with chicken, rice, and tomato?"
- "Show me vegetarian recipes using these pantry items"
- "Find recipes I can make without dairy"
- "What recipes use the most of my ingredients?"

### 2. get_recipe_details

Get comprehensive information about a specific recipe including ingredients, cooking instructions, and nutritional data.

**Parameters:**
- `recipe_id` (number, required): The unique recipe identifier
- `include_nutrition` (boolean, optional): Include nutritional information (default: true)

**Returns:**
```json
{
  "success": true,
  "data": {
    "id": 123456,
    "title": "Chicken Fried Rice",
    "image": "https://...",
    "servings": 4,
    "readyInMinutes": 30,
    "cuisines": ["asian", "chinese"],
    "diets": ["gluten free"],
    "ingredients": [
      { "name": "chicken breast", "amount": 2, "unit": "cups" },
      { "name": "cooked rice", "amount": 3, "unit": "cups" },
      { "name": "soy sauce", "amount": 3, "unit": "tbsp" }
    ],
    "instructions": "Heat oil in wok. Add chicken and stir-fry until cooked...",
    "sourceUrl": "https://spoonacular.com/recipes/..."
  }
}
```

**Use Cases:**
- "Tell me how to make recipe #123456"
- "What are the ingredients for this recipe?"
- "How long does this recipe take?"
- "Show me the full recipe with instructions"

### 3. search_recipes_by_cuisine

Search for recipes filtered by cuisine type and optional ingredients.

**Parameters:**
- `cuisine` (string, required): Cuisine type
  - `italian`, `asian`, `mexican`, `american`, `indian`, `mediterranean`, `thai`, `chinese`, `japanese`, `french`
- `ingredients` (array, optional): Filter by specific ingredients
- `number` (number, optional): Number of recipes to return (default: 10)

**Returns:**
```json
{
  "success": true,
  "data": {
    "recipes": [
      {
        "id": 123456,
        "title": "Pad Thai",
        "image": "https://..."
      }
    ],
    "count": 5,
    "cuisine": "thai"
  }
}
```

**Use Cases:**
- "Show me Thai recipes"
- "Find Italian recipes with tomato and basil"
- "What Mexican dishes can I make?"
- "Suggest some Indian recipes"

### 4. get_recipe_nutrition

Get detailed nutritional information for a recipe including calories, macronutrients, and micronutrients.

**Parameters:**
- `recipe_id` (number, required): The unique recipe identifier

**Returns:**
```json
{
  "success": true,
  "data": {
    "calories": 450,
    "carbs": "45g",
    "fat": "15g",
    "protein": "35g",
    "nutrients": [
      { "name": "Vitamin A", "amount": "500 IU" },
      { "name": "Calcium", "amount": "200 mg" }
    ]
  }
}
```

**Use Cases:**
- "What's the nutritional info for this recipe?"
- "How many calories in this dish?"
- "Show me the macronutrients"

## Integration with FoodBridge

### Agent Tool Mapping

The recipe service integrates seamlessly with the FoodBridge agent:

```typescript
// In mcpExecutor.ts, add recipe tool handlers:
private async mcpSearchRecipes(args: Record<string, any>): Promise<ToolResult> {
  return this.executeMCPTool("search_recipes", args);
}

private async mcpGetRecipeDetails(args: Record<string, any>): Promise<ToolResult> {
  return this.executeMCPTool("get_recipe_details", args);
}
```

### Workflow Example

**User:** "I have chicken, rice, and tomato. What can I cook?"

**Agent Process:**
1. Calls `search_recipes` with:
   - `ingredients: ["chicken", "rice", "tomato"]`
   - `ranking: "maximize"`
2. Receives list of recipes ranked by ingredient match
3. Calls `get_recipe_details` for top 2-3 recipes
4. Presents options with cooking time and instructions

### Pantry Integration

Combine recipe service with pantry data:

```typescript
// Get user's pantry items
const pantryItems = await apiGetFrequentItems();

// Search recipes using pantry items
const recipes = await mcpSearchRecipes({
  ingredients: pantryItems.map(item => item.name),
  diet: userPreferences.diet,
  intolerances: userPreferences.intolerances
});
```

## Usage Examples

### Example 1: Quick Recipe Discovery

**User:** "What can I make with these pantry items?"

**Agent Flow:**
```
1. Retrieve user's pantry inventory
2. Call search_recipes with pantry ingredients
3. Filter by user's dietary preferences
4. Return top 5 recipes with images
5. Offer to show full recipe details
```

### Example 2: Dietary-Specific Recipes

**User:** "Show me vegetarian recipes using my pantry items"

**Agent Flow:**
```
1. Get pantry items
2. Call search_recipes with:
   - ingredients: pantry items
   - diet: "vegetarian"
3. Return vegetarian recipes
4. Suggest recipes with highest ingredient match
```

### Example 3: Cuisine Exploration

**User:** "I want to try Thai food. What can I make?"

**Agent Flow:**
```
1. Call search_recipes_by_cuisine with:
   - cuisine: "thai"
   - ingredients: user's pantry items (optional)
2. Return Thai recipes
3. Offer to show details for selected recipe
```

### Example 4: Nutritional Awareness

**User:** "Show me high-protein recipes I can make"

**Agent Flow:**
```
1. Search recipes with pantry ingredients
2. For each recipe, call get_recipe_nutrition
3. Filter by protein content
4. Return sorted by protein amount
```

## Performance Considerations

### API Rate Limiting

Spoonacular free tier: 500 requests/day

**Optimization strategies:**
- Cache recipe details for 24 hours
- Batch ingredient searches
- Limit results per query
- Implement request queuing

### Response Caching

```typescript
// Cache recipe details
const recipeCache = new Map<number, RecipeDetails>();

async function getRecipeDetails(id: number) {
  if (recipeCache.has(id)) {
    return recipeCache.get(id);
  }
  const details = await fetchRecipeDetails(id);
  recipeCache.set(id, details);
  return details;
}
```

### Pagination

Use `number` parameter to limit results:
- Default: 10 recipes
- Maximum: 20 recipes
- Reduces API calls and response time

## Security Considerations

### API Key Management

- Store API key in environment variables only
- Never commit `.env` to version control
- Rotate keys periodically
- Use separate keys for development/production

### Input Validation

All parameters are validated:
- Ingredient names: string array
- Recipe IDs: positive integers
- Cuisine types: enum validation
- Diet types: enum validation

### Error Handling

```typescript
// Graceful error handling
if (!response.ok) {
  return {
    success: false,
    error: `Recipe API error: ${response.statusText}`
  };
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install @modelcontextprotocol/sdk
```

### 2. Get Spoonacular API Key

1. Visit https://spoonacular.com/food-api
2. Sign up for free account
3. Copy API key

### 3. Configure Environment

Update `.env`:
```env
SPOONACULAR_API_KEY=your_key_here
NODE_ENV=development
```

### 4. Update MCP Configuration

Edit `.kiro/settings/mcp.json`:
```json
{
  "mcpServers": {
    "foodbridge-recipes": {
      "command": "node",
      "args": ["backend/src/mcp/recipe-server.js"],
      "env": {
        "SPOONACULAR_API_KEY": "your_key_here"
      },
      "disabled": false,
      "autoApprove": [
        "search_recipes",
        "get_recipe_details",
        "search_recipes_by_cuisine",
        "get_recipe_nutrition"
      ]
    }
  }
}
```

### 5. Restart MCP Server

- Open command palette: `Cmd+Shift+P`
- Search: "MCP"
- Select: "Reconnect MCP Servers"

## Testing the Recipe Service

### Manual Testing in Kiro

1. Open MCP Server panel
2. Select "foodbridge-recipes" server
3. Click on a tool to test
4. Enter test parameters
5. View results

### Test Cases

**Test 1: Search Recipes**
```json
{
  "ingredients": ["chicken", "rice", "tomato"],
  "number": 5,
  "ranking": "maximize"
}
```

**Test 2: Get Recipe Details**
```json
{
  "recipe_id": 123456,
  "include_nutrition": true
}
```

**Test 3: Search by Cuisine**
```json
{
  "cuisine": "thai",
  "ingredients": ["chicken"],
  "number": 10
}
```

**Test 4: Get Nutrition**
```json
{
  "recipe_id": 123456
}
```

## Troubleshooting

### Issue: "Invalid API Key"

**Solution:**
1. Verify API key in `.env`
2. Check key is from Spoonacular
3. Ensure key is not expired
4. Restart MCP server

### Issue: "Rate limit exceeded"

**Solution:**
1. Implement caching
2. Reduce number of requests
3. Upgrade to paid Spoonacular plan
4. Implement request queuing

### Issue: "Recipe not found"

**Solution:**
1. Verify recipe ID is correct
2. Check recipe still exists on Spoonacular
3. Try searching for similar recipes
4. Use different ingredients

### Issue: "No recipes found"

**Solution:**
1. Try different ingredients
2. Remove dietary restrictions
3. Increase `number` parameter
4. Try different cuisine type

## Future Enhancements

### Planned Features
- [ ] Recipe caching with Redis
- [ ] User recipe ratings and reviews
- [ ] Meal planning integration
- [ ] Shopping list generation
- [ ] Cooking time optimization
- [ ] Cost estimation
- [ ] Allergen warnings
- [ ] Recipe difficulty levels
- [ ] Video cooking tutorials
- [ ] Ingredient substitution suggestions

### API Alternatives

If Spoonacular limits are reached:
- **TheMealDB**: Free, no API key required
- **Edamam**: Comprehensive nutrition data
- **RecipeAPI**: Open source alternative
- **Tasty API**: Popular recipes

## Integration Checklist

- [ ] Install MCP SDK dependencies
- [ ] Create recipe-server.js
- [ ] Get Spoonacular API key
- [ ] Update .env with API key
- [ ] Update .kiro/settings/mcp.json
- [ ] Restart MCP server
- [ ] Test recipe tools in Kiro
- [ ] Update agent prompts to mention recipes
- [ ] Add recipe tools to mcpExecutor.ts
- [ ] Test end-to-end workflow

## Support

For issues or questions:
1. Check this documentation
2. Verify API key is valid
3. Check Spoonacular API status
4. Review MCP server logs
5. Test tools individually in Kiro

---

**Recipe Service Status:** Ready for Integration
**Last Updated:** March 11, 2026
**Version:** 1.0.0
**API Provider:** Spoonacular
**Free Tier Limit:** 500 requests/day
