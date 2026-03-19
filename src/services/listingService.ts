import { ListingRepository } from '../repositories/listingRepository';
import { UserRepository } from '../repositories/userRepository';
import { NotificationService } from './notificationService';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { FoodListing } from '../types';
import { ProviderListingsSummary } from '../repositories/listingRepository';

export class ListingService {
  private listingRepository: ListingRepository;
  private userRepository: UserRepository;
  private notificationService: NotificationService;

  constructor() {
    this.listingRepository = new ListingRepository();
    this.userRepository = new UserRepository();
    this.notificationService = new NotificationService();
  }

  async createListing(
    providerId: string,
    listingData: Omit<FoodListing, 'id' | 'provider_id' | 'created_at' | 'updated_at' | 'status' | 'quantity_reserved'>
  ): Promise<FoodListing> {
    // Validate quantity_available is non-negative
    if (listingData.quantity_available < 0) {
      throw new BadRequestError('quantity_available must be >= 0');
    }

    if (new Date(listingData.available_from) >= new Date(listingData.available_until)) {
      throw new BadRequestError('available_until must be after available_from');
    }

    if (listingData.discounted_price && listingData.original_price) {
      if (listingData.discounted_price > listingData.original_price) {
        throw new BadRequestError('Discounted price cannot exceed original price');
      }
    }

    // Validate image URLs if provided
    if (listingData.image_urls && listingData.image_urls.length > 0) {
      for (const url of listingData.image_urls) {
        if (!this.isValidImageUrl(url)) {
          throw new BadRequestError(`Invalid image URL: ${url}`);
        }
      }
    }

    const listing = await this.listingRepository.create({
      provider_id: providerId,
      ...listingData,
    });

    // Trigger notifications to matching users asynchronously
    setImmediate(async () => {
      try {
        const provider = await this.userRepository.findById(providerId);
        const providerName = provider 
          ? `${provider.first_name} ${provider.last_name}` 
          : 'A provider';
        
        await this.notificationService.notifyMatchingUsers(listing, providerName);
      } catch (error) {
        console.error('Failed to send new listing notifications:', error);
      }
    });

    return listing;
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  async getListingById(id: string): Promise<FoodListing> {
    const listing = await this.listingRepository.findById(id);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }
    return listing;
  }

  async updateListing(
    id: string,
    providerId: string,
    updates: Partial<FoodListing>
  ): Promise<FoodListing> {
    const listing = await this.listingRepository.findById(id);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    if (listing.provider_id !== providerId) {
      throw new ForbiddenError('You can only update your own listings');
    }

    // Validate quantity_available if being updated
    if (updates.quantity_available !== undefined && updates.quantity_available < 0) {
      throw new BadRequestError('quantity_available must be >= 0');
    }

    if (updates.available_from && updates.available_until) {
      if (new Date(updates.available_from) >= new Date(updates.available_until)) {
        throw new BadRequestError('available_until must be after available_from');
      }
    }

    // Validate image URLs if provided
    if (updates.image_urls && updates.image_urls.length > 0) {
      for (const url of updates.image_urls) {
        if (!this.isValidImageUrl(url)) {
          throw new BadRequestError(`Invalid image URL: ${url}`);
        }
      }
    }

    const updatedListing = await this.listingRepository.update(id, updates);
    if (!updatedListing) {
      throw new NotFoundError('Listing not found');
    }

    return updatedListing;
  }

  async deleteListing(id: string, providerId: string): Promise<void> {
    const listing = await this.listingRepository.findById(id);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    if (listing.provider_id !== providerId) {
      throw new ForbiddenError('You can only delete your own listings');
    }

    if (listing.quantity_reserved > 0) {
      throw new BadRequestError('Cannot delete listing with active reservations');
    }

    await this.listingRepository.update(id, { status: 'cancelled' });
  }

  async listListings(filters?: {
    provider_id?: string;
    category?: string;
    status?: string;
    dietary_tags?: string[];
    available_now?: boolean;
    location?: string;
    search?: string;
    max_price?: number;
    min_price?: number;
    page?: number;
    limit?: number;
  }): Promise<{ listings: FoodListing[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    return await this.listingRepository.findAll({
      ...filters,
      limit,
      offset,
    });
  }

  async getProviderListings(
    providerId: string,
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ listings: FoodListing[]; total: number }> {
    return await this.listListings({
      provider_id: providerId,
      ...filters,
    });
  }

  async expireOldListings(): Promise<number> {
    return await this.listingRepository.expireOldListings();
  }

  async getProviderListingsWithStats(
    providerId: string,
    filters?: {
      status?: string;
      category?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ listings: any[]; total: number; summary: ProviderListingsSummary }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    return await this.listingRepository.findProviderListingsWithStats(providerId, {
      status: filters?.status,
      category: filters?.category,
      limit,
      offset,
    });
  }
}
