/**
 * Tool Definitions for FoodBridge AI Agent
 * Maps conversational intents to structured tool schemas
 */

export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  items?: { type: string };
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameter>;
    required: string[];
  };
}

export const AGENT_TOOLS: ToolSchema[] = [
  {
    name: "search_food",
    description: "Search for available food listings with optional filters like text search, dietary preferences, price range, location, and food type. IMPORTANT: When looking for a specific food item by name (e.g. to reserve it), always pass the food name as the 'search' parameter.",
    parameters: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Text search query to find listings by food name or description",
        },
        dietary_filters: {
          type: "array",
          description: "Dietary tags to filter by (e.g., vegetarian, vegan, gluten-free)",
          items: { type: "string" },
        },
        category: {
          type: "string",
          description: "Food category",
          enum: ["meal", "snack", "beverage", "pantry_item", "deal", "event_food"],
        },
        available_now: {
          type: "boolean",
          description: "Only show currently available food",
        },
        max_price: {
          type: "number",
          description: "Maximum price filter (in dollars)",
        },
        min_price: {
          type: "number",
          description: "Minimum price filter (in dollars)",
        },
        provider_id: {
          type: "string",
          description: "Filter listings by a specific provider ID",
        },
        page: {
          type: "number",
          description: "Page number for pagination",
        },
        limit: {
          type: "number",
          description: "Number of results per page",
        },
      },
      required: [],
    },
  },
  {
    name: "get_listing_details",
    description: "Get detailed information about a specific food listing",
    parameters: {
      type: "object",
      properties: {
        listing_id: {
          type: "string",
          description: "The ID of the food listing",
        },
      },
      required: ["listing_id"],
    },
  },
  {
    name: "reserve_food",
    description: "Create a reservation for a food listing",
    parameters: {
      type: "object",
      properties: {
        listing_id: {
          type: "string",
          description: "The ID of the food listing to reserve",
        },
        quantity: {
          type: "number",
          description: "Number of servings to reserve",
        },
        pickup_time: {
          type: "string",
          description: "Preferred pickup time (ISO 8601 format)",
        },
        notes: {
          type: "string",
          description: "Special notes or requests",
        },
      },
      required: ["listing_id", "quantity"],
    },
  },
  {
    name: "cancel_reservation",
    description: "Cancel an existing reservation",
    parameters: {
      type: "object",
      properties: {
        reservation_id: {
          type: "string",
          description: "The ID of the reservation to cancel",
        },
      },
      required: ["reservation_id"],
    },
  },
  {
    name: "get_user_reservations",
    description: "Get the current user's food reservations history. Use this when the user asks about their past reservations, most ordered items, reservation history, or what food they have reserved.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Filter by reservation status",
          enum: ["pending", "confirmed", "picked_up", "cancelled"],
        },
        limit: {
          type: "number",
          description: "Number of reservations to return (default 20)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_pantry_slots",
    description: "Get available pantry appointment time slots",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date to check for available slots in YYYY-MM-DD format only (e.g. '2026-03-17'). Do not include time.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_pantry_appointments",
    description: "Get your pantry appointments to see scheduled dates and times",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Filter by appointment status (scheduled, confirmed, completed, cancelled)",
        },
        upcoming: {
          type: "boolean",
          description: "Only show upcoming appointments",
        },
        limit: {
          type: "number",
          description: "Maximum number of appointments to return",
        },
      },
      required: [],
    },
  },
  {
    name: "book_pantry",
    description: "Book a pantry appointment for a specific time slot",
    parameters: {
      type: "object",
      properties: {
        appointment_time: {
          type: "string",
          description: "Appointment time (ISO 8601 format)",
        },
        duration_minutes: {
          type: "number",
          description: "Duration of appointment in minutes (default: 30)",
        },
        notes: {
          type: "string",
          description: "Special notes or requests",
        },
      },
      required: ["appointment_time"],
    },
  },
  {
    name: "cancel_pantry_appointment",
    description: "Cancel an existing pantry appointment by providing the date and time",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "The date of the appointment to cancel (YYYY-MM-DD format)",
        },
        time: {
          type: "string",
          description: "The time of the appointment to cancel (HH:MM format, 24-hour)",
        },
      },
      required: ["date", "time"],
    },
  },
  {
    name: "get_notifications",
    description: "Retrieve user notifications about food alerts, reservations, and bookings",
    parameters: {
      type: "object",
      properties: {
        is_read: {
          type: "boolean",
          description: "Filter by read status",
        },
        limit: {
          type: "number",
          description: "Number of notifications to retrieve",
        },
      },
      required: [],
    },
  },
  {
    name: "get_user_profile",
    description: "Get current user's profile including dietary preferences, allergies, and preferred food types",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "update_user_profile",
    description: "Update current user's profile including email, dietary preferences, allergies, and preferred food types",
    parameters: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "User's email address",
        },
        dietary_preferences: {
          type: "array",
          description: "List of dietary preferences (e.g., vegetarian, vegan, gluten-free)",
          items: { type: "string" },
        },
        allergies: {
          type: "array",
          description: "List of food allergies (e.g., peanuts, shellfish, dairy)",
          items: { type: "string" },
        },
        preferred_food_types: {
          type: "array",
          description: "List of preferred food types (e.g., Italian, Asian, Mexican)",
          items: { type: "string" },
        },
        phone: {
          type: "string",
          description: "User's phone number",
        },
        location: {
          type: "string",
          description: "User's preferred location or campus area",
        },
      },
      required: [],
    },
  },
  {
    name: "get_user_preferences",
    description: "Get current user's dietary preferences and restrictions",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_frequent_items",
    description: "Get user's frequently selected pantry items based on history",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of items to return",
        },
      },
      required: [],
    },
  },
  {
    name: "generate_pantry_cart",
    description: "Generate a recommended pantry cart based on user's history and preferences",
    parameters: {
      type: "object",
      properties: {
        include_frequent: {
          type: "boolean",
          description: "Include frequently selected items",
        },
        respect_preferences: {
          type: "boolean",
          description: "Respect dietary preferences",
        },
        max_items: {
          type: "number",
          description: "Maximum number of items to include in the cart (default: 10)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_dining_deals",
    description: "Get current dining discounts and special offers",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of deals to return",
        },
      },
      required: [],
    },
  },
  {
    name: "get_event_food",
    description: "Get food available from events with optional filters",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of items to return",
        },
        page: {
          type: "number",
          description: "Page number for pagination",
        },
        available_now: {
          type: "boolean",
          description: "Only show currently available food",
        },
      },
      required: [],
    },
  },
  {
    name: "get_event_food_details",
    description: "Get detailed information about a specific event food listing",
    parameters: {
      type: "object",
      properties: {
        listing_id: {
          type: "string",
          description: "The ID of the event food listing",
        },
      },
      required: ["listing_id"],
    },
  },
  {
    name: "get_event_food_today",
    description: "Get food available from events today",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_upcoming_event_food",
    description: "Get food available from upcoming events within a specified number of days",
    parameters: {
      type: "object",
      properties: {
        days: {
          type: "number",
          description: "Number of days to look ahead (default: 7)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_provider_event_food",
    description: "Get event food listings from a specific provider",
    parameters: {
      type: "object",
      properties: {
        provider_id: {
          type: "string",
          description: "The ID of the provider",
        },
        page: {
          type: "number",
          description: "Page number for pagination",
        },
        limit: {
          type: "number",
          description: "Number of items per page",
        },
      },
      required: ["provider_id"],
    },
  },
  {
    name: "get_provider_my_listings",
    description: "Get the authenticated provider's own food listings with optional status filter and pagination.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Filter listings by status (active, inactive, expired)",
          enum: ["active", "inactive", "expired"],
        },
        page: {
          type: "number",
          description: "Page number for pagination (default: 1)",
        },
        limit: {
          type: "number",
          description: "Number of results per page (default: 20)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_provider_listings_dashboard",
    description: "Get provider's own listings with reservation stats and summary. Supports filtering by status and category with pagination.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Filter listings by status (active, inactive, expired)",
          enum: ["active", "inactive", "expired"],
        },
        category: {
          type: "string",
          description: "Filter listings by category (meal, snack, beverage, pantry_item, deal, event_food)",
          enum: ["meal", "snack", "beverage", "pantry_item", "deal", "event_food"],
        },
        page: {
          type: "number",
          description: "Page number for pagination (default: 1)",
        },
        limit: {
          type: "number",
          description: "Number of results per page (default: 20)",
        },
      },
      required: [],
    },
  },
  {
    name: "create_listing",
    description: "Create a new food listing on behalf of the authenticated provider. Only call this tool after collecting all required fields and receiving explicit confirmation from the provider.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Food name/title for the listing",
        },
        category: {
          type: "string",
          description: "Food category",
          enum: ["meal", "snack", "beverage", "pantry_item", "deal", "event_food"],
        },
        quantity_available: {
          type: "number",
          description: "Number of servings/units available (must be a positive integer)",
        },
        pickup_location: {
          type: "string",
          description: "Where students can pick up the food",
        },
        available_from: {
          type: "string",
          description: "Pickup window start time (ISO 8601 format)",
        },
        available_until: {
          type: "string",
          description: "Pickup window end time (ISO 8601 format)",
        },
        description: {
          type: "string",
          description: "Optional description of the food",
        },
        dietary_tags: {
          type: "array",
          description: "Dietary tags (e.g. vegetarian, vegan, gluten-free)",
          items: { type: "string" },
        },
        allergen_info: {
          type: "array",
          description: "Allergen information (e.g. peanuts, dairy, shellfish)",
          items: { type: "string" },
        },
        cuisine_type: {
          type: "string",
          description: "Optional cuisine type (e.g. Italian, Asian)",
        },
        original_price: {
          type: "number",
          description: "Original price in dollars (optional)",
        },
        discounted_price: {
          type: "number",
          description: "Discounted price in dollars, must not exceed original_price (optional)",
        },
        image_url: {
          type: "string",
          description: "URL of an image for the listing (optional, use a relevant Unsplash URL if provider says 'use good image')",
        },
      },
      required: ["title", "category", "quantity_available", "pickup_location", "available_from", "available_until"],
    },
  },
  {
    name: "get_calendar_status",
    description: "Check whether the current user has connected their Google Calendar",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "disconnect_calendar",
    description: "Disconnect the current user's Google Calendar integration",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "add_to_calendar",
    description: "Add an event directly to the user's Google Calendar. Use this automatically after booking a pantry appointment if the user asks to add it to their calendar.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Event title (e.g., 'FoodBridge Pantry Appointment')",
        },
        start_time: {
          type: "string",
          description: "Event start time in ISO 8601 format (e.g., '2026-03-18T09:00:00.000Z')",
        },
        end_time: {
          type: "string",
          description: "Event end time in ISO 8601 format (e.g., '2026-03-18T09:30:00.000Z')",
        },
        description: {
          type: "string",
          description: "Optional event description",
        },
      },
      required: ["title", "start_time", "end_time"],
    },
  },
  {
    name: "get_pantry_inventory",
    description: "Get the current pantry inventory — the items available for students to pick up. Use this to see what ingredients are in stock before suggesting recipes.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Filter by category (e.g., grain, protein, vegetable, fruit, dairy, canned)",
        },
        limit: {
          type: "number",
          description: "Max number of items to return (default: 50)",
        },
      },
      required: [],
    },
  },
  {
    name: "search_recipes",
    description: "Search for recipes based on available pantry ingredients",
    parameters: {
      type: "object",
      properties: {
        ingredients: {
          type: "array",
          description: "List of ingredients you have (e.g., rice, beans, chicken)",
          items: { type: "string" },
        },
        number: {
          type: "number",
          description: "Number of recipes to return (default: 5)",
        },
        ranking: {
          type: "string",
          description: "Ranking method: maximize (most ingredients used) or minimize (fewest ingredients needed)",
          enum: ["maximize", "minimize"],
        },
      },
      required: ["ingredients"],
    },
  },
  {
    name: "get_recipe_details",
    description: "Get full recipe details including ingredients, instructions, and cooking time",
    parameters: {
      type: "object",
      properties: {
        recipe_id: {
          type: "string",
          description: "The ID of the recipe",
        },
      },
      required: ["recipe_id"],
    },
  },
  {
    name: "search_recipes_by_cuisine",
    description: "Search for recipes by name, cuisine type, or both. Use this when the user asks for a specific recipe by name or wants to find recipes from a particular cuisine.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Recipe name or keyword to search for (e.g., 'Cajun Rice and Beans', 'pasta carbonara')",
        },
        cuisine: {
          type: "string",
          description: "Optional cuisine type filter (e.g., Thai, Italian, Mexican, Indian, Chinese)",
        },
        ingredients: {
          type: "array",
          description: "Optional list of ingredients to filter by",
          items: { type: "string" },
        },
        number: {
          type: "number",
          description: "Number of recipes to return (default: 5)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_volunteer_opportunities",
    description: "Get available volunteer opportunities that students can sign up for. Use this when a user asks about volunteer opportunities, what volunteering is available, or wants to sign up to volunteer.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Filter by status (open, closed)",
        },
        limit: {
          type: "number",
          description: "Number of opportunities to return",
        },
      },
      required: [],
    },
  },
  {
    name: "signup_for_volunteer",
    description: "Sign up the current student for a volunteer opportunity by opportunity ID",
    parameters: {
      type: "object",
      properties: {
        opportunity_id: {
          type: "string",
          description: "The ID of the volunteer opportunity to sign up for",
        },
      },
      required: ["opportunity_id"],
    },
  },
  {
    name: "get_volunteer_signups",
    description: "Get the current student's volunteer signups/registrations",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Filter by status (signed_up, completed, cancelled)",
        },
      },
      required: [],
    },
  },
  {
    name: "cancel_volunteer_signup",
    description: "Cancel a volunteer signup by participation ID. First call get_volunteer_signups to find the participation_id, then call this tool.",
    parameters: {
      type: "object",
      properties: {
        participation_id: {
          type: "string",
          description: "The participation ID of the volunteer signup to cancel",
        },
      },
      required: ["participation_id"],
    },
  },
  {
    name: "get_provider_reservations",
    description: "Get all reservations for the provider's listings. Can filter by status (confirmed, picked_up, cancelled) and date (YYYY-MM-DD). Use this when a provider asks who has reserved food, today's reservations, or reservation status.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Filter by reservation status: confirmed, picked_up, cancelled",
          enum: ["confirmed", "picked_up", "cancelled"],
        },
        date: {
          type: "string",
          description: "Filter by date in YYYY-MM-DD format (e.g. today's date)",
        },
        page: { type: "string", description: "Page number" },
        limit: { type: "string", description: "Results per page" },
      },
      required: [],
    },
  },
  {
    name: "get_provider_metrics",
    description: "Retrieve sustainability, community, customer, and revenue metrics for the current provider. Use this to give insights on waste reduction, carbon footprint, food donations, customer retention, and revenue performance.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_recipe_nutrition",
    description: "Get nutritional information for a recipe",
    parameters: {
      type: "object",
      properties: {
        recipe_id: {
          type: "string",
          description: "The ID of the recipe",
        },
      },
      required: ["recipe_id"],
    },
  },
];

export function getToolByName(name: string): ToolSchema | undefined {
  return AGENT_TOOLS.find((tool) => tool.name === name);
}

export function getToolNames(): string[] {
  return AGENT_TOOLS.map((tool) => tool.name);
}
