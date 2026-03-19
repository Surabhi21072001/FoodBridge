import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import {
  listNotificationsSchema,
  notificationIdSchema,
} from '../validators/notificationValidators';

const router = Router();
const notificationController = new NotificationController();

// All routes require authentication
router.get(
  '/',
  authenticate,
  validate(listNotificationsSchema),
  notificationController.getUserNotifications
);

// Get notifications by user ID (admin/staff can view)
router.get(
  '/user/:id',
  authenticate,
  notificationController.getNotificationsByUser
);

router.get(
  '/unread-count',
  authenticate,
  notificationController.getUnreadCount
);

// Support both PUT and PATCH for marking as read
router.put(
  '/:id/read',
  authenticate,
  validate(notificationIdSchema),
  notificationController.markAsRead
);

router.patch(
  '/:id/read',
  authenticate,
  validate(notificationIdSchema),
  notificationController.markAsRead
);

router.put(
  '/read-all',
  authenticate,
  notificationController.markAllAsRead
);

router.delete(
  '/:id',
  authenticate,
  validate(notificationIdSchema),
  notificationController.deleteNotification
);

export default router;
