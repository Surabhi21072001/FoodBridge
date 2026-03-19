# Recipe Service Quick Setup Guide

## 5-Minute Setup

### Step 1: Get API Key (2 minutes)

1. Go to https://spoonacular.com/food-api
2. Click "Sign Up"
3. Create free account
4. Copy API key from dashboard

### Step 2: Configure Environment (1 minute)

Add to `backend/.env`:
```env
SPOONACULAR_API_KEY=your_api_key_here
```

### Step 3: Update MCP Config (1 minute)

Edit `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "foodbridge-db": {
      "command": "node",
      "args": ["backend/src/mcp/server.js"],
      "env": {
        "NODE_ENV": "development",
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "foodbridge",
        "DB_USER": "surabhi"
      },
      "disabled": false,
      "autoApprove": [
        "query_available_food",
        "check_pantry_availability",
        "get_dining_deals",
        "get_food_listings",
        "get_pantry_slots"
      ]
    },
    "foodbridge-recipes": {
      "command": "node",
      "args": ["backend/src/mcp/recipe-server.js"],
      "env": {
        "SPOONACULAR_API_KEY": "your_api_key_here",
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

### Step 4: Restart MCP Server (1 minute)

1. Press `Cmd+Shift+P`
2. Type "MCP"
3. Select "Reconnect MCP Servers"

## Verify Installation

### Test in Kiro

1. Open MCP Server panel
2. Select "foodbridge-recipes"
3. Click "search_recipes"
4. Enter test parameters:
   ```json
   {
     "ingredients": ["chicken", "rice"],
     "number": 5
   }
   ```
5. Should return recipes

## Available Tools

| Tool | Purpose |
|------|---------|
| `search_recipes` | Find recipes by ingredients |
| `get_recipe_details` | Get full recipe with instructions |
| `search_recipes_by_cuisine` | Find recipes by cuisine type |
| `get_recipe_nutrition` | Get nutritional information |

## Common Use Cases

### "What can I make with these ingredients?"
```json
{
  "ingredients": ["chicken", "rice", "tomato"],
  "ranking": "maximize"
}
```

### "Show me vegetarian recipes"
```json
{
  "ingredients": ["rice", "beans"],
  "diet": "vegetarian"
}
```

### "Find Thai recipes"
```json
{
  "cuisine": "thai",
  "number": 10
}
```

### "Get recipe details"
```json
{
  "recipe_id": 123456
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid API Key" | Check `.env` file, verify key from Spoonacular |
| "Rate limit exceeded" | Free tier: 500/day. Upgrade or wait 24h |
| "No recipes found" | Try different ingredients or remove filters |
| "Connection refused" | Restart MCP server with `Cmd+Shift+P` → MCP |

## Next Steps

1. ✅ Recipe service configured
2. Add recipe tools to agent prompts
3. Integrate with pantry system
4. Test end-to-end workflows
5. Deploy to production

## Files Created

- `backend/src/mcp/recipe-server.js` - MCP server implementation
- `backend/src/mcp/recipe-server.ts` - TypeScript version
- `backend/MCP_RECIPE_SERVICE.md` - Full documentation
- `.kiro/settings/mcp.json` - Updated configuration

## API Limits

**Free Tier:**
- 500 requests per day
- All recipe endpoints available
- No credit card required

**Upgrade Options:**
- Starter: $5/month (5,000 requests/day)
- Professional: $15/month (50,000 requests/day)

## Support

- Full documentation: `backend/MCP_RECIPE_SERVICE.md`
- Spoonacular docs: https://spoonacular.com/food-api
- MCP configuration: `.kiro/settings/mcp.json`
