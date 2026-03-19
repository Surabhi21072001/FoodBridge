/**
 * Event Food Controller
 * Handles event food discovery and management endpoints
 */

import { Request, Response } from 'express';
import { ListingService } from '../services/listingService';

export class EventFoodController {
  private listingService: ListingService;

  constructor() {
    this.listingService = new ListingService();
  }

  /**
   * Get event food listings
   * GET /api/event-food
   */
  getEventFood = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const availableNow = req.query.available_now === 'true';
      const dietaryFilters = req.query.dietary_filters
        ? (req.query.dietary_filters as string).split(',')
        : undefined;

      const { listings, total } = await this.listingService.listListings({
        category: 'event_food',
        available_now: availableNow,
        dietary_tags: dietaryFilters,
        page,
        limit,
      });

      // Transform backend format to frontend format
      const transformedListings = listings.map((listing: any) => ({
        listing_id: listing.id,
        provider_id: listing.provider_id,
        food_name: listing.title,
        description: listing.description,
        quantity: listing.quantity_available,
        available_quantity: listing.quantity_available,
        location: listing.pickup_location,
        pickup_window_start: listing.available_from,
        pickup_window_end: listing.available_until,
        food_type: listing.cuisine_type || listing.category,
        dietary_tags: listing.dietary_tags || [],
        listing_type: 'event',
        status: listing.status,
        image_url: listing.image_urls?.[0],
        created_at: listing.created_at,
        updated_at: listing.updated_at,
      }));

      res.status(200).json({
        success: true,
        data: {
          listings: transformedListings,
          total,
          page,
          limit,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get event food',
      });
    }
  };

  /**
   * Get event food available today
   * GET /api/event-food/today
   */
  getEventFoodToday = async (_req: Request, res: Response): Promise<void> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { listings } = await this.listingService.listListings({
        category: 'event_food',
        available_now: true,
        page: 1,
        limit: 50,
      });

      // Filter for today's events
      const todayEvents = listings.filter((listing) => {
        const availableFrom = new Date(listing.available_from);
        const availableUntil = new Date(listing.available_until);
        return availableFrom < tomorrow && availableUntil > today;
      });

      // Transform backend format to frontend format
      const transformedListings = todayEvents.map((listing: any) => ({
        listing_id: listing.id,
        provider_id: listing.provider_id,
        food_name: listing.title,
        description: listing.description,
        quantity: listing.quantity_available,
        available_quantity: listing.quantity_available,
        location: listing.pickup_location,
        pickup_window_start: listing.available_from,
        pickup_window_end: listing.available_until,
        food_type: listing.cuisine_type || listing.category,
        dietary_tags: listing.dietary_tags || [],
        listing_type: 'event',
        status: listing.status,
        image_url: listing.image_urls?.[0],
        created_at: listing.created_at,
        updated_at: listing.updated_at,
      }));

      res.status(200).json({
        success: true,
        data: {
          listings: transformedListings,
          total: transformedListings.length,
          date: today.toISOString().split('T')[0],
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get today\'s event food',
      });
    }
  };

  /**
   * Get upcoming event food
   * GET /api/event-food/upcoming
   */
  getUpcomingEventFood = async (req: Request, res: Response): Promise<void> => {
    try {
      const days = parseInt(req.query.days as string) || 7;

      const { listings } = await this.listingService.listListings({
        category: 'event_food',
        page: 1,
        limit: 50,
      });

      // Filter for upcoming events
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const upcomingEvents = listings.filter((listing) => {
        const availableFrom = new Date(listing.available_from);
        return availableFrom > now && availableFrom < futureDate;
      });

      // Transform backend format to frontend format
      const transformedListings = upcomingEvents.map((listing: any) => ({
        listing_id: listing.id,
        provider_id: listing.provider_id,
        food_name: listing.title,
        description: listing.description,
        quantity: listing.quantity_available,
        available_quantity: listing.quantity_available,
        location: listing.pickup_location,
        pickup_window_start: listing.available_from,
        pickup_window_end: listing.available_until,
        food_type: listing.cuisine_type || listing.category,
        dietary_tags: listing.dietary_tags || [],
        listing_type: 'event',
        status: listing.status,
        image_url: listing.image_urls?.[0],
        created_at: listing.created_at,
        updated_at: listing.updated_at,
      }));

      res.status(200).json({
        success: true,
        data: {
          listings: transformedListings,
          total: transformedListings.length,
          days,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get upcoming event food',
      });
    }
  };

  /**
   * Get event food details
   * GET /api/event-food/:id
   */
  getEventFoodDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const listing = await this.listingService.getListingById(id);

      if (listing.category !== 'event_food') {
        res.status(404).json({
          success: false,
          message: 'Event food not found',
        });
        return;
      }

      // Transform backend format to frontend format
      const transformedListing = {
        listing_id: listing.id,
        provider_id: listing.provider_id,
        food_name: listing.title,
        description: listing.description,
        quantity: listing.quantity_available,
        available_quantity: listing.quantity_available,
        location: listing.pickup_location,
        pickup_window_start: listing.available_from,
        pickup_window_end: listing.available_until,
        food_type: listing.cuisine_type || listing.category,
        dietary_tags: listing.dietary_tags || [],
        listing_type: 'event',
        status: listing.status,
        image_url: listing.image_urls?.[0],
        created_at: listing.created_at,
        updated_at: listing.updated_at,
      };

      res.status(200).json({
        success: true,
        data: transformedListing,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Event food not found',
      });
    }
  };

  /**
   * Get event food from a specific provider
   * GET /api/event-food/provider/:providerId
   */
  getProviderEventFood = async (req: Request, res: Response): Promise<void> => {
    try {
      const { providerId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { listings, total } = await this.listingService.listListings({
        provider_id: providerId,
        category: 'event_food',
        page,
        limit,
      });

      // Transform backend format to frontend format
      const transformedListings = listings.map((listing: any) => ({
        listing_id: listing.id,
        provider_id: listing.provider_id,
        food_name: listing.title,
        description: listing.description,
        quantity: listing.quantity_available,
        available_quantity: listing.quantity_available,
        location: listing.pickup_location,
        pickup_window_start: listing.available_from,
        pickup_window_end: listing.available_until,
        food_type: listing.cuisine_type || listing.category,
        dietary_tags: listing.dietary_tags || [],
        listing_type: 'event',
        status: listing.status,
        image_url: listing.image_urls?.[0],
        created_at: listing.created_at,
        updated_at: listing.updated_at,
      }));

      res.status(200).json({
        success: true,
        data: {
          listings: transformedListings,
          total,
          page,
          limit,
          providerId,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get provider event food',
      });
    }
  };
}
