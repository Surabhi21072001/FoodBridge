/**
 * Smart Pantry Cart Service
 * Generates intelligent pantry cart recommendations based on user history and preferences
 */

import { PantryOrderService } from './pantryOrderService';
import { PreferenceService } from './preferenceService';
import { PantryInventoryRepository } from '../repositories/pantryInventoryRepository';

export interface CartRecommendation {
  item_id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  reason: 'frequent' | 'preference' | 'popular' | 'seasonal';
}

export interface SmartCartResult {
  recommendedItems: CartRecommendation[];
  totalItems: number;
  generatedAt: Date;
  cartId?: string;
}

export class SmartPantryCartService {
  private pantryOrderService: PantryOrderService;
  private preferenceService: PreferenceService;
  private inventoryRepository: PantryInventoryRepository;

  constructor() {
    this.pantryOrderService = new PantryOrderService();
    this.preferenceService = new PreferenceService();
    this.inventoryRepository = new PantryInventoryRepository();
  }

  /**
   * Generate a smart pantry cart based on user history and preferences
   */
  async generateSmartCart(
    userId: string,
    options?: {
      include_frequent?: boolean;
      respect_preferences?: boolean;
      max_items?: number;
    }
  ): Promise<SmartCartResult> {
    try {
      const includeFrequent = options?.include_frequent !== false;
      const respectPreferences = options?.respect_preferences !== false;
      const maxItems = options?.max_items || 10;

      const recommendations: CartRecommendation[] = [];
      const addedItemIds = new Set<string>();

      // 1. Add frequently selected items
      if (includeFrequent) {
        try {
          const frequentItems = await this.preferenceService.getFrequentItems(userId, maxItems);

          for (const item of frequentItems || []) {
            if (addedItemIds.size >= maxItems) break;

            try {
              const inventoryItem = await this.inventoryRepository.findById(item.inventory_id);
              if (inventoryItem && inventoryItem.quantity > 0) {
                recommendations.push({
                  item_id: inventoryItem.id,
                  item_name: inventoryItem.item_name,
                  category: inventoryItem.category,
                  quantity: 1,
                  unit: inventoryItem.unit,
                  reason: 'frequent',
                });
                addedItemIds.add(inventoryItem.id);
              }
            } catch (error) {
              // Skip items that can't be found
              continue;
            }
          }
        } catch (error) {
          // If getting frequent items fails, continue to next step
          console.error('Error getting frequent items:', error);
        }
      }

      // 2. Add items matching user preferences
      if (respectPreferences && addedItemIds.size < maxItems) {
        try {
          const preferences = await this.preferenceService.getUserPreferences(userId);

          // Get available inventory items
          const { items: availableItems } = await this.inventoryRepository.findAll({
            limit: maxItems * 2,
          });

          for (const item of availableItems || []) {
            if (addedItemIds.size >= maxItems) break;
            if (addedItemIds.has(item.id)) continue;

            // Check if item matches preferences
            const matchesPreferences = this.itemMatchesPreferences(item, preferences);
            if (matchesPreferences && item.quantity > 0) {
              recommendations.push({
                item_id: item.id,
                item_name: item.item_name,
                category: item.category,
                quantity: 1,
                unit: item.unit,
                reason: 'preference',
              });
              addedItemIds.add(item.id);
            }
          }
        } catch (error) {
          // If getting preferences fails, continue to next step
          console.error('Error getting user preferences:', error);
        }
      }

      // 3. Add popular items if needed
      if (addedItemIds.size < maxItems) {
        try {
          const { items: availableItems } = await this.inventoryRepository.findAll({
            limit: maxItems * 2,
          });

          for (const item of availableItems || []) {
            if (addedItemIds.size >= maxItems) break;
            if (addedItemIds.has(item.id)) continue;

            if (item.quantity > 0) {
              recommendations.push({
                item_id: item.id,
                item_name: item.item_name,
                category: item.category,
                quantity: 1,
                unit: item.unit,
                reason: 'popular',
              });
              addedItemIds.add(item.id);
            }
          }
        } catch (error) {
          // If getting popular items fails, return what we have
          console.error('Error getting popular items:', error);
        }
      }

      return {
        recommendedItems: recommendations,
        totalItems: recommendations.length,
        generatedAt: new Date(),
      };
    } catch (error: any) {
      console.error('Error in generateSmartCart:', error);
      throw new Error(`Failed to generate smart cart: ${error.message}`);
    }
  }

  /**
   * Generate and add items to cart
   */
  async generateAndAddToCart(
    userId: string,
    options?: {
      include_frequent?: boolean;
      respect_preferences?: boolean;
      max_items?: number;
    }
  ): Promise<SmartCartResult> {
    try {
      // Generate recommendations
      const cartResult = await this.generateSmartCart(userId, options);

      // Create or get cart
      const cart = await this.pantryOrderService.getOrCreateCart(userId);
      cartResult.cartId = cart.id;

      // Add items to cart
      for (const item of cartResult.recommendedItems) {
        try {
          await this.pantryOrderService.addItemToCart(userId, item.item_id, item.quantity);
        } catch (error) {
          // Skip items that can't be added
          console.error(`Failed to add item ${item.item_id} to cart:`, error);
        }
      }

      return cartResult;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get user's usual pantry items
   * Returns items the user frequently selects
   */
  async getUserUsualItems(userId: string, limit: number = 10): Promise<CartRecommendation[]> {
    try {
      const frequentItems = await this.preferenceService.getFrequentItems(userId, limit);

      const recommendations: CartRecommendation[] = [];

      for (const item of frequentItems) {
        try {
          const inventoryItem = await this.inventoryRepository.findById(item.inventory_id);
          if (inventoryItem && inventoryItem.quantity > 0) {
            recommendations.push({
              item_id: inventoryItem.id,
              item_name: inventoryItem.item_name,
              category: inventoryItem.category,
              quantity: 1,
              unit: inventoryItem.unit,
              reason: 'frequent',
            });
          }
        } catch (error) {
          continue;
        }
      }

      return recommendations;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get recommended items based on user preferences
   */
  async getPreferenceBasedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<CartRecommendation[]> {
    try {
      const preferences = await this.preferenceService.getUserPreferences(userId);
      const { items: availableItems } = await this.inventoryRepository.findAll({
        limit: limit * 2,
      });

      const recommendations: CartRecommendation[] = [];

      for (const item of availableItems) {
        if (recommendations.length >= limit) break;

        const matchesPreferences = this.itemMatchesPreferences(item, preferences);
        if (matchesPreferences && item.quantity > 0) {
          recommendations.push({
            item_id: item.id,
            item_name: item.item_name,
            category: item.category,
            quantity: 1,
            unit: item.unit,
            reason: 'preference',
          });
        }
      }

      return recommendations;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get popular pantry items
   */
  async getPopularItems(limit: number = 10): Promise<CartRecommendation[]> {
    try {
      const { items: availableItems } = await this.inventoryRepository.findAll({
        limit,
      });

      const recommendations: CartRecommendation[] = availableItems
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          item_id: item.id,
          item_name: item.item_name,
          category: item.category,
          quantity: 1,
          unit: item.unit,
          reason: 'popular',
        }));

      return recommendations;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Check if an item matches user preferences
   */
  private itemMatchesPreferences(
    item: any,
    preferences: any
  ): boolean {
    // Check if item is in favorite categories
    if (preferences.favorite_cuisines && preferences.favorite_cuisines.length > 0) {
      const itemCategory = item.category?.toLowerCase() || '';
      const matchesCategory = preferences.favorite_cuisines.some((cuisine: string) =>
        itemCategory.includes(cuisine.toLowerCase())
      );
      if (matchesCategory) return true;
    }

    // Check if item matches dietary restrictions
    if (preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
      const itemTags = item.dietary_tags || [];
      const matchesDietary = preferences.dietary_restrictions.some((restriction: string) =>
        itemTags.includes(restriction)
      );
      if (matchesDietary) return true;
    }

    // If no preferences set, consider it a match
    if (
      (!preferences.favorite_cuisines || preferences.favorite_cuisines.length === 0) &&
      (!preferences.dietary_restrictions || preferences.dietary_restrictions.length === 0)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Get cart generation suggestions
   * Returns a message suggesting when to generate a cart
   */
  async getCartSuggestion(userId: string): Promise<string> {
    try {
      // Check if user has an active cart
      await this.pantryOrderService.getOrCreateCart(userId);
      const { items } = await this.pantryOrderService.getCart(userId);

      if (items.length === 0) {
        // Check if user has frequent items
        const frequentItems = await this.preferenceService.getFrequentItems(userId, 1);
        if (frequentItems.length > 0) {
          return 'I can generate your usual pantry items for you. Would you like me to add them to your cart?';
        }
        return 'Your cart is empty. Would you like me to suggest some items?';
      }

      return `Your cart has ${items.length} items. Would you like me to add more recommendations?`;
    } catch (error: any) {
      return 'Would you like me to help you build a pantry cart?';
    }
  }
}

// Export singleton instance
export const smartPantryCartService = new SmartPantryCartService();
