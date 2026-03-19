/**
 * Agent Preference Service
 * Integrates the AI agent with the user preference learning system
 * Retrieves and applies user preferences for personalized recommendations
 */

import { PreferenceService } from './preferenceService';
import { ListingService } from './listingService';
import { UserRepository } from '../repositories/userRepository';
import { NotFoundError } from '../utils/errors';

export interface UserPreferenceContext {
  dietary_restrictions: string[];
  allergies: string[];
  favorite_cuisines: string[];
  preferred_providers: string[];
  frequent_items: any[];
  frequent_providers: any[];
}

export class AgentPreferenceService {
  private preferenceService: PreferenceService;
  private listingService: ListingService;
  private userRepository: UserRepository;

  constructor() {
    this.preferenceService = new PreferenceService();
    this.listingService = new ListingService();
    this.userRepository = new UserRepository();
  }

  /**
   * Get complete preference context for a user
   * Used by the agent to personalize responses
   */
  async getUserPreferenceContext(userId: string): Promise<UserPreferenceContext> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get user preferences
      const preferences = await this.preferenceService.getUserPreferences(userId);

      // Get frequent items
      const frequentItems = await this.preferenceService.getFrequentItems(userId, 10);

      // Get frequent providers
      const frequentProviders = await this.preferenceService.getFrequentProviders(userId, 5);

      return {
        dietary_restrictions: preferences.dietary_restrictions || [],
        allergies: preferences.allergies || [],
        favorite_cuisines: preferences.favorite_cuisines || [],
        preferred_providers: preferences.preferred_providers || [],
        frequent_items: frequentItems,
        frequent_providers: frequentProviders,
      };
    } catch (error: any) {
      // Return empty context if user not found
      return {
        dietary_restrictions: [],
        allergies: [],
        favorite_cuisines: [],
        preferred_providers: [],
        frequent_items: [],
        frequent_providers: [],
      };
    }
  }

  /**
   * Search for food with user preferences applied
   * Filters results based on dietary restrictions and allergies
   */
  async searchFoodWithPreferences(
    userId: string,
    filters?: {
      dietary_filters?: string[];
      category?: string;
      available_now?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{ listings: any[]; total: number; appliedPreferences: string[] }> {
    try {
      // Get user preferences
      const preferences = await this.preferenceService.getUserPreferences(userId);

      // Combine provided filters with user preferences
      const combinedDietaryFilters = [
        ...(filters?.dietary_filters || []),
        ...(preferences.dietary_restrictions || []),
      ];

      // Remove duplicates
      const uniqueFilters = [...new Set(combinedDietaryFilters)];

      // Search with combined filters
      const { listings, total } = await this.listingService.listListings({
        dietary_tags: uniqueFilters.length > 0 ? uniqueFilters : undefined,
        category: filters?.category,
        available_now: filters?.available_now,
        page: filters?.page || 1,
        limit: filters?.limit || 10,
      });

      // Track filter application
      await this.preferenceService.trackFilterApplication(userId, {
        dietary_filters: uniqueFilters,
        category: filters?.category,
      });

      return {
        listings,
        total,
        appliedPreferences: uniqueFilters,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get personalized recommendations for a user
   * Based on frequent items and preferences
   */
  async getPersonalizedRecommendations(
    userId: string,
    maxItems: number = 10
  ): Promise<{
    recommendations: any[];
    source: 'frequent_items' | 'preferences' | 'popular';
  }> {
    try {
      // Get recommendations from preference service
      const recommendations = await this.preferenceService.getRecommendations(userId, maxItems);

      // Determine source
      let source: 'frequent_items' | 'preferences' | 'popular' = 'popular';
      if (recommendations.length > 0) {
        if (recommendations[0].frequency) {
          source = 'frequent_items';
        } else {
          source = 'preferences';
        }
      }

      return {
        recommendations,
        source,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get dining deals filtered by user preferences
   */
  async getPersonalizedDeals(
    userId: string,
    limit: number = 10
  ): Promise<{ deals: any[]; matchedPreferences: string[] }> {
    try {
      // Get user preferences
      const preferences = await this.preferenceService.getUserPreferences(userId);

      // Get all deals
      const { listings: deals } = await this.listingService.listListings({
        category: 'deal',
        available_now: true,
        limit,
      });

      // Filter deals that match user preferences
      const matchedDeals = deals.filter((deal) => {
        // If user has dietary restrictions, check if deal matches
        if (preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
          const dealTags = deal.dietary_tags || [];
          return preferences.dietary_restrictions.some((restriction) =>
            dealTags.includes(restriction)
          );
        }
        return true;
      });

      return {
        deals: matchedDeals.length > 0 ? matchedDeals : deals,
        matchedPreferences: preferences.dietary_restrictions || [],
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get event food filtered by user preferences
   */
  async getPersonalizedEventFood(
    userId: string,
    limit: number = 10
  ): Promise<{ eventFood: any[]; matchedPreferences: string[] }> {
    try {
      // Get user preferences
      const preferences = await this.preferenceService.getUserPreferences(userId);

      // Get all event food
      const { listings: eventFood } = await this.listingService.listListings({
        category: 'event_food',
        available_now: true,
        limit,
      });

      // Filter event food that matches user preferences
      const matchedEventFood = eventFood.filter((food) => {
        // If user has dietary restrictions, check if food matches
        if (preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
          const foodTags = food.dietary_tags || [];
          return preferences.dietary_restrictions.some((restriction) =>
            foodTags.includes(restriction)
          );
        }
        return true;
      });

      return {
        eventFood: matchedEventFood.length > 0 ? matchedEventFood : eventFood,
        matchedPreferences: preferences.dietary_restrictions || [],
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Update user preferences based on agent interaction
   */
  async updatePreferencesFromAgent(
    userId: string,
    updates: {
      dietary_restrictions?: string[];
      allergies?: string[];
      favorite_cuisines?: string[];
      preferred_providers?: string[];
    }
  ): Promise<void> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Update preferences
      await this.preferenceService.updateUserPreferences(userId, updates);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Track a pantry selection for preference learning
   */
  async trackPantrySelection(
    userId: string,
    inventoryId: string,
    quantity: number
  ): Promise<void> {
    try {
      await this.preferenceService.trackPantrySelection(userId, inventoryId, quantity);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Track a reservation for preference learning
   */
  async trackReservation(
    userId: string,
    providerId: string,
    listingTitle: string,
    category: string
  ): Promise<void> {
    try {
      await this.preferenceService.trackReservation(userId, providerId, listingTitle, category);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get preference summary for agent context
   * Returns a human-readable summary of user preferences
   */
  async getPreferenceSummary(userId: string): Promise<string> {
    try {
      const context = await this.getUserPreferenceContext(userId);

      const parts: string[] = [];

      if (context.dietary_restrictions.length > 0) {
        parts.push(`Dietary restrictions: ${context.dietary_restrictions.join(', ')}`);
      }

      if (context.allergies.length > 0) {
        parts.push(`Allergies: ${context.allergies.join(', ')}`);
      }

      if (context.favorite_cuisines.length > 0) {
        parts.push(`Favorite cuisines: ${context.favorite_cuisines.join(', ')}`);
      }

      if (context.frequent_items.length > 0) {
        const itemNames = context.frequent_items.slice(0, 3).map((item) => item.item_name);
        parts.push(`Frequently selects: ${itemNames.join(', ')}`);
      }

      if (context.frequent_providers.length > 0) {
        const providerNames = context.frequent_providers
          .slice(0, 2)
          .map((provider) => provider.provider_name);
        parts.push(`Preferred providers: ${providerNames.join(', ')}`);
      }

      return parts.length > 0 ? parts.join('. ') : 'No preferences set yet.';
    } catch (error: any) {
      return 'Unable to retrieve preferences.';
    }
  }
}

// Export singleton instance
export const agentPreferenceService = new AgentPreferenceService();
