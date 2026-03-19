# Recipe Service - Final Setup Instructions

## ✅ Installation Complete

The MCP SDK has been installed. Follow these steps to get the recipe service working:

## Step-by-Step Setup

### Step 1: Verify Installation (1 minute)

Run this command to confirm the MCP SDK is installed:

```bash
npm list --prefix backend @modelcontextprotocol/sdk
```

You should see:
```
foodbridge-backend@1.0.0
└── @modelcontextprotocol/sdk@1.27.1
```

### Step 2: Restart MCP Servers (2 minutes)

1. In Kiro, press `Cmd+Shift+P`
2. Type "MCP"
3. Select "Reconnect MCP Servers"
4. Wait 5-10 seconds for servers to reconnect

### Step 3: Verify Connection (1 minute)

1. Open the MCP Server panel in Kiro
2. Look for "foodbridge-recipes" server
3. Status should show as "connected" (green dot)
4. You should see 4 tools listed:
   - search_recipes
   - get_recipe_details
   - search_recipes_by_cuisine
   - get_recipe_nutrition

### Step 4: Test the Service (2 minutes)

Run the test suite:

```bash
node backend/test-recipe-server.js
```

Expected output:
```
✅ All tests passed! Recipe service is ready.
```

### Step 5: Test with Agent (2 minutes)

Ask the agent a recipe question:
- "What can I make with chicken and rice?"
- "Show me Thai recipes"
- "Get recipe details for #123456"

## What's Ready

✅ **MCP Server:** Installed and configured
✅ **API Key:** Set up with Spoonacular
✅ **Agent Integration:** Complete
✅ **Tools:** 4 recipe tools available
✅ **Documentation:** Complete

## Files Installed

### Dependencies
- `@modelcontextprotocol/sdk@1.27.1` - MCP protocol

### Server Files
- `backend/src/mcp/recipe-server.js` - Main server
- `backend/src/mcp/recipe-server.ts` - TypeScript version

### Configuration
- `.kiro/settings/mcp.json` - MCP server config
- `backend/package.json` - Updated with MCP SDK

### Documentation
- `backend/MCP_RECIPE_SERVICE.md` - Full documentation
- `backend/RECIPE_SERVICE_SETUP.md` - Quick setup
- `backend/RECIPE_SERVICE_AGENT_INTEGRATION.md` - Integration guide
- `backend/RECIPE_SERVICE_VERIFICATION.md` - Verification guide
- `backend/RECIPE_SERVICE_TROUBLESHOOTING.md` - Troubleshooting
- `backend/RECIPE_SERVICE_READY.md` - Status report
- `backend/test-recipe-server.js` - Test suite

## Troubleshooting

### If connection still fails:

1. **Check installation:**
   ```bash
   npm list --prefix backend @modelcontextprotocol/sdk
   ```

2. **Run tests:**
   ```bash
   node backend/test-recipe-server.js
   ```

3. **Restart Kiro:**
   - Close Kiro completely
   - Reopen Kiro
   - Reconnect MCP servers

4. **Check configuration:**
   - Open `.kiro/settings/mcp.json`
   - Verify API key is present
   - Verify file path is correct

### Common Issues

| Issue | Solution |
|-------|----------|
| "Module not found" | Run `npm install --prefix backend` |
| "Connection failed" | Restart MCP servers |
| "Invalid API key" | Check `.kiro/settings/mcp.json` |
| "Recipe API error" | This is normal - fallback works |

## API Limits

**Free Tier (Current):**
- 500 requests per day
- All recipe endpoints
- No credit card required

**Monitor Usage:**
- Check Spoonacular dashboard
- Upgrade if needed ($5/month for 5,000 requests/day)

## Next Steps

1. ✅ Installation complete
2. Restart MCP servers
3. Verify connection in MCP panel
4. Test with agent
5. Monitor API usage

## Support

- Full docs: `backend/MCP_RECIPE_SERVICE.md`
- Troubleshooting: `backend/RECIPE_SERVICE_TROUBLESHOOTING.md`
- Test suite: `node backend/test-recipe-server.js`
- Spoonacular: https://spoonacular.com/food-api

---

**Status:** ✅ Ready to Use
**Last Updated:** March 11, 2026
**Next Action:** Restart MCP Servers
