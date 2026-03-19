#!/usr/bin/env node

/**
 * Test MCP Database Connection
 * Verifies the foodbridge-db MCP server can connect to PostgreSQL
 */

require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const pg = require("pg");

// Build connection string from env variables
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

console.log("🔍 Testing FoodBridge MCP Database Connection\n");
console.log("Connection Details:");
console.log(`  Host: ${process.env.DB_HOST || "localhost"}`);
console.log(`  Port: ${process.env.DB_PORT || "5432"}`);
console.log(`  Database: ${process.env.DB_NAME || "foodbridge"}`);
console.log(`  User: ${process.env.DB_USER || "postgres"}`);
console.log(`  Connection String: ${connectionString}\n`);

const pool = new pg.Pool({
  connectionString,
});

async function testConnection() {
  try {
    console.log("⏳ Connecting to database...");
    const result = await pool.query("SELECT NOW() as current_time");
    console.log("✅ Connection successful!\n");
    console.log("Database Time:", result.rows[0].current_time);

    // Test table existence
    console.log("\n📋 Checking tables...");
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tables.rows.length === 0) {
      console.log("⚠️  No tables found. Run migrations first:");
      console.log("   npm run migrate");
    } else {
      console.log(`✅ Found ${tables.rows.length} tables:`);
      tables.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`);
      });
    }

    // Test listings table
    console.log("\n📊 Checking food_listings table...");
    const listings = await pool.query("SELECT COUNT(*) as count FROM food_listings");
    console.log(`✅ Food listings count: ${listings.rows[0].count}`);

    // Test pantry_appointments table
    console.log("\n📅 Checking pantry_appointments table...");
    const appointments = await pool.query(
      "SELECT COUNT(*) as count FROM pantry_appointments"
    );
    console.log(`✅ Pantry appointments count: ${appointments.rows[0].count}`);

    console.log("\n✨ All checks passed! MCP server should work.\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Connection failed!\n");
    console.error("Error:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error("\n💡 PostgreSQL is not running. Start it with:");
      console.error("   brew services start postgresql");
    } else if (error.code === "3D000") {
      console.error("\n💡 Database does not exist. Create it with:");
      console.error("   psql -U postgres -c 'CREATE DATABASE foodbridge;'");
    } else if (error.code === "28P01") {
      console.error("\n💡 Authentication failed. Check DB_USER and DB_PASSWORD.");
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
