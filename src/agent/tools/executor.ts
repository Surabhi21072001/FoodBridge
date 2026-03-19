/**
 * Tool Executor - Maps tool calls to backend API endpoints
 */

import axios, { AxiosInstance } from "axios";

export interface ToolExecutionContext {
  userId: string;
  userToken: string;
  apiBaseUrl: string;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  total?: number;
}

export class ToolExecutor {
  private apiClient: AxiosInstance;
  private context: ToolExecutionContext;

  constructor(context: ToolExecutionContext) {
    this.context = context;
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
      switch (toolName) {
        case "search_food":
          return await this.searchFood(args);
        case "get_listing_details":
          return await this.getListingDetails(args);
        case "reserve_food":
          return await this.reserveFood(args);
        case "cancel_reservation":
          return await this.cancelReservation(args);
        case "get_pantry_slots":
          return await this.getPantrySlots(args);
        case "get_pantry_appointments":
          return await this.getPantryAppointments(args);
        case "book_pantry":
          return await this.bookPantry(args);
        case "cancel_pantry_appointment":
          return await this.cancelPantryAppointment(args);
        case "get_pantry_appointment_by_id":
          return await this.getPantryAppointmentById(args);
        case "update_pantry_appointment":
          return await this.updatePantryAppointment(args);
        case "get_notifications":
          return await this.getNotifications(args);
        case "get_user_profile":
          return await this.getUserProfile(args);
        case "update_user_profile":
          return await this.updateUserProfile(args);
        case "get_user_preferences":
          return await this.getUserPreferences(args);
        case "get_frequent_items":
          return await this.getFrequentItems(args);
        case "generate_pantry_cart":
          return await this.generatePantryCart(args);
        case "get_dining_deals":
          return await this.getDiningDeals(args);
        case "get_event_food":
          return await this.getEventFood(args);
        case "get_event_food_details":
          return await this.getEventFoodDetails(args);
        case "get_event_food_today":
          return await this.getEventFoodToday(args);
        case "get_upcoming_event_food":
          return await this.getUpcomingEventFood(args);
        case "get_provider_event_food":
          return await this.getProviderEventFood(args);
        case "get_provider_listings_dashboard":
          return await this.getProviderListingsDashboard(args);
        case "get_provider_my_listings":
          return await this.getProviderMyListings(args);
        case "create_listing":
          return await this.createListing(args);
        case "get_calendar_status":
          return await this.getCalendarStatus();
        case "disconnect_calendar":
          return await this.disconnectCalendar();
        case "add_to_calendar":
          return await this.addToCalendar(args);
        case "get_provider_reservations":
          return await this.getProviderReservations(args);
        case "get_provider_metrics":
          return await this.getProviderMetrics();
        case "get_volunteer_signups":
          return await this.getVolunteerSignups(args);
        case "cancel_volunteer_signup":
          return await this.cancelVolunteerSignup(args);
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

  private async searchFood(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.search) params.append("search", args.search);
    if (args.dietary_filters?.length) {
      params.append("dietary_tags", args.dietary_filters.join(","));
    }
    if (args.category) params.append("category", args.category);
    if (args.available_now) params.append("available_now", "true");
    if (args.max_price !== undefined) params.append("max_price", args.max_price);
    if (args.min_price !== undefined) params.append("min_price", args.min_price);
    if (args.provider_id) params.append("provider_id", args.provider_id);
    if (args.page) params.append("page", args.page);
    if (args.limit) params.append("limit", args.limit);

    const response = await this.apiClient.get(`/listings?${params.toString()}`);
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async getListingDetails(args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.get(`/listings/${args.listing_id}`);
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async reserveFood(args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.post("/reservations", {
      listing_id: args.listing_id,
      quantity: args.quantity,
      pickup_time: args.pickup_time,
      notes: args.notes,
    });
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async cancelReservation(args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.delete(`/reservations/${args.reservation_id}`);
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async getPantrySlots(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.date) params.append("date", args.date);

    const response = await this.apiClient.get(`/pantry/appointments/slots?${params.toString()}`);
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async getPantryAppointments(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.status) params.append("status", args.status);
    if (args.upcoming !== undefined) params.append("upcoming", args.upcoming.toString());
    if (args.limit) params.append("limit", args.limit.toString());

    const response = await this.apiClient.get(`/pantry/appointments?${params.toString()}`);
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async bookPantry(args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.post("/pantry/appointments", {
      appointment_time: args.appointment_time,
      duration_minutes: args.duration_minutes || 30,
      notes: args.notes,
    });
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async cancelPantryAppointment(args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.delete(`/pantry/appointments/cancel-by-datetime`, {
      params: {
        date: args.date,
        time: args.time,
      },
    });
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async getPantryAppointmentById(args: Record<string, any>): Promise<ToolResult> {
    if (!args.appointment_id) {
      return { success: false, error: "appointment_id is required" };
    }
    const response = await this.apiClient.get(`/pantry/appointments/${args.appointment_id}`);
    return { success: true, data: response.data.data };
  }

  private async updatePantryAppointment(args: Record<string, any>): Promise<ToolResult> {
    if (!args.appointment_id) {
      return { success: false, error: "appointment_id is required" };
    }
    const { appointment_id, ...body } = args;
    const response = await this.apiClient.put(`/pantry/appointments/${appointment_id}`, body);
    return { success: true, data: response.data.data };
  }

  private async getNotifications(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.is_read !== undefined) params.append("is_read", args.is_read);
    if (args.limit) params.append("limit", args.limit);

    const response = await this.apiClient.get(`/notifications?${params.toString()}`);
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async getUserProfile(_args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.get("/users/profile");
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async updateUserProfile(args: Record<string, any>): Promise<ToolResult> {
    const updatePayload: Record<string, any> = {};

    if (args.email !== undefined) {
      updatePayload.email = args.email;
    }
    if (args.dietary_preferences !== undefined) {
      updatePayload.dietary_preferences = args.dietary_preferences;
    }
    if (args.allergies !== undefined) {
      updatePayload.allergies = args.allergies;
    }
    if (args.preferred_food_types !== undefined) {
      updatePayload.preferred_food_types = args.preferred_food_types;
    }
    if (args.phone !== undefined) {
      updatePayload.phone = args.phone;
    }
    if (args.location !== undefined) {
      updatePayload.location = args.location;
    }

    const response = await this.apiClient.put("/users/profile", updatePayload);
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async getUserPreferences(_args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.get(`/preferences/user/${this.context.userId}`);
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async getFrequentItems(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit);

    const response = await this.apiClient.get(
      `/preferences/frequent-items/${this.context.userId}?${params.toString()}`
    );
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async generatePantryCart(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.include_frequent !== undefined) {
      params.append("include_frequent", args.include_frequent.toString());
    }
    if (args.respect_preferences !== undefined) {
      params.append("respect_preferences", args.respect_preferences.toString());
    }
    if (args.max_items !== undefined) {
      params.append("max_items", args.max_items.toString());
    }

    const response = await this.apiClient.get(
      `/pantry/cart/generate?${params.toString()}`
    );
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async getDiningDeals(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    params.append("category", "deal");
    if (args.limit) params.append("limit", args.limit);

    const response = await this.apiClient.get(`/listings?${params.toString()}`);
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async getEventFood(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.page) params.append("page", args.page);
    if (args.limit) params.append("limit", args.limit);
    if (args.available_now) params.append("available_now", "true");

    const response = await this.apiClient.get(`/event-food?${params.toString()}`);
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async getEventFoodDetails(args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.get(`/event-food/${args.listing_id}`);
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async getEventFoodToday(_args: Record<string, any>): Promise<ToolResult> {
    const response = await this.apiClient.get("/event-food/today");
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async getUpcomingEventFood(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.days) params.append("days", args.days);

    const response = await this.apiClient.get(`/event-food/upcoming?${params.toString()}`);
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async getProviderEventFood(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.page) params.append("page", args.page);
    if (args.limit) params.append("limit", args.limit);

    const response = await this.apiClient.get(
      `/event-food/provider/${args.provider_id}?${params.toString()}`
    );
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async getProviderListingsDashboard(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.status) params.append("status", args.status);
    if (args.category) params.append("category", args.category);
    if (args.page !== undefined) params.append("page", String(args.page));
    if (args.limit !== undefined) params.append("limit", String(args.limit));

    const query = params.toString();
    const response = await this.apiClient.get(
      `/listings/provider/dashboard${query ? `?${query}` : ""}`
    );
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async getProviderMyListings(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.status) params.append("status", args.status);
    if (args.page !== undefined) params.append("page", String(args.page));
    if (args.limit !== undefined) params.append("limit", String(args.limit));

    const query = params.toString();
    const response = await this.apiClient.get(
      `/listings/provider/my-listings${query ? `?${query}` : ""}`
    );
    return {
      success: true,
      data: response.data.data,
    };
  }

  private async createListing(args: Record<string, any>): Promise<ToolResult> {
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
    });
    return { success: true, data: response.data.data };
  }

  private async getCalendarStatus(): Promise<ToolResult> {
    const response = await this.apiClient.get("/auth/google/calendar/status");
    return { success: true, data: response.data };
  }

  private async disconnectCalendar(): Promise<ToolResult> {
    await this.apiClient.delete("/auth/google/calendar");
    return { success: true, data: { disconnected: true } };
  }

  private async addToCalendar(args: Record<string, any>): Promise<ToolResult> {
    try {
      const response = await this.apiClient.post("/auth/google/calendar/events", {
        title: args.title,
        start_time: args.start_time,
        end_time: args.end_time,
        description: args.description,
      });
      return { success: true, data: response.data.data };
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

  private async getProviderReservations(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.status) params.append("status", args.status);
    if (args.date) params.append("date", args.date);
    if (args.page) params.append("page", String(args.page));
    if (args.limit) params.append("limit", String(args.limit));
    const qs = params.toString();
    const response = await this.apiClient.get(`/reservations/provider/all${qs ? `?${qs}` : ""}`);
    return { success: true, data: response.data.data, total: response.data.total };
  }

  private async getProviderMetrics(): Promise<ToolResult> {
    const response = await this.apiClient.get("/metrics/provider");
    return { success: true, data: response.data.data };
  }

  private async getVolunteerSignups(args: Record<string, any>): Promise<ToolResult> {
    const params = new URLSearchParams();
    if (args.status) params.append("status", args.status);
    const response = await this.apiClient.get(
      `/volunteer/participation/${this.context.userId}?${params.toString()}`
    );
    return { success: true, data: response.data.data };
  }

  private async cancelVolunteerSignup(args: Record<string, any>): Promise<ToolResult> {
    if (!args.participation_id) {
      return { success: false, error: "participation_id is required" };
    }
    const response = await this.apiClient.delete(`/volunteer/signup/${args.participation_id}`);
    return { success: true, data: response.data.data };
  }
}
