# Recipe Service Troubleshooting Guide

## Issue: "Connection Failed" Error

### Root Cause
The MCP server requires the `@modelcontextprotocol/sdk` package to be installed.

### Solution

#### Step 1: Install Dependencies
```bash
npm install --prefix backend @modelcontextprotocol/sdk@1.27.1
```

#### Step 2: Verify Installation
```bash
npm list --prefix backend @modelcontextprotocol/sdk
```

Expected output:
```
foodbridge-backend@1.0.0 /path/to/backend
└── @modelcontextprotocol/sdk@1.27.1
```

#### Step 3: Restart MCP Server
1. Press `Cmd+Shift+P`
2. Type "MCP"
3. Select "Reconnect MCP Servers"
4. Wait 5-10 seconds for reconnection

#### Step 4: Verify Connection
Check the MCP Server panel - you should see:
- ✅ foodbridge-db (connected)
- ✅ foodbridge-recipes (connected)

## Common Issues & Solutions

### Issue 1: "Module not found: @modelcontextprotocol/sdk"

**Cause:** Package not installed

**Solution:**
```bash
npm install --prefix backend @modelcontextprotocol/sdk@1.27.1
npm install --prefix backend
```

### Issue 2: "ENOENT: no such file or directory"

**Cause:** Recipe server file not found

**Solution:**
1. Verify file exists: `backend/src/mcp/recipe-server.js`
2. Check file permissions: `ls -la backend/src/mcp/recipe-server.js`
3. Ensure path is correct in `.kiro/settings/mcp.json`

### Issue 3: "Invalid API Key"

**Cause:** Spoonacular API key not configured

**Solution:**
1. Check `.kiro/settings/mcp.json`
2. Verify API key: `a8b1b8c0f9124c4cab164bf4b4eaf6f3`
3. Ensure no extra spaces or quotes

### Issue 4: "Connection timeout"

**Cause:** MCP server not starting

**Solution:**
1. Check Node.js version: `node --version` (should be 14+)
2. Verify dependencies: `npm list --prefix backend`
3. Check for port conflicts
4. Restart Kiro IDE

### Issue 5: "Recipe API error: Not Found"

**Cause:** Spoonacular API endpoint issue

**Solution:**
- This is expected - the server automatically falls back to `complexSearch`
- No action needed, recipes will still be found

## Verification Steps

### Step 1: Check Installation
```bash
npm list --prefix backend @modelcontextprotocol/sdk
```

### Step 2: Test Recipe Server
```bash
node backend/test-recipe-server.js
```

Expected output:
```
✅ All tests passed! Recipe service is ready.
```

### Step 3: Check Configuration
```bash
cat .kiro/settings/mcp.json | grep -A 10 foodbridge-recipes
```

Expected output:
```json
"foodbridge-recipes": {
  "command": "node",
  "args": ["backend/src/mcp/recipe-server.js"],
  "env": {
    "SPOONACULAR_API_KEY": "a8b1b8c0f9124c4cab164bf4b4eaf6f3",
    "NODE_ENV": "development"
  },
  "disabled": false,
  "autoApprove": [...]
}
```

### Step 4: Verify MCP Connection
1. Open MCP Server panel in Kiro
2. Look for "foodbridge-recipes" server
3. Status should show "connected" (green dot)
4. Click on server to see available tools

## Quick Fix Checklist

- [ ] Run `npm install --prefix backend @modelcontextprotocol/sdk@1.27.1`
- [ ] Verify API key in `.kiro/settings/mcp.json`
- [ ] Restart MCP servers (`Cmd+Shift+P` → MCP → Reconnect)
- [ ] Wait 5-10 seconds for connection
- [ ] Check MCP Server panel for green status
- [ ] Run `node backend/test-recipe-server.js` to verify

## If Still Not Working

### Debug Steps

1. **Check Node.js version:**
   ```bash
   node --version
   ```
   Should be v14.0.0 or higher

2. **Check npm packages:**
   ```bash
   npm list --prefix backend | grep modelcontextprotocol
   ```

3. **Test recipe server directly:**
   ```bash
   node backend/test-recipe-server.js
   ```

4. **Check MCP configuration:**
   ```bash
   cat .kiro/settings/mcp.json
   ```

5. **Verify file exists:**
   ```bash
   ls -la backend/src/mcp/recipe-server.js
   ```

### Get Help

If issues persist:

1. Check Kiro logs: `View` → `Output` → Select "Kiro" channel
2. Review MCP troubleshooting: `backend/MCP_TROUBLESHOOTING.md`
3. Check Spoonacular status: https://spoonacular.com/food-api
4. Verify internet connection

## Installation Summary

### What Was Installed
- `@modelcontextprotocol/sdk@1.27.1` - MCP protocol implementation
- 40 additional dependencies

### Files Modified
- `backend/package.json` - Added MCP SDK dependency
- `backend/package-lock.json` - Updated lock file

### Files Created
- `backend/src/mcp/recipe-server.js` - MCP server
- `backend/src/mcp/recipe-server.ts` - TypeScript version
- `backend/test-recipe-server.js` - Test suite

## Next Steps

1. ✅ Install MCP SDK
2. ✅ Restart MCP servers
3. ✅ Verify connection
4. Test recipe tools
5. Ask agent recipe questions

## Support Resources

- MCP Documentation: https://modelcontextprotocol.io
- Spoonacular API: https://spoonacular.com/food-api
- Recipe Service Docs: `backend/MCP_RECIPE_SERVICE.md`
- Setup Guide: `backend/RECIPE_SERVICE_SETUP.md`

---

**Last Updated:** March 11, 2026
**Status:** Installation Complete
**Next Action:** Restart MCP Servers
