import { query } from '../config/database';

export interface MetricValue {
  value: number;
  target: number;
  unit: string;
}

export interface ProviderMetricsResult {
  sustainability: {
    carbonFootprint: MetricValue;
    sustainableIngredients: MetricValue;
    wasteReduction: MetricValue;
  };
  community: {
    foodDonations: MetricValue;
    volunteerHours: MetricValue;
    partnerships: MetricValue;
  };
  customer: {
    satisfaction: MetricValue;
    retention: MetricValue;
    feedbackEngagement: MetricValue;
  };
  revenue: {
    revenueBreakdown: MetricValue;
    revenueGrowth: MetricValue;
    arpu: MetricValue;
  };
}

export class ProviderMetricsService {
  async getProviderMetrics(providerId: string): Promise<ProviderMetricsResult> {
    const [sustainability, community, customer, revenue] = await Promise.all([
      this.getSustainabilityMetrics(providerId),
      this.getCommunityMetrics(providerId),
      this.getCustomerMetrics(providerId),
      this.getRevenueMetrics(providerId),
    ]);

    return { sustainability, community, customer, revenue };
  }

  private async getSustainabilityMetrics(providerId: string) {
    // Total listings and sustainable-tagged listings
    const listingsResult = await query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE 'sustainable' = ANY(dietary_tags)) AS sustainable
       FROM food_listings
       WHERE provider_id = $1`,
      [providerId]
    );

    const total = parseInt(listingsResult.rows[0]?.total ?? '0');
    const sustainable = parseInt(listingsResult.rows[0]?.sustainable ?? '0');
    const sustainablePct = total > 0 ? Math.round((sustainable / total) * 100) : 0;

    // Waste reduction: ratio of completed/picked_up reservations vs total
    const wasteResult = await query(
      `SELECT
         COUNT(*) AS total_reservations,
         COUNT(*) FILTER (WHERE r.status IN ('picked_up', 'completed')) AS fulfilled
       FROM reservations r
       JOIN food_listings fl ON r.listing_id = fl.id
       WHERE fl.provider_id = $1`,
      [providerId]
    );

    const totalRes = parseInt(wasteResult.rows[0]?.total_reservations ?? '0');
    const fulfilled = parseInt(wasteResult.rows[0]?.fulfilled ?? '0');
    const wasteReductionPct = totalRes > 0 ? Math.round((fulfilled / totalRes) * 100) : 0;

    // Carbon footprint: proxy — kg CO2 saved = fulfilled meals * 0.5 kg avg
    const carbonSaved = Math.round(fulfilled * 0.5);

    return {
      carbonFootprint: { value: carbonSaved, target: 200, unit: 'kg CO₂' },
      sustainableIngredients: { value: sustainablePct, target: 100, unit: '%' },
      wasteReduction: { value: wasteReductionPct, target: 100, unit: '%' },
    };
  }

  private async getCommunityMetrics(providerId: string) {
    // Food donations: completed/picked_up reservations for this provider
    const donationsResult = await query(
      `SELECT COUNT(*) AS donations
       FROM reservations r
       JOIN food_listings fl ON r.listing_id = fl.id
       WHERE fl.provider_id = $1 AND r.status IN ('picked_up', 'completed')`,
      [providerId]
    );
    const donations = parseInt(donationsResult.rows[0]?.donations ?? '0');

    // Volunteer hours: sum of slots_filled from volunteer_shifts linked to provider
    // volunteer_shifts don't have provider_id, so we count all shifts as community proxy
    const volunteerResult = await query(
      `SELECT COALESCE(SUM(slots_filled), 0) AS total_hours FROM volunteer_shifts`
    );
    const volunteerHours = parseInt(volunteerResult.rows[0]?.total_hours ?? '0');

    // Partnerships: distinct providers who have active listings (community proxy)
    const partnerResult = await query(
      `SELECT COUNT(DISTINCT provider_id) AS partners FROM food_listings WHERE status = 'active'`
    );
    const partnerships = parseInt(partnerResult.rows[0]?.partners ?? '0');

    return {
      foodDonations: { value: donations, target: 500, unit: 'meals' },
      volunteerHours: { value: volunteerHours, target: 200, unit: 'hrs' },
      partnerships: { value: partnerships, target: 15, unit: 'orgs' },
    };
  }

  private async getCustomerMetrics(providerId: string) {
    // Unique customers who reserved from this provider
    const customersResult = await query(
      `SELECT
         COUNT(DISTINCT r.user_id) AS unique_customers,
         COUNT(*) FILTER (WHERE r.status IN ('picked_up', 'completed')) AS completed,
         COUNT(*) AS total
       FROM reservations r
       JOIN food_listings fl ON r.listing_id = fl.id
       WHERE fl.provider_id = $1`,
      [providerId]
    );

    const uniqueCustomers = parseInt(customersResult.rows[0]?.unique_customers ?? '0');
    const completed = parseInt(customersResult.rows[0]?.completed ?? '0');
    const total = parseInt(customersResult.rows[0]?.total ?? '0');

    // Retention: customers with more than 1 reservation
    const retentionResult = await query(
      `SELECT COUNT(*) AS returning
       FROM (
         SELECT r.user_id
         FROM reservations r
         JOIN food_listings fl ON r.listing_id = fl.id
         WHERE fl.provider_id = $1
         GROUP BY r.user_id
         HAVING COUNT(*) > 1
       ) sub`,
      [providerId]
    );
    const returning = parseInt(retentionResult.rows[0]?.returning ?? '0');
    const retentionPct = uniqueCustomers > 0 ? Math.round((returning / uniqueCustomers) * 100) : 0;

    // Satisfaction: completion rate as proxy (no ratings table yet)
    const satisfactionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Feedback engagement: % of reservations that were not cancelled
    const engagementPct = total > 0 ? Math.round(((total - (total - completed)) / total) * 100) : 0;

    return {
      satisfaction: { value: satisfactionPct, target: 100, unit: '%' },
      retention: { value: retentionPct, target: 100, unit: '%' },
      feedbackEngagement: { value: engagementPct, target: 100, unit: '%' },
    };
  }

  private async getRevenueMetrics(providerId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Revenue from completed reservations with a discounted_price
    const revenueResult = await query(
      `SELECT
         COALESCE(SUM(fl.discounted_price * r.quantity), 0) AS total_revenue,
         COUNT(DISTINCT r.user_id) AS unique_users
       FROM reservations r
       JOIN food_listings fl ON r.listing_id = fl.id
       WHERE fl.provider_id = $1 AND r.status IN ('picked_up', 'completed')`,
      [providerId]
    );

    const totalRevenue = parseFloat(revenueResult.rows[0]?.total_revenue ?? '0');
    const uniqueUsers = parseInt(revenueResult.rows[0]?.unique_users ?? '0');
    const arpu = uniqueUsers > 0 ? Math.round(totalRevenue / uniqueUsers) : 0;

    // Month-over-month growth
    const thisMonthResult = await query(
      `SELECT COALESCE(SUM(fl.discounted_price * r.quantity), 0) AS revenue
       FROM reservations r
       JOIN food_listings fl ON r.listing_id = fl.id
       WHERE fl.provider_id = $1
         AND r.status IN ('picked_up', 'completed')
         AND r.created_at >= $2`,
      [providerId, startOfMonth]
    );

    const lastMonthResult = await query(
      `SELECT COALESCE(SUM(fl.discounted_price * r.quantity), 0) AS revenue
       FROM reservations r
       JOIN food_listings fl ON r.listing_id = fl.id
       WHERE fl.provider_id = $1
         AND r.status IN ('picked_up', 'completed')
         AND r.created_at >= $2 AND r.created_at < $3`,
      [providerId, startOfLastMonth, startOfMonth]
    );

    const thisMonth = parseFloat(thisMonthResult.rows[0]?.revenue ?? '0');
    const lastMonth = parseFloat(lastMonthResult.rows[0]?.revenue ?? '0');
    const growthPct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

    return {
      revenueBreakdown: { value: Math.round(totalRevenue), target: 20000, unit: '$' },
      revenueGrowth: { value: Math.max(0, growthPct), target: 30, unit: '%' },
      arpu: { value: arpu, target: 40, unit: '$' },
    };
  }
}
