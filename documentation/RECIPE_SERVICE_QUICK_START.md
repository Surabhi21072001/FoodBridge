# Recipe Service - Quick Start (30 seconds)

## ✅ Status: Ready to Use

The recipe service is deployed and working. Just restart MCP servers.

## 3 Steps to Activate

### 1. Restart MCP Servers (10 seconds)
```
Cmd+Shift+P → Type "MCP" → Select "Reconnect MCP Servers"
```

### 2. Wait for Connection (5 seconds)
- Open MCP Server panel
- Look for "foodbridge-recipes"
- Wait for green "connected" status

### 3. Test with Agent (15 seconds)
Ask the agent:
```
"What can I make with chicken and rice?"
```

## What You Get

✅ Recipe search by ingredients
✅ Recipe details with instructions
✅ Cuisine-based discovery
✅ Nutritional information
✅ Dietary preference filtering

## Example Queries

- "What can I make with chicken and rice?"
- "Show me vegetarian recipes"
- "Find Thai recipes"
- "Get recipe details for #123456"
- "What's the nutritional info?"

## If It Doesn't Work

1. Run test: `node backend/test-recipe-server.js`
2. Check config: `.kiro/settings/mcp.json`
3. Restart Kiro completely
4. Reconnect MCP servers

## Files

- Server: `backend/src/mcp/recipe-server.js`
- Config: `.kiro/settings/mcp.json`
- Tests: `node backend/test-recipe-server.js`
- Docs: `backend/MCP_RECIPE_SERVICE.md`

## API Limits

- 500 requests/day (free tier)
- Upgrade: $5/month for 5,000/day

---

**Status:** ✅ Ready
**Next:** Restart MCP Servers
