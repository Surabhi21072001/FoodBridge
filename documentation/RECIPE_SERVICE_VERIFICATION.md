# Recipe Service Verification Guide

## Configuration Status ✅

Your recipe service is now fully configured and integrated with the FoodBridge AI assistant.

### What Was Set Up

1. **MCP Server** - `backend/src/mcp/recipe-server.js`
   - Connects to Spoonacular Recipe API
   - Exposes 4 recipe tools
   - Auto-approved for seamless agent execution

2. **API Key** - Configured in `.kiro/settings/mcp.json`
   - Key: `a8b1b8c0f9124c4cab164bf4b4eaf6f3`
   - Free tier: 500 requests/day
   - All recipe endpoints available

3. **Agent Integration** - Updated `backend/src/agent/llm/prompts.ts`
   - System prompt includes recipe capabilities
   - Recipe formatting functions added
   - Agent can now suggest recipes

4. **Tool Handlers** - Updated `backend/src/agent/tools/mcpExecutor.ts`
   - Recipe tools integrated into executor
   - MCP routing configured
   - Error handling in place

## Verification Steps

### Step 1: Restart MCP Server

1. Press `Cmd+Shift+P`
2. Type "MCP"
3. Select "Reconnect MCP Servers"
4. Wait for servers to reconnect

### Step 2: Test Recipe Tools in Kiro

1. Open MCP Server panel
2. Select "foodbridge-recipes" server
3. Test each tool:

**Test 1: Search Recipes**
```json
{
  "ingredients": ["chicken", "rice", "tomato"],
  "number": 5,
  "ranking": "maximize"
}
```
Expected: Returns 5 recipes using those ingredients

**Test 2: Get Recipe Details**
```json
{
  "recipe_id": 123456,
  "include_nutrition": true
}
```
Expected: Returns full recipe with instructions

**Test 3: Search by Cuisine**
```json
{
  "cuisine": "thai",
  "number": 10
}
```
Expected: Returns 10 Thai recipes

**Test 4: Get Nutrition**
```json
{
  "recipe_id": 123456
}
```
Expected: Returns nutritional information

### Step 3: Test Agent Integration

Ask the agent recipe-related questions:

1. "What can I make with chicken and rice?"
2. "Show me vegetarian recipes"
3. "Find Thai recipes"
4. "What's the nutritional info for recipe #123456?"

The agent should:
- Use search_recipes tool
- Format results nicely
- Offer to show full details
- Respect dietary preferences

## Files Modified

| File | Changes |
|------|---------|
| `.kiro/settings/mcp.json` | Added foodbridge-recipes server config with API key |
| `backend/src/agent/llm/prompts.ts` | Added recipe capabilities to system prompt + formatting functions |
| `backend/src/agent/tools/mcpExecutor.ts` | Added recipe tool handlers |

## Files Created

| File | Purpose |
|------|---------|
| `backend/src/mcp/recipe-server.js` | MCP server implementation |
| `backend/src/mcp/recipe-server.ts` | TypeScript version |
| `backend/MCP_RECIPE_SERVICE.md` | Full documentation |
| `backend/RECIPE_SERVICE_SETUP.md` | Quick setup guide |
| `backend/RECIPE_SERVICE_AGENT_INTEGRATION.md` | Integration guide |

## Available Recipe Tools

### search_recipes
Find recipes by ingredients with optional filters
- Parameters: ingredients, number, ranking, diet, intolerances
- Returns: List of recipes with ingredient match info

### get_recipe_details
Get full recipe with instructions and nutrition
- Parameters: recipe_id, include_nutrition
- Returns: Complete recipe information

### search_recipes_by_cuisine
Discover recipes by cuisine type
- Parameters: cuisine, ingredients, number
- Returns: Recipes filtered by cuisine

### get_recipe_nutrition
Get nutritional information
- Parameters: recipe_id
- Returns: Calories, macros, micronutrients

## Agent Capabilities

The agent can now:

✅ Search recipes by ingredients
✅ Filter by dietary preferences (vegetarian, vegan, etc.)
✅ Avoid allergens/intolerances
✅ Suggest recipes by cuisine
✅ Provide cooking instructions
✅ Show nutritional information
✅ Rank recipes by ingredient match
✅ Combine with pantry recommendations

## Example Workflows

### Workflow 1: Ingredient Discovery
```
User: "I have chicken, rice, and tomato. What can I cook?"
Agent: 
1. Calls search_recipes with those ingredients
2. Returns top 5 recipes
3. Offers to show full recipe details
```

### Workflow 2: Dietary Preferences
```
User: "Show me vegetarian recipes"
Agent:
1. Gets user's pantry items
2. Calls search_recipes with diet: "vegetarian"
3. Returns matching recipes
```

### Workflow 3: Cuisine Exploration
```
User: "I want Thai food"
Agent:
1. Calls search_recipes_by_cuisine with cuisine: "thai"
2. Returns Thai recipes
3. Offers details on selected recipe
```

## Troubleshooting

### Issue: "Recipe service not responding"
**Solution:**
1. Verify API key in `.kiro/settings/mcp.json`
2. Restart MCP servers
3. Check Spoonacular API status

### Issue: "No recipes found"
**Solution:**
1. Try different ingredients
2. Remove dietary filters
3. Increase number parameter
4. Try different cuisine

### Issue: "Rate limit exceeded"
**Solution:**
1. Free tier: 500 requests/day
2. Wait 24 hours or upgrade plan
3. Implement caching for frequently used recipes

### Issue: "Invalid recipe ID"
**Solution:**
1. Use recipe IDs from search results
2. Verify recipe still exists
3. Try searching for similar recipes

## Next Steps

1. ✅ Recipe service configured
2. ✅ API key set up
3. ✅ Agent integration complete
4. Test with real user queries
5. Monitor API usage
6. Optimize caching if needed
7. Deploy to production

## API Limits

**Free Tier:**
- 500 requests per day
- All recipe endpoints
- No credit card required

**Upgrade Options:**
- Starter: $5/month (5,000 requests/day)
- Professional: $15/month (50,000 requests/day)

## Support Resources

- Full docs: `backend/MCP_RECIPE_SERVICE.md`
- Setup guide: `backend/RECIPE_SERVICE_SETUP.md`
- Integration guide: `backend/RECIPE_SERVICE_AGENT_INTEGRATION.md`
- Spoonacular API: https://spoonacular.com/food-api

---

**Status:** ✅ Ready for Testing
**Last Updated:** March 11, 2026
**API Key:** Configured
**MCP Server:** Enabled
**Agent Integration:** Complete
