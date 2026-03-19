import { Router } from 'express';
import { ProviderMetricsController } from '../controllers/providerMetricsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const controller = new ProviderMetricsController();

router.get('/', authenticate, authorize('provider'), controller.getMetrics);

export default router;
