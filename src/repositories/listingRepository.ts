import { query } from '../config/database';
import { FoodListing } from '../types';
import { PoolClient } from 'pg';

export class ListingRepository {
  async findById(id: string): Promise<FoodListing | null> {
    const result = await query('SELECT * FROM food_listings WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async create(listingData: {
    provider_id: string;
    title: string;
    description?: string;
    category: string;
    cuisine_type?: string;
    dietary_tags?: string[];
    allergen_info?: string[];
    quantity_available: number;
    unit?: string;
    original_price?: number;
    discounted_price?: number;
    pickup_location: string;
    available_from: Date;
    available_until: Date;
    image_urls?: string[];
  }): Promise<FoodListing> {
    const result = await query(
      `INSERT INTO food_listings (
        provider_id, title, description, category, cuisine_type,
        dietary_tags, allergen_info, quantity_available, unit,
        original_price, discounted_price, pickup_location,
        available_from, available_until, image_urls
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        listingData.provider_id,
        listingData.title,
        listingData.description,
        listingData.category,
        listingData.cuisine_type,
        listingData.dietary_tags,
        listingData.allergen_info,
        listingData.quantity_available,
        listingData.unit || 'serving',
        listingData.original_price,
        listingData.discounted_price,
        listingData.pickup_location,
        listingData.available_from,
        listingData.available_until,
        listingData.image_urls,
      ]
    );
    return result.rows[0];
  }

  async update(id: string, updates: Partial<FoodListing>): Promise<FoodListing | null> {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id' && key !== 'created_at') {
          fields.push(key + ' = $' + paramCount);
          values.push(value);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        return this.findById(id);
      }

      values.push(id);
      const result = await query(
        'UPDATE food_listings SET ' + fields.join(', ') + ' WHERE id = $' + paramCount + ' RETURNING *',
        values
      );

      return result.rows[0] || null;
    }

  async findAll(filters?: {
      provider_id?: string;
      category?: string;
      status?: string;
      dietary_tags?: string[];
      available_now?: boolean;
      location?: string;
      search?: string;
      max_price?: number;
      min_price?: number;
      limit?: number;
      offset?: number;
    }): Promise<{ listings: FoodListing[]; total: number }> {
      let queryText = 'SELECT * FROM food_listings WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (filters?.search) {
        queryText += ' AND (LOWER(title) LIKE LOWER($' + paramCount + ') OR LOWER(description) LIKE LOWER($' + (paramCount + 1) + '))';
        params.push('%' + filters.search + '%');
        params.push('%' + filters.search + '%');
        paramCount += 2;
      }

      if (filters?.provider_id) {
        queryText += ' AND provider_id = $' + paramCount;
        params.push(filters.provider_id);
        paramCount++;
      }

      if (filters?.category) {
        queryText += ' AND category = $' + paramCount;
        params.push(filters.category);
        paramCount++;
      }

      if (filters?.status) {
        queryText += ' AND status = $' + paramCount;
        params.push(filters.status);
        paramCount++;
      }

      if (filters?.dietary_tags && filters.dietary_tags.length > 0) {
        queryText += ' AND dietary_tags && $' + paramCount;
        params.push(filters.dietary_tags);
        paramCount++;
      }

      if (filters?.location) {
        queryText += ' AND LOWER(pickup_location) LIKE LOWER($' + paramCount + ')';
        params.push('%' + filters.location + '%');
        paramCount++;
      }

      if (filters?.max_price !== undefined) {
        queryText += ' AND COALESCE(discounted_price, original_price) <= $' + paramCount;
        params.push(filters.max_price);
        paramCount++;
      }

      if (filters?.min_price !== undefined) {
        queryText += ' AND COALESCE(discounted_price, original_price) >= $' + paramCount;
        params.push(filters.min_price);
        paramCount++;
      }

      if (filters?.available_now) {
        queryText += ' AND available_from <= NOW() AND available_until >= NOW()';
        queryText += ' AND quantity_available > quantity_reserved';
      }

      const countResult = await query(
        queryText.replace('SELECT *', 'SELECT COUNT(*)'),
        params
      );
      const total = parseInt(countResult.rows[0].count);

      queryText += ' ORDER BY available_from DESC';

      if (filters?.limit) {
        queryText += ' LIMIT $' + paramCount;
        params.push(filters.limit);
        paramCount++;
      }

      if (filters?.offset) {
        queryText += ' OFFSET $' + paramCount;
        params.push(filters.offset);
      }

      const result = await query(queryText, params);

      return { listings: result.rows, total };
    }

  async updateReservedQuantity(
    id: string,
    quantityChange: number,
    client?: PoolClient
  ): Promise<FoodListing | null> {
    const queryFn = client ? client.query.bind(client) : query;
    
    const result = await queryFn(
      `UPDATE food_listings 
       SET quantity_reserved = quantity_reserved + $1
       WHERE id = $2 AND quantity_reserved + $1 <= quantity_available
       RETURNING *`,
      [quantityChange, id]
    );

    return result.rows[0] || null;
  }

  async expireOldListings(): Promise<number> {
    const result = await query(
      `UPDATE food_listings 
       SET status = 'expired'
       WHERE status = 'active' AND available_until < NOW()
       RETURNING id`
    );
    return result.rowCount || 0;
  }

  async findProviderListingsWithStats(
    providerId: string,
    filters?: {
      status?: string;
      category?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ listings: any[]; total: number; summary: ProviderListingsSummary }> {
    let queryText = `
      SELECT
        fl.*,
        COUNT(r.id) FILTER (WHERE r.status NOT IN ('cancelled')) AS total_reservations,
        COUNT(r.id) FILTER (WHERE r.status = 'confirmed') AS confirmed_reservations,
        COUNT(r.id) FILTER (WHERE r.status = 'picked_up') AS completed_reservations,
        COALESCE(SUM(r.quantity) FILTER (WHERE r.status NOT IN ('cancelled')), 0) AS total_reserved_quantity,
        CASE
          WHEN fl.status = 'active' AND fl.available_until >= NOW() AND fl.quantity_available > fl.quantity_reserved THEN true
          ELSE false
        END AS is_available_now
      FROM food_listings fl
      LEFT JOIN reservations r ON r.listing_id = fl.id
      WHERE fl.provider_id = $1
    `;
    const params: any[] = [providerId];
    let paramCount = 2;

    if (filters?.status) {
      queryText += ` AND fl.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters?.category) {
      queryText += ` AND fl.category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    queryText += ' GROUP BY fl.id';

    const countResult = await query(
      `SELECT COUNT(*) FROM food_listings fl WHERE fl.provider_id = $1${filters?.status ? ` AND fl.status = $2` : ''}${filters?.category ? ` AND fl.category = $${filters?.status ? 3 : 2}` : ''}`,
      params.slice(0, paramCount - 1)
    );
    const total = parseInt(countResult.rows[0].count);

    queryText += ' ORDER BY fl.created_at DESC';

    if (filters?.limit) {
      queryText += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    if (filters?.offset !== undefined) {
      queryText += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    const result = await query(queryText, params);

    // Compute summary stats
    const summaryResult = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'active') AS active_count,
        COUNT(*) FILTER (WHERE status = 'expired') AS expired_count,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count,
        COALESCE(SUM(quantity_reserved), 0) AS total_reserved,
        COALESCE(SUM(quantity_available), 0) AS total_available,
        COUNT(*) FILTER (WHERE status = 'active' AND available_until >= NOW() AND quantity_available > quantity_reserved) AS currently_available
      FROM food_listings
      WHERE provider_id = $1`,
      [providerId]
    );

    const s = summaryResult.rows[0];
    const summary: ProviderListingsSummary = {
      active_count: parseInt(s.active_count),
      expired_count: parseInt(s.expired_count),
      completed_count: parseInt(s.completed_count),
      cancelled_count: parseInt(s.cancelled_count),
      total_reserved: parseInt(s.total_reserved),
      total_available: parseInt(s.total_available),
      currently_available: parseInt(s.currently_available),
    };

    return { listings: result.rows, total, summary };
  }
}

export interface ProviderListingsSummary {
  active_count: number;
  expired_count: number;
  completed_count: number;
  cancelled_count: number;
  total_reserved: number;
  total_available: number;
  currently_available: number;
}
