#!/usr/bin/env node

/**
 * FoodBridge MCP Server
 * Implements Model Context Protocol for database access
 * Exposes tools for querying food listings, pantry slots, and dining deals
 */

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const pg = require("pg");
const readline = require("readline");

const { Pool } = pg;

// Build connection string from environment variables
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

console.error(`[MCP] Connecting to: ${connectionString}`);

// Initialize database connection pool
const pool = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection immediately
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("[MCP] Database connection failed:", err.message);
    process.exit(1);
  } else {
    console.error("[MCP] Database connection successful");
  }
});

// Tool definitions - MCP format
const TOOLS = [
  {
    name: "query_available_food",
    description:
      "Query available food listings from the database with optional filters for dietary preferences, category, and availability",
    inputSchema: {
      type: "object",
      properties: {
        dietary_filters: {
          type: "array",
          items: { type: "string" },
          description: "Dietary tags to filter by (e.g., vegetarian, vegan, gluten-free)",
        },
        category: {
          type: "string",
          enum: ["meal", "snack", "beverage", "pantry_item", "deal", "event_food"],
          description: "Food category to filter by",
        },
        available_now: {
          type: "boolean",
          description: "Only return currently available food",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 20)",
        },
        offset: {
          type: "number",
          description: "Number of results to skip for pagination (default: 0)",
        },
      },
      required: [],
    },
  },
  {
    name: "check_pantry_availability",
    description: "Check available pantry appointment slots for a specific date",
    inputSchema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date to check for available slots (ISO 8601 format, e.g., 2026-03-15)",
        },
        duration_minutes: {
          type: "number",
          description: "Duration of appointment in minutes (default: 30)",
        },
      },
      required: ["date"],
    },
  },
  {
    name: "get_dining_deals",
    description: "Get current dining discounts and special offers",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of deals to return (default: 10)",
        },
        offset: {
          type: "number",
          description: "Number of results to skip for pagination (default: 0)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_food_listings",
    description: "Get detailed food listings with full information including provider details",
    inputSchema: {
      type: "object",
      properties: {
        listing_id: {
          type: "string",
          description: "Specific listing ID to retrieve (optional)",
        },
        provider_id: {
          type: "string",
          description: "Filter by provider ID (optional)",
        },
        status: {
          type: "string",
          enum: ["active", "reserved", "completed", "cancelled", "expired"],
          description: "Filter by listing status",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 20)",
        },
        offset: {
          type: "number",
          description: "Number of results to skip for pagination (default: 0)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_pantry_slots",
    description: "Get available pantry appointment time slots with detailed availability information",
    inputSchema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date to check for available slots (ISO 8601 format)",
        },
        start_time: {
          type: "string",
          description: "Start time for slot search (HH:MM format, default: 09:00)",
        },
        end_time: {
          type: "string",
          description: "End time for slot search (HH:MM format, default: 17:00)",
        },
        duration_minutes: {
          type: "number",
          description: "Duration of appointment in minutes (default: 30)",
        },
      },
      required: ["date"],
    },
  },
];

// Tool implementations
async function queryAvailableFood(params) {
  const {
    dietary_filters = [],
    category = null,
    available_now = false,
    limit = 20,
    offset = 0,
  } = params;

  let query = `
    SELECT 
      id, provider_id, title, description, category, cuisine_type,
      dietary_tags, allergen_info, quantity_available, quantity_reserved,
      unit, original_price, discounted_price, pickup_location,
      available_from, available_until, image_urls, status,
      created_at, updated_at
    FROM food_listings
    WHERE status = 'active'
  `;

  const queryParams = [];
  let paramIndex = 1;

  if (category) {
    query += ` AND category = $${paramIndex}`;
    queryParams.push(category);
    paramIndex++;
  }

  if (dietary_filters.length > 0) {
    query += ` AND dietary_tags && $${paramIndex}`;
    queryParams.push(dietary_filters);
    paramIndex++;
  }

  if (available_now) {
    query += ` AND available_from <= NOW() AND available_until > NOW()`;
  }

  query += ` AND quantity_available > quantity_reserved`;
  query += ` ORDER BY available_until ASC, discounted_price ASC`;
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  queryParams.push(limit, offset);

  const result = await pool.query(query, queryParams);
  return {
    success: true,
    data: result.rows,
    count: result.rows.length,
  };
}

async function checkPantryAvailability(params) {
  const { date, duration_minutes = 30 } = params;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return {
      success: false,
      error: "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)",
    };
  }

  const query = `
    SELECT 
      DATE(appointment_time) as date,
      EXTRACT(HOUR FROM appointment_time) as hour,
      COUNT(*) as booked_slots,
      MAX(duration_minutes) as max_duration
    FROM pantry_appointments
    WHERE DATE(appointment_time) = $1
      AND status IN ('scheduled', 'confirmed')
    GROUP BY DATE(appointment_time), EXTRACT(HOUR FROM appointment_time)
  `;

  const result = await pool.query(query, [date]);
  const bookedSlots = result.rows;

  const availableSlots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const isBooked = bookedSlots.some((slot) => slot.hour === hour);

      availableSlots.push({
        time: slotTime,
        available: !isBooked,
        duration_minutes,
      });
    }
  }

  return {
    success: true,
    date,
    available_slots: availableSlots.filter((s) => s.available),
    booked_count: bookedSlots.length,
  };
}

async function getDiningDeals(params) {
  const { limit = 10, offset = 0 } = params;

  const query = `
    SELECT 
      id, provider_id, title, description, category, cuisine_type,
      dietary_tags, original_price, discounted_price,
      pickup_location, available_from, available_until, image_urls,
      created_at, updated_at
    FROM food_listings
    WHERE category = 'deal'
      AND status = 'active'
      AND available_from <= NOW()
      AND available_until > NOW()
      AND discounted_price < original_price
    ORDER BY (original_price - discounted_price) DESC, available_until ASC
    LIMIT $1 OFFSET $2
  `;

  const result = await pool.query(query, [limit, offset]);

  return {
    success: true,
    data: result.rows,
    count: result.rows.length,
  };
}

async function getFoodListings(params) {
  const { listing_id, provider_id, status, limit = 20, offset = 0 } = params;

  let query = `
    SELECT 
      l.id, l.provider_id, l.title, l.description, l.category, l.cuisine_type,
      l.dietary_tags, l.allergen_info, l.quantity_available, l.quantity_reserved,
      l.unit, l.original_price, l.discounted_price, l.pickup_location,
      l.available_from, l.available_until, l.image_urls, l.status,
      l.created_at, l.updated_at,
      u.first_name as provider_first_name, u.last_name as provider_last_name,
      u.email as provider_email
    FROM food_listings l
    LEFT JOIN users u ON l.provider_id = u.id
    WHERE 1=1
  `;

  const queryParams = [];
  let paramIndex = 1;

  if (listing_id) {
    query += ` AND l.id = $${paramIndex}`;
    queryParams.push(listing_id);
    paramIndex++;
  }

  if (provider_id) {
    query += ` AND l.provider_id = $${paramIndex}`;
    queryParams.push(provider_id);
    paramIndex++;
  }

  if (status) {
    query += ` AND l.status = $${paramIndex}`;
    queryParams.push(status);
    paramIndex++;
  }

  query += ` ORDER BY l.available_until ASC`;
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  queryParams.push(limit, offset);

  const result = await pool.query(query, queryParams);

  return {
    success: true,
    data: result.rows,
    count: result.rows.length,
  };
}

async function getPantrySlots(params) {
  const {
    date,
    start_time = "09:00",
    end_time = "17:00",
    duration_minutes = 30,
  } = params;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return {
      success: false,
      error: "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)",
    };
  }

  const query = `
    SELECT 
      appointment_time,
      duration_minutes,
      status
    FROM pantry_appointments
    WHERE DATE(appointment_time) = $1
      AND status IN ('scheduled', 'confirmed')
    ORDER BY appointment_time ASC
  `;

  const result = await pool.query(query, [date]);
  const bookedAppointments = result.rows;

  const [startHour, startMin] = start_time.split(":").map(Number);
  const [endHour, endMin] = end_time.split(":").map(Number);

  const availableSlots = [];
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  for (let minutes = startMinutes; minutes + duration_minutes <= endMinutes; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const slotTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const slotDateTime = new Date(`${date}T${slotTime}:00`);

    const isConflict = bookedAppointments.some((apt) => {
      const aptStart = new Date(apt.appointment_time);
      const aptEnd = new Date(aptStart.getTime() + apt.duration_minutes * 60000);
      const slotEnd = new Date(slotDateTime.getTime() + duration_minutes * 60000);

      return slotDateTime < aptEnd && slotEnd > aptStart;
    });

    if (!isConflict) {
      availableSlots.push({
        time: slotTime,
        datetime: slotDateTime.toISOString(),
        duration_minutes,
      });
    }
  }

  return {
    success: true,
    date,
    available_slots: availableSlots,
    total_slots: availableSlots.length,
    booked_count: bookedAppointments.length,
  };
}

// Tool dispatcher
async function callTool(name, params) {
  switch (name) {
    case "query_available_food":
      return await queryAvailableFood(params);
    case "check_pantry_availability":
      return await checkPantryAvailability(params);
    case "get_dining_deals":
      return await getDiningDeals(params);
    case "get_food_listings":
      return await getFoodListings(params);
    case "get_pantry_slots":
      return await getPantrySlots(params);
    default:
      return {
        success: false,
        error: `Unknown tool: ${name}`,
      };
  }
}

// MCP Protocol Handler
async function handleRequest(request) {
  try {
    const { jsonrpc, id, method, params } = request;

    if (method === "initialize") {
      return {
        jsonrpc,
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "foodbridge-db",
            version: "1.0.0",
          },
        },
      };
    }

    if (method === "tools/list") {
      return {
        jsonrpc,
        id,
        result: {
          tools: TOOLS,
        },
      };
    }

    if (method === "tools/call") {
      const { name, arguments: args } = params;
      const result = await callTool(name, args);
      return {
        jsonrpc,
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    }

    return {
      jsonrpc,
      id,
      error: {
        code: -32601,
        message: "Method not found",
      },
    };
  } catch (error) {
    return {
      jsonrpc: request.jsonrpc,
      id: request.id,
      error: {
        code: -32603,
        message: error.message,
      },
    };
  }
}

// Start server
console.error("[MCP] FoodBridge MCP Server starting...");
console.error("[MCP] Connected to: " + connectionString);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

let isProcessing = false;

rl.on("line", async (line) => {
  if (!line.trim()) return;

  try {
    isProcessing = true;
    const request = JSON.parse(line);
    const response = await handleRequest(request);
    console.log(JSON.stringify(response));
    isProcessing = false;
  } catch (error) {
    console.error("[MCP] Error processing request:", error.message);
    isProcessing = false;
  }
});

rl.on("close", async () => {
  console.error("[MCP] Connection closed, shutting down...");
  try {
    await pool.end();
  } catch (e) {
    console.error("[MCP] Error closing pool:", e.message);
  }
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.error("[MCP] Received SIGINT, shutting down...");
  try {
    await pool.end();
  } catch (e) {
    console.error("[MCP] Error closing pool:", e.message);
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("[MCP] Received SIGTERM, shutting down...");
  try {
    await pool.end();
  } catch (e) {
    console.error("[MCP] Error closing pool:", e.message);
  }
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("[MCP] Uncaught exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[MCP] Unhandled rejection:", reason);
  process.exit(1);
});

pool.on("error", (error) => {
  console.error("[MCP] Pool error:", error.message);
});

console.error("[MCP] Server ready, waiting for requests...");
