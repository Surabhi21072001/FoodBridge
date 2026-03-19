import { Router } from 'express';
import { PantryOrderController } from '../controllers/pantryOrderController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';
import {
  addItemToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  orderIdSchema,
  listOrdersSchema,
} from '../validators/pantryOrderValidators';

const router = Router();
const orderController = new PantryOrderController();

// Student routes - cart management
router.get(
  '/cart',
  authenticate,
  authorize('student'),
  orderController.getCart
);

router.post(
  '/cart/items',
  authenticate,
  authorize('student'),
  validate(addItemToCartSchema),
  orderController.addItemToCart
);

router.put(
  '/cart/items/:inventory_id',
  authenticate,
  authorize('student'),
  validate(updateCartItemSchema),
  orderController.updateCartItem
);

router.delete(
  '/cart/items/:inventory_id',
  authenticate,
  authorize('student'),
  validate(removeCartItemSchema),
  orderController.removeCartItem
);

router.delete(
  '/cart',
  authenticate,
  authorize('student'),
  orderController.clearCart
);

router.post(
  '/cart/submit',
  authenticate,
  authorize('student'),
  orderController.submitOrder
);

// Student routes - order history
router.get(
  '/',
  authenticate,
  authorize('student'),
  validate(listOrdersSchema),
  orderController.getUserOrders
);

router.get(
  '/:id',
  authenticate,
  authorize('student'),
  validate(orderIdSchema),
  orderController.getOrder
);

export default router;
