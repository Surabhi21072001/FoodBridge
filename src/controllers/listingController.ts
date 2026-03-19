import { Response, NextFunction } from 'express';
import { ListingService } from '../services/listingService';
import { AuthRequest } from '../middleware/auth';
import { successResponse, paginatedResponse } from '../utils/response';

export class ListingController {
  private listingService: ListingService;

  constructor() {
    this.listingService = new ListingService();
  }

  createListing = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const providerId = req.user!.id;
      const listing = await this.listingService.createListing(providerId, req.body);
      successResponse(res, listing, 'Listing created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getListing = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const listing = await this.listingService.getListingById(id);
      
      // Transform backend schema to frontend schema
      const transformed = {
        listing_id: listing.id,
        provider_id: listing.provider_id,
        food_name: listing.title,
        description: listing.description || '',
        quantity: listing.quantity_available + listing.quantity_reserved,
        available_quantity: listing.quantity_available,
        location: listing.pickup_location,
        pickup_window_start: listing.available_from,
        pickup_window_end: listing.available_until,
        food_type: listing.cuisine_type || listing.category,
        dietary_tags: listing.dietary_tags || [],
        listing_type: listing.category === 'event_food' ? 'event' : listing.category === 'deal' ? 'dining_deal' : 'donation',
        status: listing.status,
        created_at: listing.created_at,
        updated_at: listing.updated_at,
      };
      
      successResponse(res, transformed, 'Listing retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateListing = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const providerId = req.user!.id;
      const listing = await this.listingService.updateListing(id, providerId, req.body);
      successResponse(res, listing, 'Listing updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteListing = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const providerId = req.user!.id;
      await this.listingService.deleteListing(id, providerId);
      successResponse(res, null, 'Listing deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  listListings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { category, status, dietary_tags, available_now, location, search, max_price, min_price, provider_id, page = 1, limit = 20 } = req.query;
      
      // Parse dietary_tags from comma-separated string to array
      let parsedDietaryTags: string[] | undefined;
      if (dietary_tags) {
        if (typeof dietary_tags === 'string') {
          parsedDietaryTags = dietary_tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else if (Array.isArray(dietary_tags)) {
          parsedDietaryTags = dietary_tags.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
        }
      }
      
      const result = await this.listingService.listListings({
        category: category as string,
        status: status as string,
        dietary_tags: parsedDietaryTags,
        available_now: available_now === 'true',
        location: location as string,
        search: search as string,
        max_price: max_price ? Number(max_price) : undefined,
        min_price: min_price ? Number(min_price) : undefined,
        provider_id: provider_id as string,
        page: Number(page),
        limit: Number(limit),
      });

      // Transform backend schema to frontend schema
      const transformedListings = result.listings.map((listing: any) => ({
        listing_id: listing.id,
        provider_id: listing.provider_id,
        food_name: listing.title,
        description: listing.description || '',
        quantity: listing.quantity_available + listing.quantity_reserved,
        available_quantity: listing.quantity_available,
        location: listing.pickup_location,
        pickup_window_start: listing.available_from,
        pickup_window_end: listing.available_until,
        food_type: listing.cuisine_type || listing.category,
        dietary_tags: listing.dietary_tags || [],
        allergen_info: listing.allergen_info || [],
        listing_type: listing.category === 'event_food' ? 'event' : listing.category === 'deal' ? 'dining_deal' : 'donation',
        status: listing.status,
        image_url: listing.image_urls && listing.image_urls.length > 0 ? listing.image_urls[0] : undefined,
        created_at: listing.created_at,
        updated_at: listing.updated_at,
      }));

      paginatedResponse(res, transformedListings, Number(page), Number(limit), result.total);
    } catch (error) {
      next(error);
    }
  };

  getProviderListingsDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const providerId = req.user!.id;
      const { status, category, page = 1, limit = 20 } = req.query;

      const result = await this.listingService.getProviderListingsWithStats(providerId, {
        status: status as string,
        category: category as string,
        page: Number(page),
        limit: Number(limit),
      });

      const transformedListings = result.listings.map((listing: any) => ({
        listing_id: listing.id,
        provider_id: listing.provider_id,
        food_name: listing.title,
        description: listing.description || '',
        quantity: listing.quantity_available,
        available_quantity: listing.quantity_available - listing.quantity_reserved,
        quantity_reserved: listing.quantity_reserved,
        location: listing.pickup_location,
        pickup_window_start: listing.available_from,
        pickup_window_end: listing.available_until,
        food_type: listing.cuisine_type || listing.category,
        category: listing.category,
        dietary_tags: listing.dietary_tags || [],
        allergen_info: listing.allergen_info || [],
        listing_type: listing.category === 'event_food' ? 'event' : listing.category === 'deal' ? 'dining_deal' : 'donation',
        status: listing.status,
        is_available_now: listing.is_available_now,
        image_url: listing.image_urls && listing.image_urls.length > 0 ? listing.image_urls[0] : undefined,
        image_urls: listing.image_urls || [],
        original_price: listing.original_price,
        discounted_price: listing.discounted_price,
        // Reservation stats
        total_reservations: parseInt(listing.total_reservations) || 0,
        confirmed_reservations: parseInt(listing.confirmed_reservations) || 0,
        completed_reservations: parseInt(listing.completed_reservations) || 0,
        total_reserved_quantity: parseInt(listing.total_reserved_quantity) || 0,
        created_at: listing.created_at,
        updated_at: listing.updated_at,
      }));

      res.json({
        success: true,
        data: transformedListings,
        summary: result.summary,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          total_pages: Math.ceil(result.total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getProviderListings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const providerId = req.user!.id;
      const { status, page = 1, limit = 20 } = req.query;

      const result = await this.listingService.getProviderListings(providerId, {
        status: status as string,
        page: Number(page),
        limit: Number(limit),
      });

      // Transform backend schema to frontend schema
      const transformedListings = result.listings.map((listing: any) => ({
        listing_id: listing.id,
        provider_id: listing.provider_id,
        food_name: listing.title,
        description: listing.description || '',
        quantity: listing.quantity_available + listing.quantity_reserved,
        available_quantity: listing.quantity_available,
        location: listing.pickup_location,
        pickup_window_start: listing.available_from,
        pickup_window_end: listing.available_until,
        food_type: listing.cuisine_type || listing.category,
        dietary_tags: listing.dietary_tags || [],
        allergen_info: listing.allergen_info || [],
        listing_type: listing.category === 'event_food' ? 'event' : listing.category === 'deal' ? 'dining_deal' : 'donation',
        status: listing.status,
        image_url: listing.image_urls && listing.image_urls.length > 0 ? listing.image_urls[0] : undefined,
        created_at: listing.created_at,
        updated_at: listing.updated_at,
      }));

      paginatedResponse(res, transformedListings, Number(page), Number(limit), result.total);
    } catch (error) {
      next(error);
    }
  };
}
