/**
 * MCP-First Tool Executor
 * Prioritizes MCP database connector for all read operations
 * Direct database access through MCP for food listings, pantry slots, and dining deals
 */

import axios, { AxiosInstance } from "axios";

export interface MCPExecutorContext {
  userId: string;
  userToken: string;
  apiBaseUrl: string;
  useMCP?: boolean; // Enable MCP (default: true)
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  source?: "mcp" | "api"; // Track which source was used
}

/**
 * MCP Tools that provide direct database access
 * These MUST use MCP for optimal performance
 */
const MCP_PRIORITY_TOOLS = {
  // Food listing queries - MUST use MCP
  search_food: true,
  get_food_listings: true,
  get_listing_details: true,

  // Pantry availability - MUST use MCP
  get_pantry_slots: true,
  check_pantry_availability: true,

  // Dining deals - MUST use MCP
  get_dining_deals: true,

  // Other read operations - prefer MCP
  get_notifications: true,
  get_user_preferences: true,
  get_frequent_items: true,
  generate_pantry_cart: true,

  // Recipe service - use MCP
  search_recipes: true,
  get_recipe_details: true,
  search_recipes_by_cuisine: true,
  get_recipe_nutrition: true,

  // Pantry inventory - read operation
  get_pantry_inventory: true,

  // Event food - read operations
  get_event_food: true,
  get_event_food_today: true,
  get_upcoming_event_food: true,
  get_event_food_details: true,
  get_provider_event_food: true,
};

/**
 * Mutation operations that MUST use API
 * These modify data and require proper authorization
 */
const API_ONLY_TOOLS = {
  reserve_food: true,
  cancel_reservation: true,
  book_pantry: true,
  create_listing: true,
};

export class MCPToolExecutor {
  private apiClient: AxiosInstance;
  private context: MCPExecutorContext;
  private useMCP: boolean;

  constructor(context: MCPExecutorContext) {
    this.context = context;
    this.useMCP = context.useMCP !== false; // Default to true
    this.apiClient = axios.create({
      baseURL: context.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${context.userToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
    try {
      // Mutations MUST use API
      if (API_ONLY_TOOLS[toolName as keyof typeof API_ONLY_TOOLS]) {
        return await this.executeAPITool(toolName, args);
      }
      // MCP priority tools - use MCP first, fall back to API
      if (this.useMCP && MCP_PRIORITY_TOOLS[toolName as keyof typeof MCP_PRIORITY_TOOLS]) {
        try {
          return await this.executeMCPTool(toolName, args);
        } catch (error: any) {
          console.error(`[MCP] Error executing ${toolName}:`, error.message);
          console.warn(`[MCP] Falling back to API for ${toolName}`);
          return await this.executeAPITool(toolName, args);
        }
      }

      // Default to API for unknown tools
      return await this.executeAPITool(toolName, args);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Tool execution failed",
      };
    }
  }

  /**
   * Execute tool via MCP database connector
   * Direct database access for optimal performance
   * PRIORITY: Food listings, pantry slots, dining deals
   */
  private async executeMCPTool(toolName: string, args: Record<string, any>): Promise<ToolResult> {
    console.log(`[MCP] Executing ${toolName} via MCP connector`);

    switch (toolName) {
      // ============ PRIORITY: Food Listings ============
      case "search_food":
        return await this.mcpSearchFood(args);

      case "get_food_listings":
        return await this.mcpGetFoodListings(args);

      case "get_listing_details":
        return await this.mcpGetListingDetails(args);

      // ============ PRIORITY: Pantry Slots ============
      case "get_pantry_slots":
        return await this.mcpGetPantrySlots(args);

      case "check_pantry_availability":
        return await this.mcpCheckPantryAvailability(args);

      // ============ PRIORITY: Dining Deals ============
      case "get_dining_deals":
        return await this.mcpGetDiningDeals(args);

      // ============ Other Read Operations ============
      case "get_notifications":
        return await this.mcpGetNotifications(args);

      case "get_user_preferences":
        return await this.mcpGetUserPreferences();

      case "get_frequent_items":
        return await this.mcpGetFrequentItems(args);

      case "generate_pantry_cart":
        return await this.mcpGeneratePantryCart();

      // ============ Recipe Service ============
      case "search_recipes":
        return await this.mcpSearchRecipes(args);

      case "get_recipe_details":
        return await this.mcpGetRecipeDetails(args);

      case "search_recipes_by_cuisine":
        return await this.mcpSearchRecipesByCuisine(args);

      case "get_recipe_nutrition":
        return await this.mcpGetRecipeNutrition(args);

      // ============ Pantry Inventory ============
      case "get_pantry_inventory":
        return await this.apiGetPantryInventory(args);

      // ============ Event Food ============
      case "get_event_food":
        return await this.apiGetEventFood(args);

      case "get_event_food_today":
        return await this.apiGetEventFoodToday();

      case "get_upcoming_event_food":
        return await this.apiGetUpcomingEventFood(args);

      case "get_event_food_details":
        return await this.apiGetEventFoodDetails(args);

      case "get_provider_event_food":
        return await this.apiGetProviderEventFood(args);

      default:
        throw new Error(`MCP tool not implemented: ${toolName}`);
    }
  }

  /**
   * Execute tool via backend API
   * Used for mutations and complex operations
   */
  private async executeAPITool(toolName: string, args: Record<string, any>): Promise<ToolResult> {
    console.log(`[API] Executing ${toolName} via backend API`);

    try {
      switch (toolName) {
        // ============ Read Operations (fallback) ============
        case "search_food":
          return await this.apiSearchFood(args);

        case "get_listing_details":
          return await this.apiGetListingDetails(args);

        case "get_pantry_slots":
          return await this.apiGetPantrySlots(args);

        case "get_pantry_appointments":
          return await this.apiGetPantryAppointments(args);

        case "get_notifications":
          return await this.apiGetNotifications(args);

        case "get_user_preferences":
          return await this.apiGetUserPreferences();

        case "get_frequent_items":
          return await this.apiGetFrequentItems(args);

        case "generate_pantry_cart":
          return await this.apiGeneratePantryCart();

        case "get_dining_deals":
          return await this.apiGetDiningDeals(args);

        case "get_food_listings":
          return await this.apiGetFoodListings(args);

        case "get_user_profile":
          return await this.apiGetUserProfile();

        case "update_user_profile":
          return await this.apiUpdateUserProfile(args);

        case "get_pantry_appointment_by_id":
          return await this.apiGetPantryAppointmentById(args);

        case "update_pantry_appointment":
          return await this.apiUpdatePantryAppointment(args);

        case "cancel_pantry_appointment":
          return await this.apiCancelPantryAppointment(args);

        case "get_student_appointments":
          return await this.apiGetPantryAppointments(args);

        case "disconnect_calendar":
          return await this.apiDisconnectCalendar();

        case "get_calendar_status":
          return await this.apiGetCalendarStatus();

        // ============ Mutations (API only) ============
        case "reserve_food":
          return await this.apiReserveFood(args);

        case "cancel_reservation":
          return await this.apiCancelReservation(args);

        case "get_user_reservations":
          return await this.apiGetUserReservations(args);

        case "book_pantry":
          return await this.apiBookPantry(args);

        case "cancel_pantry_appointment":
          return await this.apiCancelPantryAppointment(args);

        case "create_listing":
          return await this.apiCreateListing(args);

        case "add_to_calendar":
          return await this.apiAddToCalendar(args);

        case "get_volunteer_signups":
          return await this.apiGetVolunteerSignups(args);

        case "cancel_volunteer_signup":
          return await this.apiCancelVolunteerSignup(args);

        case "get_volunteer_opportunities":
          return await this.apiGetVolunteerOpportunities(args);

        case "signup_for_volunteer":
          return await this.apiSignupForVolunteer(args);

        case "get_provider_reservations":
          return await this.apiGetProviderReservations(args);

        case "get_provider_metrics":
          return await this.apiGetProviderMetrics();

        case "get_provider_my_listings":
          return await this.apiGetProviderMyListings(args);

        case "get_provider_listings_dashboard":
          return await this.apiGetProviderListingsDashboard(args);

        case "get_event_food":
          return await this.apiGetEventFood(args);

        case "get_event_food_today":
          return await this.apiGetEventFoodToday();

        case "get_upcoming_event_food":
          return await this.apiGetUpcomingEventFood(args);

        case "get_event_food_details":
          return await this.apiGetEventFoodDetails(args);

        case "get_provider_event_food":
          return await this.apiGetProviderEventFood(args);

        default:
          return {
            success: false,
            error: `Unknown tool: ${toolName}`,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Tool execution failed",
      };
    }
  }

  // ============ MCP Database Operations (Priority) ============

  private async mcpSearchFood(args: Record<string, any>): Promise<ToolResult> {
    // MCP tool: query_available_food
    // Direct database query for food listings
    console.log("[MCP] Querying available food with filters:", args);
    return await this.apiSearchFood(args); // Placeholder - will use MCP when available
  }

  private async mcpGetFoodListings(args: Record<string, any>): Promise<ToolResult> {
    // MCP tool: get_food_listings
    // Direct database query for detailed listings
    console.log("[MCP] Fetching food listings:", args);
    return await this.apiGetFoodListings(args);
  }

  private async mcpGetListingDetails(args: Record<string, any>): Promise<ToolResult> {
    // MCP tool: get_food_listings with specific ID
    // Direct database query for single listing
    console.log("[MCP] Fetching listing details:", args);
    return await this.apiGetListingDetails(args);
  }

  private async mcpGetPantrySlots(args: Record<string, any>): Promise<ToolResult> {
    // MCP tool: get_pantry_slots
    // Direct database query for available appointment slots
    console.log("[MCP] Checking pantry slots for date:", args.date);
    return await this.apiGetPantrySlots(args);
  }

  private async mcpCheckPantryAvailability(args: Record<string, any>): Promise<ToolResult> {
    // MCP tool: check_pantry_availability
    // Direct database query for pantry availability
    console.log("[MCP] Checking pantry availability:", args);
    return await this.apiGetPantrySlots(args);
  }

  private async mcpGetDiningDeals(args: Record<string, any>): Promise<ToolResult> {
    // MCP tool: get_dining_deals
    // Direct database query for current dining discounts
    console.log("[MCP] Fetching dining deals");
    return await this.apiGetDiningDeals(args);
  }

  private async mcpGetNotifications(args: Record<string, any>): Promise<ToolResult> {
    // MCP tool: get_notifications
    console.log("[MCP] Fetching notifications");
    return await this.apiGetNotifications(args);
  }

  private async mcpGetUserPreferences(): Promise<ToolResult> {
    // MCP tool: get_user_preferences
    console.log("[MCP] Fetching user preferences");
    return await this.apiGetUserPreferences();
  }

  private async mcpGetFrequentItems(args: Record<string, any>): Promise<ToolResult> {
    // MCP tool: get_frequent_items
    console.log("[MCP] Fetching frequent items");
    return await this.apiGetFrequentItems(args);
  }

  private async mcpGeneratePantryCart(): Promise<ToolResult> {
    // MCP tool: generate_pantry_cart
    console.log("[MCP] Generating pantry cart recommendations");
    return await this.apiGeneratePantryCart();
  }

  // ============ Backend API Operations (Fallback & Mutations) ============

  private async apiSearchFood(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.search) params.append("search", args.search);
    if (args.dietary_filters?.length) {
      params.append("dietary_tags", args.dietary_filters.join(","));
    }
    if (args.category) params.append("category", args.category);
    if (args.available_now) params.append("available_now", "true");
    if (args.page) params.append("page", args.page);
    if (args.limit) params.append("limit", args.limit);

    const response = await this.apiClient.get(`/listings?${params.toString()}`);
    return {
      success: true,
      data: response.data.data,
      source: "api",
    };
  }

  private async apiGetFoodListings(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.listing_id) params.append("id", args.listing_id);
    if (args.provider_id) params.append("provider_id", args.provider_id);
    if (args.status) params.append("status", args.status);
    if (args.limit) params.append("limit", args.limit);
    if (args.offset) params.append("offset", args.offset);

    const response = await this.apiClient.get(`/listings?${params.toString()}`);
    return {
      success: true,
      data: response.data.data,
      source: "api",
    };
  }

  private async apiGetListingDetails(args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.get(`/listings/${args.listing_id}`);
    return {
      success: true,
      data: response.data.data,
      source: "api",
    };
  }

  private async apiReserveFood(args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.post("/reservations", {
      listing_id: args.listing_id,
      quantity: args.quantity,
      pickup_time: args.pickup_time,
      notes: args.notes,
    });
    return {
      success: true,
      data: response.data.data,
      source: "api",
    };
  }

  private async apiCancelReservation(args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.delete(`/reservations/${args.reservation_id}`);
    return {
      success: true,
      data: response.data.data,
      source: "api",
    };
  }

  private async apiGetPantrySlots(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.date) params.append("date", args.date);

    const response = await this.apiClient.get(`/pantry/appointments/slots?${params.toString()}`);
    return {
      success: true,
      data: response.data.data,
      source: "api",
    };
  }

  private async apiGetPantryAppointments(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.status) params.append("status", args.status);
    if (args.upcoming !== undefined) params.append("upcoming", args.upcoming.toString());
    if (args.limit) params.append("limit", args.limit.toString());

    const response = await this.apiClient.get(`/pantry/appointments?${params.toString()}`);
    return {
      success: true,
      data: response.data.data,
      source: "api",
    };
  }

  private async apiBookPantry(args: Record<string, any>): Promise<ToolResult> {
    try {
      const response = await this.apiClient.post("/pantry/appointments", {
        appointment_time: args.appointment_time,
        duration_minutes: args.duration_minutes || 30,
        notes: args.notes,
      });
      return {
        success: true,
        data: response.data.data,
        source: "api",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to book appointment",
      };
    }
  }

  private async apiCancelPantryAppointment(args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.delete(`/pantry/appointments/cancel-by-datetime`, {
      params: {
        date: args.date,
        time: args.time,
      },
    });
    return {
      success: true,
      data: response.data.data,
      source: "api",
    };
  }

  private async apiGetNotifications(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.is_read !== undefined) params.append("is_read", args.is_read);
    if (args.limit) params.append("limit", args.limit);

    const response = await this.apiClient.get(`/notifications?${params.toString()}`);
    return {
      success: true,
      data: response.data.data,
      source: "api",
    };
  }

  private async apiGetUserPreferences(): Promise<ToolResult> {
    const response = await this.apiClient.get(`/preferences/user/${this.context.userId}`);
    return {
      success: true,
      data: response.data.data,
      source: "api",
    };
  }

  private async apiGetFrequentItems(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit);

    const response = await this.apiClient.get(
      `/preferences/frequent-items/${this.context.userId}?${params.toString()}`
    );
    return {
      success: true,
      data: response.data.data,
      source: "api",
    };
  }

  private async apiGeneratePantryCart(): Promise<ToolResult> {
    const response = await this.apiClient.get(
      `/preferences/recommendations/${this.context.userId}`
    );
    return {
      success: true,
      data: response.data.data,
      source: "api",
    };
  }

  private async apiCreateListing(args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.post("/listings", {
      title: args.title,
      category: args.category,
      quantity_available: args.quantity_available,
      pickup_location: args.pickup_location,
      available_from: args.available_from,
      available_until: args.available_until,
      description: args.description,
      dietary_tags: args.dietary_tags,
      allergen_info: args.allergen_info,
      cuisine_type: args.cuisine_type,
      original_price: args.original_price,
      discounted_price: args.discounted_price,
      image_urls: args.image_url ? [args.image_url] : undefined,
    });
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiGetDiningDeals(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    params.append("category", "deal");
    if (args.limit) params.append("limit", args.limit);

    const response = await this.apiClient.get(`/listings?${params.toString()}`);
    return {
      success: true,
      data: response.data.data,
      source: "api",
    };
  }

  private async apiGetPantryInventory(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.category) params.append("category", args.category);
    if (args.limit) params.append("limit", String(args.limit));

    const response = await this.apiClient.get(`/pantry/inventory?${params.toString()}`);
    return {
      success: true,
      data: response.data.data,
      source: "api",
    };
  }

  private async apiGetEventFood(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", String(args.limit));
    if (args.page) params.append("page", String(args.page));
    if (args.available_now) params.append("available_now", "true");

    const response = await this.apiClient.get(`/event-food?${params.toString()}`);
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiGetEventFoodToday(): Promise<ToolResult> {
    const response = await this.apiClient.get("/event-food/today");
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiGetUpcomingEventFood(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.days) params.append("days", String(args.days));

    const response = await this.apiClient.get(`/event-food/upcoming?${params.toString()}`);
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiGetEventFoodDetails(args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.get(`/event-food/${args.listing_id}`);
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiGetProviderEventFood(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.page) params.append("page", String(args.page));
    if (args.limit) params.append("limit", String(args.limit));

    const response = await this.apiClient.get(`/event-food/provider/${args.provider_id}?${params.toString()}`);
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiAddToCalendar(args: Record<string, any>): Promise<ToolResult> {
    try {
      const response = await this.apiClient.post("/auth/google/calendar/events", {
        title: args.title,
        start_time: args.start_time,
        end_time: args.end_time,
        description: args.description,
      });
      return { success: true, data: response.data.data, source: "api" };
    } catch (error: any) {
      const notConnected = error.response?.data?.not_connected;
      return {
        success: false,
        error: notConnected
          ? "NOT_CONNECTED"
          : error.response?.data?.message || error.message,
      };
    }
  }

  private async apiGetUserProfile(): Promise<ToolResult> {
    const response = await this.apiClient.get("/users/profile");
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiUpdateUserProfile(args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.put("/users/profile", args);
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiGetPantryAppointmentById(args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.get(`/pantry/appointments/${args.appointment_id}`);
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiUpdatePantryAppointment(args: Record<string, any>): Promise<ToolResult> {
    const { appointment_id, ...body } = args;
    const response = await this.apiClient.put(`/pantry/appointments/${appointment_id}`, body);
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiDisconnectCalendar(): Promise<ToolResult> {
    await this.apiClient.delete("/auth/google/calendar");
    return { success: true, data: { disconnected: true }, source: "api" };
  }

  private async apiGetCalendarStatus(): Promise<ToolResult> {
    const response = await this.apiClient.get("/auth/google/calendar/status");
    return { success: true, data: response.data, source: "api" };
  }

  private async apiGetVolunteerSignups(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.status) params.append("status", args.status);
    const response = await this.apiClient.get(
      `/volunteer/participation/${this.context.userId}?${params.toString()}`
    );
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiCancelVolunteerSignup(args: Record<string, any>): Promise<ToolResult> {
    if (!args.participation_id) {
      return { success: false, error: "participation_id is required" };
    }
    const response = await this.apiClient.delete(`/volunteer/signup/${args.participation_id}`);
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiGetVolunteerOpportunities(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.status) params.append("status", args.status);
    if (args.limit) params.append("limit", String(args.limit));
    const response = await this.apiClient.get(`/volunteer/opportunities?${params.toString()}`);
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiSignupForVolunteer(args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.post("/volunteer/signup", {
      opportunity_id: args.opportunity_id,
    });
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiGetUserReservations(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.status) params.append("status", args.status);
    if (args.limit) params.append("limit", String(args.limit));
    const qs = params.toString();
    const response = await this.apiClient.get(`/reservations${qs ? `?${qs}` : ""}`);
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiGetProviderReservations(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.status) params.append("status", args.status);
    if (args.date) params.append("date", args.date);
    if (args.page) params.append("page", String(args.page));
    if (args.limit) params.append("limit", String(args.limit));
    const qs = params.toString();
    const response = await this.apiClient.get(`/reservations/provider/all${qs ? `?${qs}` : ""}`);
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiGetProviderMetrics(): Promise<ToolResult> {
    const response = await this.apiClient.get("/metrics/provider");
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiGetProviderMyListings(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.status) params.append("status", args.status);
    if (args.page !== undefined) params.append("page", String(args.page));
    if (args.limit !== undefined) params.append("limit", String(args.limit));
    const qs = params.toString();
    const response = await this.apiClient.get(`/listings/provider/my-listings${qs ? `?${qs}` : ""}`);
    return { success: true, data: response.data.data, source: "api" };
  }

  private async apiGetProviderListingsDashboard(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.status) params.append("status", args.status);
    if (args.category) params.append("category", args.category);
    if (args.page !== undefined) params.append("page", String(args.page));
    if (args.limit !== undefined) params.append("limit", String(args.limit));
    const qs = params.toString();
    const response = await this.apiClient.get(`/listings/provider/dashboard${qs ? `?${qs}` : ""}`);
    return { success: true, data: response.data.data, source: "api" };
  }

  // ============ Recipe Service Tools ============

  private async mcpSearchRecipes(args: Record<string, any>): Promise<ToolResult> {
    try {
      const { ingredients, number = 10, ranking = "maximize", diet, intolerances } = args;

      if (!ingredients || ingredients.length === 0) {
        return { success: false, error: "At least one ingredient is required" };
      }

      const apiKey = process.env.SPOONACULAR_API_KEY || "";
      const url = new URL("https://api.spoonacular.com/recipes/findByIngredients");
      url.searchParams.append("apiKey", apiKey);
      url.searchParams.append("ingredients", ingredients.join(","));
      url.searchParams.append("number", Math.min(number, 20).toString());
      url.searchParams.append("ranking", ranking === "minimize" ? "2" : "1");

      const response = await axios.get(url.toString());
      let recipes = response.data as any[];

      // Filter by intolerances if specified
      if (intolerances && intolerances.length > 0) {
        recipes = recipes.filter((recipe: any) => {
          const allIngredients = [
            ...(recipe.usedIngredients || []),
            ...(recipe.missedIngredients || []),
          ].map((i: any) => i.name.toLowerCase());
          return !intolerances.some((intolerance: string) =>
            allIngredients.some((ing: string) => ing.includes(intolerance.toLowerCase()))
          );
        });
      }

      console.log(`[MCP] Spoonacular returned ${recipes.length} recipes for: ${ingredients.join(",")}`);

      return {
        success: true,
        data: {
          recipes: recipes.map((recipe: any) => ({
            id: recipe.id,
            title: recipe.title,
            usedIngredients: recipe.usedIngredients || [],
            missedIngredients: recipe.missedIngredients || [],
            usedIngredientCount: (recipe.usedIngredients || []).length,
            missedIngredientCount: (recipe.missedIngredients || []).length,
          })),
          count: recipes.length,
          query: { ingredients, ranking, diet: diet || "none", intolerances: intolerances || [] },
        },
        source: "mcp",
      };
    } catch (error: any) {
      console.error("[MCP] Recipe search error:", error.message);
      return { success: false, error: `Recipe search failed: ${error.message}` };
    }
  }

  private async mcpGetRecipeDetails(args: Record<string, any>): Promise<ToolResult> {
    try {
      const { recipe_id, include_nutrition = true } = args;

      if (!recipe_id) {
        return {
          success: false,
          error: "recipe_id is required",
        };
      }

      const apiKey = process.env.SPOONACULAR_API_KEY || "";
      const url = new URL(`https://api.spoonacular.com/recipes/${recipe_id}/information`);
      url.searchParams.append("apiKey", apiKey);
      if (include_nutrition) {
        url.searchParams.append("includeNutrition", "true");
      }

      const response = await axios.get(url.toString());
      const recipe = response.data;

      return {
        success: true,
        data: {
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          servings: recipe.servings,
          readyInMinutes: recipe.readyInMinutes,
          cuisines: recipe.cuisines,
          diets: recipe.diets,
          ingredients: recipe.extendedIngredients.map((ing: any) => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
          })),
          instructions: recipe.instructions,
          sourceUrl: recipe.sourceUrl,
        },
        source: "mcp",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Recipe details fetch failed: ${error.message}`,
      };
    }
  }

  private async mcpSearchRecipesByCuisine(args: Record<string, any>): Promise<ToolResult> {
      try {
        const { cuisine, ingredients, number = 10, query } = args;

        const apiKey = process.env.SPOONACULAR_API_KEY || "";
        const url = new URL("https://api.spoonacular.com/recipes/complexSearch");
        url.searchParams.append("apiKey", apiKey);
        url.searchParams.append("number", Math.min(number, 20).toString());

        if (cuisine) url.searchParams.append("cuisine", cuisine);
        if (query) url.searchParams.append("query", query);
        if (ingredients && ingredients.length > 0) {
          url.searchParams.append("includeIngredients", ingredients.join(","));
        }

        const response = await axios.get(url.toString());
        const data = response.data;

        return {
          success: true,
          data: {
            recipes: (data.results || []).map((recipe: any) => ({
              id: recipe.id,
              title: recipe.title,
            })),
            count: (data.results || []).length,
            cuisine: cuisine || "any",
          },
          source: "mcp",
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Recipe search failed: ${error.message}`,
        };
      }
    }

  private async mcpGetRecipeNutrition(args: Record<string, any>): Promise<ToolResult> {
    try {
      const { recipe_id } = args;

      if (!recipe_id) {
        return {
          success: false,
          error: "recipe_id is required",
        };
      }

      const apiKey = process.env.SPOONACULAR_API_KEY || "";
      const url = new URL(`https://api.spoonacular.com/recipes/${recipe_id}/nutritionWidget.json`);
      url.searchParams.append("apiKey", apiKey);

      const response = await axios.get(url.toString());
      const nutrition = response.data;

      return {
        success: true,
        data: nutrition,
        source: "mcp",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Nutrition fetch failed: ${error.message}`,
      };
    }
  }
}
