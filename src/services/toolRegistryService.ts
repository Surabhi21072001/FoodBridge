/**
 * Tool Registry Service
 * Centralized registry mapping tool names to implementations
 * Used by the AI agent orchestrator to dynamically call tools
 */

import { ListingService } from './listingService';
import { ReservationService } from './reservationService';
import { PantryAppointmentService } from './pantryAppointmentService';
import { NotificationService } from './notificationService';
import { PreferenceService } from './preferenceService';

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class ToolRegistryService {
  private listingService: ListingService;
  private reservationService: ReservationService;
  private appointmentService: PantryAppointmentService;
  private notificationService: NotificationService;
  private preferenceService: PreferenceService;

  constructor() {
    this.listingService = new ListingService();
    this.reservationService = new ReservationService();
    this.appointmentService = new PantryAppointmentService();
    this.notificationService = new NotificationService();
    this.preferenceService = new PreferenceService();
  }

  /**
   * Execute a tool by name with given arguments
   */
  async executeTool(
    toolName: string,
    args: Record<string, any>,
    userId: string
  ): Promise<ToolResult> {
    try {
      switch (toolName) {
        case 'search_food':
          return await this.searchFood(args, userId);
        case 'get_listing_details':
          return await this.getListingDetails(args as { listing_id: string });
        case 'reserve_food':
          return await this.reserveFood(args as { listing_id: string; quantity: number; pickup_time?: string; notes?: string }, userId);
        case 'cancel_reservation':
          return await this.cancelReservation(args as { reservation_id: string }, userId);
        case 'get_pantry_slots':
          return await this.getPantrySlots(args);
        case 'book_pantry':
          return await this.bookPantry(args as { appointment_time: string; duration_minutes?: number; notes?: string }, userId);
        case 'get_notifications':
          return await this.getNotifications(args, userId);
        case 'get_user_preferences':
          return await this.getUserPreferences(args, userId);
        case 'get_frequent_items':
          return await this.getFrequentItems(args, userId);
        case 'generate_pantry_cart':
          return await this.generatePantryCart(args, userId);
        case 'get_dining_deals':
          return await this.getDiningDeals(args);
        case 'get_event_food':
          return await this.getEventFood(args);
        default:
          return {
            success: false,
            error: `Unknown tool: ${toolName}`,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Tool execution failed',
      };
    }
  }

  /**
   * Search for food listings with optional filters
   */
  private async searchFood(
    args: {
      dietary_filters?: string[];
      category?: string;
      available_now?: boolean;
      page?: number;
      limit?: number;
    },
    userId: string
  ): Promise<ToolResult> {
    try {
      // Track filter application for preference learning
      if (args.dietary_filters) {
        await this.preferenceService.trackFilterApplication(userId, {
          dietary_filters: args.dietary_filters,
        });
      }

      const { listings, total } = await this.listingService.listListings({
        dietary_tags: args.dietary_filters,
        category: args.category,
        available_now: args.available_now,
        page: args.page || 1,
        limit: args.limit || 10,
      });

      return {
        success: true,
        data: {
          listings,
          total,
          page: args.page || 1,
          limit: args.limit || 10,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get details for a specific food listing
   */
  private async getListingDetails(args: {
    listing_id: string;
  }): Promise<ToolResult> {
    try {
      const listing = await this.listingService.getListingById(args.listing_id);
      return {
        success: true,
        data: listing,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a food reservation
   */
  private async reserveFood(
    args: {
      listing_id: string;
      quantity: number;
      pickup_time?: string;
      notes?: string;
    },
    userId: string
  ): Promise<ToolResult> {
    try {
      const listing = await this.listingService.getListingById(args.listing_id);

      const reservation = await this.reservationService.createReservation(userId, {
        listing_id: args.listing_id,
        quantity: args.quantity,
        pickup_time: args.pickup_time ? new Date(args.pickup_time) : undefined,
        notes: args.notes,
      });

      // Track reservation for preference learning
      await this.preferenceService.trackReservation(
        userId,
        listing.provider_id,
        listing.title,
        listing.category
      );

      return {
        success: true,
        data: reservation,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel an existing reservation
   */
  private async cancelReservation(
    args: {
      reservation_id: string;
    },
    userId: string
  ): Promise<ToolResult> {
    try {
      await this.reservationService.cancelReservation(args.reservation_id, userId);
      return {
        success: true,
        data: {
          message: 'Reservation cancelled successfully',
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get available pantry appointment time slots
   */
  private async getPantrySlots(args: {
    date?: string;
  }): Promise<ToolResult> {
    try {
      const date = args.date ? new Date(args.date) : new Date();
      const slots = await this.appointmentService.getAvailableSlots(date);

      return {
        success: true,
        data: {
          date: date.toISOString().split('T')[0],
          slots,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Book a pantry appointment
   */
  private async bookPantry(
    args: {
      appointment_time: string;
      duration_minutes?: number;
      notes?: string;
    },
    userId: string
  ): Promise<ToolResult> {
    try {
      const appointment = await this.appointmentService.createAppointment(userId, {
        appointment_time: new Date(args.appointment_time),
        duration_minutes: args.duration_minutes || 30,
        notes: args.notes,
      });

      return {
        success: true,
        data: appointment,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user notifications
   */
  private async getNotifications(
    args: {
      is_read?: boolean;
      limit?: number;
    },
    userId: string
  ): Promise<ToolResult> {
    try {
      const notificationsResult = await this.notificationService.getUserNotifications(userId, {
        is_read: args.is_read,
        limit: args.limit || 10,
      });

      return {
        success: true,
        data: {
          notifications: notificationsResult.notifications,
          count: notificationsResult.notifications.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user's dietary preferences and restrictions
   */
  private async getUserPreferences(
    _args: Record<string, any>,
    userId: string
  ): Promise<ToolResult> {
    try {
      const preferences = await this.preferenceService.getUserPreferences(userId);

      return {
        success: true,
        data: {
          dietary_restrictions: preferences.dietary_restrictions,
          allergies: preferences.allergies,
          favorite_cuisines: preferences.favorite_cuisines,
          preferred_providers: preferences.preferred_providers,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user's frequently selected pantry items
   */
  private async getFrequentItems(
    args: {
      limit?: number;
    },
    userId: string
  ): Promise<ToolResult> {
    try {
      const items = await this.preferenceService.getFrequentItems(userId, args.limit || 10);

      return {
        success: true,
        data: {
          items,
          count: items.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate a smart pantry cart based on user history and preferences
   */
  private async generatePantryCart(
    args: {
      include_frequent?: boolean;
      respect_preferences?: boolean;
    },
    userId: string
  ): Promise<ToolResult> {
    try {
      const includeFrequent = args.include_frequent !== false;
      const respectPreferences = args.respect_preferences !== false;

      let recommendedItems: any[] = [];

      if (includeFrequent) {
        // Get frequently selected items
        const frequentItems = await this.preferenceService.getFrequentItems(userId, 10);
        recommendedItems = frequentItems;
      }

      if (respectPreferences && recommendedItems.length === 0) {
        // Get recommendations based on preferences
        const recommendations = await this.preferenceService.getRecommendations(userId, 10);
        recommendedItems = recommendations;
      }

      return {
        success: true,
        data: {
          recommendedItems,
          count: recommendedItems.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get current dining deals and special offers
   */
  private async getDiningDeals(args: {
    limit?: number;
  }): Promise<ToolResult> {
    try {
      const { listings } = await this.listingService.listListings({
        category: 'deal',
        available_now: true,
        limit: args.limit || 10,
      });

      return {
        success: true,
        data: {
          deals: listings,
          count: listings.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get event food listings
   */
  private async getEventFood(args: {
    limit?: number;
  }): Promise<ToolResult> {
    try {
      const { listings } = await this.listingService.listListings({
        category: 'event_food',
        available_now: true,
        limit: args.limit || 10,
      });

      return {
        success: true,
        data: {
          eventFood: listings,
          count: listings.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get list of all available tools
   */
  getAvailableTools(): string[] {
    return [
      'search_food',
      'get_listing_details',
      'reserve_food',
      'cancel_reservation',
      'get_pantry_slots',
      'book_pantry',
      'get_notifications',
      'get_user_preferences',
      'get_frequent_items',
      'generate_pantry_cart',
      'get_dining_deals',
      'get_event_food',
    ];
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistryService();
