import { Router } from 'express';
import { ListingController } from '../controllers/listingController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';
import {
  createListingSchema,
  updateListingSchema,
  listListingsSchema,
  listingIdSchema,
} from '../validators/listingValidators';

const router = Router();
const listingController = new ListingController();

// Public routes
router.get('/', validate(listListingsSchema), listingController.listListings);

// Provider-specific routes (must be before /:id to avoid param collision)
router.get(
  '/provider/my-listings',
  authenticate,
  authorize('provider'),
  listingController.getProviderListings
);

router.get(
  '/provider/dashboard',
  authenticate,
  authorize('provider'),
  listingController.getProviderListingsDashboard
);

router.get('/:id', validate(listingIdSchema), listingController.getListing);

// Provider routes
router.post(
  '/',
  authenticate,
  authorize('provider'),
  validate(createListingSchema),
  listingController.createListing
);

router.put(
  '/:id',
  authenticate,
  authorize('provider'),
  validate(listingIdSchema),
  validate(updateListingSchema),
  listingController.updateListing
);

router.delete(
  '/:id',
  authenticate,
  authorize('provider'),
  validate(listingIdSchema),
  listingController.deleteListing
);

export default router;
