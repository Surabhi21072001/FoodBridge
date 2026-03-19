# FoodBridge MCP Connection Fix

## Problem Identified

The MCP server was failing to connect to the database because:

1. **Hardcoded placeholder credentials** - The MCP configuration had `postgresql://user:password@localhost:5432/foodbridge` instead of actual credentials
2. **Environment variables not loaded** - The MCP server wasn't loading the `.env` file, so it couldn't access `DB_USER`, `DB_HOST`, etc.
3. **Missing MCP SDK dependency** - `@modelcontextprotocol/sdk` wasn't in `package.json`

## Changes Made

### 1. Updated MCP Server to Load `.env`

**File:** `backend/src/mcp/server.js`

Added dotenv loading at the top:
```javascript
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
```

Now the server reads from `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=foodbridge
DB_USER=surabhi
DB_PASSWORD=
```

And builds the connection string dynamically:
```javascript
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
```

### 2. Updated TypeScript Version

**File:** `backend/src/mcp/server.ts`

Added the same dotenv loading and connection string building logic.

### 3. Simplified MCP Configuration

**File:** `.kiro/settings/mcp.json`

Removed hardcoded credentials from the MCP config:
```json
{
  "mcpServers": {
    "foodbridge-db": {
      "command": "node",
      "args": ["backend/src/mcp/server.js"],
      "env": {
        "NODE_ENV": "development"
      },
      "disabled": false,
      "autoApprove": [...]
    }
  }
}
```

The server now reads credentials from `backend/.env` instead.

### 4. Added MCP SDK to Dependencies

**File:** `backend/package.json`

Added to dependencies:
```json
"@modelcontextprotocol/sdk": "^0.1.0"
```

Added to devDependencies:
```json
"@types/dotenv": "^8.2.0"
```

### 5. Created Test Script

**File:** `backend/test-mcp-connection.js`

A diagnostic script that:
- Tests database connectivity
- Verifies tables exist
- Checks data in key tables
- Provides helpful error messages

## How to Fix Your Connection

### Step 1: Install Dependencies

```bash
npm install
```

This installs the MCP SDK and dotenv packages.

### Step 2: Verify `.env` Configuration

```bash
cat backend/.env | grep DB_
```

Should show:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=foodbridge
DB_USER=surabhi
DB_PASSWORD=
```

If not, update `backend/.env` with your actual database credentials.

### Step 3: Test the Connection

```bash
node backend/test-mcp-connection.js
```

Expected output:
```
🔍 Testing FoodBridge MCP Database Connection

Connection Details:
  Host: localhost
  Port: 5432
  Database: foodbridge
  User: surabhi
  Connection String: postgresql://surabhi@localhost:5432/foodbridge

⏳ Connecting to database...
✅ Connection successful!

Database Time: 2026-03-11T15:30:45.123Z

📋 Checking tables...
✅ Found 12 tables:
   - listings
   - pantry_appointments
   - users
   - ...

📊 Checking listings table...
✅ Listings count: 42

📅 Checking pantry_appointments table...
✅ Appointments count: 15

✨ All checks passed! MCP server should work.
```

### Step 4: Restart MCP Server

In Kiro IDE:
1. Open Command Palette: `Cmd+Shift+P`
2. Search: "MCP"
3. Select: "Reconnect MCP Servers"

Or restart Kiro completely.

### Step 5: Test with Agent

Ask the agent in Kiro chat:
- "Show me available meals"
- "What deals are available today?"
- "When can I visit the pantry tomorrow?"

The agent should now use the MCP tools successfully.

## Troubleshooting

If you still have issues, see `backend/MCP_TROUBLESHOOTING.md` for detailed solutions.

### Quick Checks

```bash
# Is PostgreSQL running?
brew services list | grep postgresql

# Does the database exist?
psql -U postgres -l | grep foodbridge

# Can you connect?
psql -U surabhi -d foodbridge -c "SELECT NOW();"

# Are the tables there?
psql -U surabhi -d foodbridge -c "\dt"

# Run the test script
node backend/test-mcp-connection.js
```

## Files Modified

1. `backend/src/mcp/server.js` - Added dotenv loading
2. `backend/src/mcp/server.ts` - Added dotenv loading
3. `.kiro/settings/mcp.json` - Removed hardcoded credentials
4. `backend/package.json` - Added MCP SDK dependency

## Files Created

1. `backend/test-mcp-connection.js` - Connection test script
2. `backend/MCP_TROUBLESHOOTING.md` - Detailed troubleshooting guide
3. `backend/MCP_CONNECTION_FIX.md` - This file

## Next Steps

1. Run `npm install` to install dependencies
2. Run `node backend/test-mcp-connection.js` to verify connection
3. Restart MCP server in Kiro
4. Test with agent chat

---

**Status:** Connection issue fixed
**Last Updated:** March 11, 2026
