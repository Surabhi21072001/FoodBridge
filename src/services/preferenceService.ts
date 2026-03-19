import { PreferenceRepository, UserPreference } from '../repositories/preferenceRepository';
import { PantryInventoryRepository } from '../repositories/pantryInventoryRepository';
import { UserRepository } from '../repositories/userRepository';
import { NotFoundError } from '../utils/errors';

export class PreferenceService {
  private preferenceRepository: PreferenceRepository;
  private inventoryRepository: PantryInventoryRepository;
  private userRepository: UserRepository;

  constructor() {
    this.preferenceRepository = new PreferenceRepository();
    this.inventoryRepository = new PantryInventoryRepository();
    this.userRepository = new UserRepository();
  }

  async getUserPreferences(userId: string): Promise<UserPreference> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    let preferences = await this.preferenceRepository.findByUserId(userId);
    
    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await this.preferenceRepository.create({
        user_id: userId,
        dietary_restrictions: [],
        allergies: [],
        favorite_cuisines: [],
        preferred_providers: [],
        notification_preferences: {
          new_listings: true,
          reservations: true,
          appointments: true,
          reminders: true,
        },
      });
    }

    return preferences;
  }

  async updateUserPreferences(
    userId: string,
    updates: Partial<UserPreference>
  ): Promise<UserPreference> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Ensure preferences exist
    let preferences = await this.preferenceRepository.findByUserId(userId);
    if (!preferences) {
      preferences = await this.preferenceRepository.create({
        user_id: userId,
        dietary_restrictions: [],
        allergies: [],
        favorite_cuisines: [],
        preferred_providers: [],
        notification_preferences: {
          new_listings: true,
          reservations: true,
          appointments: true,
          reminders: true,
        },
      });
    }

    const updated = await this.preferenceRepository.update(userId, updates);
    if (!updated) {
      throw new NotFoundError('Failed to update preferences');
    }

    return updated;
  }

  async trackPantrySelection(userId: string, inventoryId: string, quantity: number): Promise<void> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify inventory item exists
    const item = await this.inventoryRepository.findById(inventoryId);
    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    await this.preferenceRepository.recordEvent({
      user_id: userId,
      event_type: 'pantry_selection',
      event_data: {
        inventory_id: inventoryId,
        item_name: item.item_name,
        quantity,
        category: item.category,
      },
    });
  }

  async trackReservation(userId: string, providerId: string, listingTitle: string, category: string): Promise<void> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.preferenceRepository.recordEvent({
      user_id: userId,
      event_type: 'reservation',
      event_data: {
        provider_id: providerId,
        listing_title: listingTitle,
        category,
      },
    });
  }

  async trackFilterApplication(userId: string, filters: Record<string, any>): Promise<void> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.preferenceRepository.recordEvent({
      user_id: userId,
      event_type: 'filter_applied',
      event_data: filters,
    });
  }

  async getFrequentItems(userId: string, limit: number = 10): Promise<any[]> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return await this.preferenceRepository.getFrequentItems(userId, limit);
  }

  async getFrequentProviders(userId: string, limit: number = 5): Promise<any[]> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return await this.preferenceRepository.getFrequentProviders(userId, limit);
  }

  async getRecommendations(userId: string, maxItems: number = 10): Promise<any[]> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get user preferences (for future use in filtering)
    await this.getUserPreferences(userId);

    // Get frequent items
    const frequentItems = await this.getFrequentItems(userId, maxItems);

    // Fetch inventory details for frequent items
    const recommendations: any[] = [];
    for (const item of frequentItems) {
      try {
        const inventoryItem = await this.inventoryRepository.findById(item.inventory_id);
        if (inventoryItem && inventoryItem.quantity > 0) {
          recommendations.push({
            ...inventoryItem,
            frequency: item.frequency,
          });
        }
      } catch (error) {
        // Skip items that can't be found
        continue;
      }
    }

    // If not enough recommendations from history, add popular items
    if (recommendations.length < maxItems) {
      const { items: availableItems } = await this.inventoryRepository.findAll({
        limit: maxItems - recommendations.length,
      });

      const existingIds = new Set(recommendations.map(r => r.id));
      for (const item of availableItems) {
        if (!existingIds.has(item.id) && item.quantity > 0) {
          recommendations.push(item);
          if (recommendations.length >= maxItems) break;
        }
      }
    }

    return recommendations;
  }

  async getPreferenceHistory(
    userId: string,
    eventType?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ events: any[]; total: number }> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return await this.preferenceRepository.getUserPreferenceHistory(userId, eventType, limit, offset);
  }
}
