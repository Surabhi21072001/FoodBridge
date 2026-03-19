import { Response, NextFunction } from 'express';
import { ProviderMetricsService } from '../services/providerMetricsService';
import { AuthRequest } from '../middleware/auth';

export class ProviderMetricsController {
  private metricsService: ProviderMetricsService;

  constructor() {
    this.metricsService = new ProviderMetricsService();
  }

  getMetrics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const providerId = req.user!.id;
      const metrics = await this.metricsService.getProviderMetrics(providerId);
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  };
}
