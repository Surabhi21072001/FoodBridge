# FoodBridge MCP Setup Guide

Quick start guide for setting up the MCP server for the FoodBridge AI agent.

## Prerequisites

- Node.js 16+ installed
- PostgreSQL database running
- FoodBridge backend dependencies installed

## Step 1: Install MCP Dependencies

```bash
cd backend
npm install @modelcontextprotocol/sdk pg
```

## Step 2: Configure Environment Variables

Update `backend/.env`:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/foodbridge

# Node Environment
NODE_ENV=development
```

Replace with your actual PostgreSQL credentials.

## Step 3: Update MCP Configuration

Edit `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "foodbridge-db": {
      "command": "node",
      "args": ["backend/src/mcp/server.js"],
      "env": {
        "DATABASE_URL": "postgresql://username:password@localhost:5432/foodbridge",
        "NODE_ENV": "development"
      },
      "disabled": false,
      "autoApprove": [
        "query_available_food",
        "check_pantry_availability",
        "get_dining_deals",
        "get_food_listings",
        "get_pantry_slots"
      ]
    }
  }
}
```

## Step 4: Verify Database Connection

Test the database connection:

```bash
# From backend directory
node -e "
const pg = require('pg');
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Connection failed:', err);
  else console.log('Connection successful:', res.rows[0]);
  process.exit(0);
});
" 2>&1
```

## Step 5: Restart MCP Server

In Kiro IDE:
1. Open Command Palette: `Cmd+Shift+P`
2. Search: "MCP"
3. Select: "Reconnect MCP Servers"

Or restart Kiro IDE completely.

## Step 6: Test the MCP Server

### Option A: Using Kiro MCP Panel

1. Open MCP Server panel in Kiro
2. Select "foodbridge-db" server
3. Click on "query_available_food" tool
4. Enter test parameters:
   ```json
   {
     "limit": 5,
     "available_now": true
   }
   ```
5. Click "Execute"
6. View results

### Option B: Using Agent Chat

In Kiro chat, ask the agent:
- "Show me available meals"
- "What deals are available today?"
- "When can I visit the pantry tomorrow?"

The agent will use the MCP tools to query the database.

## Troubleshooting

### Issue: "Cannot connect to database"

**Check:**
1. PostgreSQL is running: `psql -U postgres -c "SELECT 1"`
2. Database exists: `psql -U postgres -l | grep foodbridge`
3. DATABASE_URL is correct in `.env`
4. Credentials are valid

**Fix:**
```bash
# Create database if needed
psql -U postgres -c "CREATE DATABASE foodbridge;"

# Update .env with correct credentials
DATABASE_URL=postgresql://postgres:password@localhost:5432/foodbridge
```

### Issue: "MCP server not found"

**Check:**
1. `.kiro/settings/mcp.json` is valid JSON
2. `backend/src/mcp/server.js` exists
3. MCP dependencies installed: `npm list @modelcontextprotocol/sdk`

**Fix:**
```bash
# Reinstall dependencies
npm install @modelcontextprotocol/sdk pg

# Restart Kiro IDE
```

### Issue: "Tool execution failed"

**Check:**
1. Database has data (run migrations/seeds)
2. Query parameters are valid
3. Database indexes exist

**Fix:**
```bash
# Run database migrations
npm run migrate

# Seed sample data
npm run seed

# Check database tables
psql -U postgres -d foodbridge -c "\dt"
```

### Issue: "Invalid date format"

**Check:**
- Date must be ISO 8601 format: YYYY-MM-DD
- Example: "2026-03-15" ✓
- Invalid: "03/15/2026" ✗

**Fix:**
- Use correct format in tool parameters

## Verification Checklist

- [ ] Node.js 16+ installed
- [ ] PostgreSQL running
- [ ] MCP dependencies installed
- [ ] DATABASE_URL configured in `.env`
- [ ] `.kiro/settings/mcp.json` updated
- [ ] Database connection verified
- [ ] MCP server restarted
- [ ] Test query successful

## Next Steps

1. **Test with Agent:** Ask the agent to find food listings
2. **Monitor Logs:** Check MCP server output for errors
3. **Optimize Queries:** Add database indexes if needed
4. **Scale Up:** Configure connection pooling for production

## Common Commands

```bash
# Check MCP server status
ps aux | grep "node.*mcp/server"

# View MCP server logs
tail -f backend/logs/mcp.log

# Test database connection
psql -U postgres -d foodbridge -c "SELECT COUNT(*) FROM listings;"

# Restart MCP server
# In Kiro: Cmd+Shift+P → "Reconnect MCP Servers"

# View MCP configuration
cat .kiro/settings/mcp.json
```

## Performance Tips

1. **Add Database Indexes:**
   ```sql
   CREATE INDEX idx_listings_status ON listings(status);
   CREATE INDEX idx_listings_category ON listings(category);
   CREATE INDEX idx_listings_dietary_tags ON listings USING GIN(dietary_tags);
   CREATE INDEX idx_pantry_appointments_date ON pantry_appointments(DATE(appointment_time));
   ```

2. **Optimize Connection Pool:**
   - Increase pool size for high concurrency
   - Monitor connection usage
   - Set appropriate timeouts

3. **Cache Frequently Accessed Data:**
   - Consider Redis for deal listings
   - Cache pantry availability
   - Invalidate on updates

## Support

For detailed documentation, see: `backend/MCP_CONFIGURATION.md`

---

**Setup Status:** Ready to Deploy
**Last Updated:** March 11, 2026
