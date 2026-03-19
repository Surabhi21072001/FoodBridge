import { Router } from 'express';
import { PantryInventoryController } from '../controllers/pantryInventoryController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  adjustQuantitySchema,
  listInventorySchema,
  inventoryIdSchema,
} from '../validators/pantryInventoryValidators';

const router = Router();
const inventoryController = new PantryInventoryController();

// Public/Student routes - view inventory
router.get(
  '/',
  authenticate,
  validate(listInventorySchema),
  inventoryController.listItems
);

router.get(
  '/:id',
  authenticate,
  validate(inventoryIdSchema),
  inventoryController.getItem
);

// Admin routes - manage inventory
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createInventoryItemSchema),
  inventoryController.createItem
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(inventoryIdSchema),
  validate(updateInventoryItemSchema),
  inventoryController.updateItem
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(inventoryIdSchema),
  inventoryController.deleteItem
);

router.post(
  '/:id/adjust-quantity',
  authenticate,
  authorize('admin'),
  validate(inventoryIdSchema),
  validate(adjustQuantitySchema),
  inventoryController.adjustQuantity
);

router.get(
  '/admin/low-stock',
  authenticate,
  authorize('admin'),
  inventoryController.getLowStockItems
);

export default router;
