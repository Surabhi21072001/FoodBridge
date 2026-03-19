#!/usr/bin/env node

/**
 * FoodBridge MCP Server
 * Exposes database query functions for the AI agent
 * Allows direct querying of food listings, pantry availability, and dining deals
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Pool, QueryResult } from "pg";

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Build connection string from environment variables
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Initialize database connection pool
const pool = new Pool({
  connectionString,
});

// Type definitions
interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  items?: { type: string };
}

interface ToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, ToolParameter>;
    required: string[];
  };
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  count?: number;
  [key: string]: any;
}

// Tool definitions
const TOOLS: ToolSchema[] = [
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
async function queryAvailableFood(params: any): Promise<ToolResult> {
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
    FROM listings
    WHERE status = 'active'
  `;

  const queryParams: any[] = [];
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

  const result: QueryResult = await pool.query(query, queryParams);
  return {
    success: true,
    data: result.rows,
    count: result.rows.length,
  };
}

async function checkPantryAvailability(params: any): Promise<ToolResult> {
  const { date, duration_minutes = 30 } = params;

  // Validate date format
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

  const result: QueryResult = await pool.query(query, [date]);
  const bookedSlots = result.rows;

  // Generate available slots (9 AM to 5 PM, 30-min intervals)
  const availableSlots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const isBooked = bookedSlots.some((slot: any) => slot.hour === hour);

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

async function getDiningDeals(params: any): Promise<ToolResult> {
  const { limit = 10, offset = 0 } = params;

  const query = `
    SELECT 
      id, provider_id, title, description, category, cuisine_type,
      dietary_tags, original_price, discounted_price, discount_percentage,
      pickup_location, available_from, available_until, image_urls,
      created_at, updated_at
    FROM listings
    WHERE category = 'deal'
      AND status = 'active'
      AND available_from <= NOW()
      AND available_until > NOW()
      AND discounted_price < original_price
    ORDER BY discount_percentage DESC, available_until ASC
    LIMIT $1 OFFSET $2
  `;

  const result: QueryResult = await pool.query(query, [limit, offset]);

  return {
    success: true,
    data: result.rows,
    count: result.rows.length,
  };
}

async function getFoodListings(params: any): Promise<ToolResult> {
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
    FROM listings l
    LEFT JOIN users u ON l.provider_id = u.id
    WHERE 1=1
  `;

  const queryParams: any[] = [];
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

  const result: QueryResult = await pool.query(query, queryParams);

  return {
    success: true,
    data: result.rows,
    count: result.rows.length,
  };
}

async function getPantrySlots(params: any): Promise<ToolResult> {
  const {
    date,
    start_time = "09:00",
    end_time = "17:00",
    duration_minutes = 30,
  } = params;

  // Validate date format
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

  const result: QueryResult = await pool.query(query, [date]);
  const bookedAppointments = result.rows;

  // Parse time strings
  const [startHour, startMin] = start_time.split(":").map(Number);
  const [endHour, endMin] = end_time.split(":").map(Number);

  // Generate available slots
  const availableSlots = [];
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  for (let minutes = startMinutes; minutes + duration_minutes <= endMinutes; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const slotTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const slotDateTime = new Date(`${date}T${slotTime}:00`);

    // Check if slot conflicts with booked appointments
    const isConflict = bookedAppointments.some((apt: any) => {
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
async function callTool(name: string, params: any): Promise<ToolResult> {
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

// Initialize MCP server
const server = new Server({
  name: "foodbridge-db",
  version: "1.0.0",
});

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle call tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await callTool(name, args);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: error.message,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("FoodBridge MCP Server started");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
