# FoodBridge MCP Troubleshooting Guide

## Connection Issues

### Problem: "Cannot connect to database"

**Symptoms:**
- MCP server fails to start
- Error: `ECONNREFUSED` or `connect ECONNREFUSED`
- Error: `Invalid URL`

**Root Causes:**
1. PostgreSQL is not running
2. Database credentials are incorrect
3. Database doesn't exist
4. `.env` file not loaded properly

**Solutions:**

**Step 1: Verify PostgreSQL is Running**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# If not running, start it
brew services start postgresql

# Or manually start
postgres -D /usr/local/var/postgres
```

**Step 2: Verify Database Exists**
```bash
# List all databases
psql -U postgres -l

# If foodbridge doesn't exist, create it
psql -U postgres -c "CREATE DATABASE foodbridge;"
```

**Step 3: Verify Credentials in `.env`**
```bash
# Check backend/.env
cat backend/.env | grep DB_

# Should show:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=foodbridge
# DB_USER=surabhi
# DB_PASSWORD=
```

**Step 4: Test Connection Manually**
```bash
# Test with psql
psql -U surabhi -h localhost -d foodbridge -c "SELECT NOW();"

# Or use the test script
node backend/test-mcp-connection.js
```

### Problem: "Invalid URL"

**Symptoms:**
- Error: `Invalid URL` when connecting
- Connection string is malformed

**Root Cause:**
Environment variables not being loaded, resulting in `undefined` values in connection string.

**Solution:**
```bash
# Ensure .env file exists and has correct format
cat backend/.env

# Reinstall dependencies
npm install

# Restart MCP server
# In Kiro: Cmd+Shift+P → "Reconnect MCP Servers"
```

### Problem: "Authentication failed"

**Symptoms:**
- Error: `FATAL: password authentication failed`
- Error code: `28P01`

**Root Cause:**
Database user credentials are incorrect.

**Solution:**
```bash
# Check current PostgreSQL user
psql -U postgres -c "SELECT usename FROM pg_user;"

# If surabhi user doesn't exist, create it
psql -U postgres -c "CREATE USER surabhi WITH CREATEDB;"

# Or update .env to use postgres user
# DB_USER=postgres
# DB_PASSWORD=your_password
```

### Problem: "Database does not exist"

**Symptoms:**
- Error: `FATAL: database "foodbridge" does not exist`
- Error code: `3D000`

**Root Cause:**
The foodbridge database hasn't been created.

**Solution:**
```bash
# Create the database
psql -U postgres -c "CREATE DATABASE foodbridge;"

# Verify it was created
psql -U postgres -l | grep foodbridge

# Run migrations to create tables
npm run migrate
```

## MCP Server Issues

### Problem: "MCP server not found"

**Symptoms:**
- Kiro can't find the foodbridge-db server
- Error in MCP panel

**Root Causes:**
1. `.kiro/settings/mcp.json` is invalid JSON
2. MCP dependencies not installed
3. Server file doesn't exist

**Solutions:**

**Step 1: Validate MCP Configuration**
```bash
# Check if JSON is valid
cat .kiro/settings/mcp.json | jq .

# Should output the JSON structure without errors
```

**Step 2: Verify Dependencies**
```bash
# Check if MCP SDK is installed
npm list @modelcontextprotocol/sdk

# If not installed
npm install @modelcontextprotocol/sdk
```

**Step 3: Verify Server File**
```bash
# Check if server file exists
ls -la backend/src/mcp/server.js

# If not, rebuild from TypeScript
npm run build
```

### Problem: "Tool execution failed"

**Symptoms:**
- Tool runs but returns error
- Error: `Unknown tool` or `Query failed`

**Root Causes:**
1. Database tables don't exist
2. Query syntax error
3. Missing data in database

**Solutions:**

**Step 1: Verify Tables Exist**
```bash
# List all tables
psql -U surabhi -d foodbridge -c "\dt"

# Should show: listings, pantry_appointments, users, etc.
```

**Step 2: Run Migrations**
```bash
# If tables don't exist, run migrations
npm run migrate

# Seed sample data
npm run seed
```

**Step 3: Check Database Data**
```bash
# Check listings table
psql -U surabhi -d foodbridge -c "SELECT COUNT(*) FROM listings;"

# Check pantry_appointments table
psql -U surabhi -d foodbridge -c "SELECT COUNT(*) FROM pantry_appointments;"

# If empty, seed data
npm run seed
```

## Performance Issues

### Problem: "Queries are slow"

**Symptoms:**
- Tool execution takes > 5 seconds
- Database queries are timing out

**Root Causes:**
1. Missing database indexes
2. Large result sets without pagination
3. Connection pool exhausted

**Solutions:**

**Step 1: Add Database Indexes**
```bash
# Connect to database
psql -U surabhi -d foodbridge

# Create indexes
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_dietary_tags ON listings USING GIN(dietary_tags);
CREATE INDEX idx_pantry_appointments_date ON pantry_appointments(DATE(appointment_time));
CREATE INDEX idx_pantry_appointments_status ON pantry_appointments(status);

# Verify indexes were created
\d listings
```

**Step 2: Use Pagination**
- Always use `limit` and `offset` parameters
- Default limit is 20 results
- For large datasets, use smaller limits

**Step 3: Monitor Connection Pool**
```bash
# Check active connections
psql -U postgres -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"
```

## Testing & Verification

### Test the MCP Server

**Option 1: Using Test Script**
```bash
# Run the connection test
node backend/test-mcp-connection.js

# Should output:
# ✅ Connection successful!
# ✅ Found X tables
# ✅ Listings count: X
# ✅ Appointments count: X
```

**Option 2: Using Kiro MCP Panel**
1. Open MCP Server panel in Kiro
2. Select "foodbridge-db" server
3. Click on a tool (e.g., "query_available_food")
4. Enter test parameters:
   ```json
   {
     "limit": 5
   }
   ```
5. Click "Execute"
6. Should return results or empty array

**Option 3: Using psql**
```bash
# Connect to database
psql -U surabhi -d foodbridge

# Test a query
SELECT COUNT(*) FROM listings WHERE status = 'active';

# Test pantry slots
SELECT * FROM pantry_appointments LIMIT 5;
```

### Verify All Components

**Checklist:**
- [ ] PostgreSQL is running: `brew services list | grep postgresql`
- [ ] Database exists: `psql -U postgres -l | grep foodbridge`
- [ ] Tables exist: `psql -U surabhi -d foodbridge -c "\dt"`
- [ ] MCP dependencies installed: `npm list @modelcontextprotocol/sdk`
- [ ] `.env` file configured: `cat backend/.env | grep DB_`
- [ ] MCP configuration valid: `cat .kiro/settings/mcp.json | jq .`
- [ ] Server file exists: `ls backend/src/mcp/server.js`
- [ ] Test script passes: `node backend/test-mcp-connection.js`

## Common Error Messages

### "ECONNREFUSED"
PostgreSQL is not running. Start it with: `brew services start postgresql`

### "FATAL: database does not exist"
Create the database: `psql -U postgres -c "CREATE DATABASE foodbridge;"`

### "FATAL: password authentication failed"
Check credentials in `.env` or create the user: `psql -U postgres -c "CREATE USER surabhi WITH CREATEDB;"`

### "Invalid URL"
Environment variables not loaded. Check `.env` file and restart MCP server.

### "Cannot find module '@modelcontextprotocol/sdk'"
Install dependencies: `npm install @modelcontextprotocol/sdk`

### "ENOENT: no such file or directory"
Server file not found. Rebuild: `npm run build`

## Getting Help

1. **Check this guide first** - Most issues are covered above
2. **Run test script** - `node backend/test-mcp-connection.js`
3. **Check logs** - Look for error messages in Kiro console
4. **Verify configuration** - Check `.env` and `.kiro/settings/mcp.json`
5. **Test database** - Use psql to verify connectivity
6. **Restart everything** - Sometimes a fresh start helps

## Quick Fixes

```bash
# Fix 1: Restart PostgreSQL
brew services restart postgresql

# Fix 2: Reinstall dependencies
npm install

# Fix 3: Rebuild TypeScript
npm run build

# Fix 4: Restart MCP server
# In Kiro: Cmd+Shift+P → "Reconnect MCP Servers"

# Fix 5: Reset everything
brew services stop postgresql
brew services start postgresql
npm install
npm run build
npm run migrate
npm run seed
```

---

**Last Updated:** March 11, 2026
**Version:** 1.0.0
