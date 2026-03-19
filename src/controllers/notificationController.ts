import { Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';
import { successResponse } from '../utils/response';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  getUserNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { is_read, type, page = 1, limit = 20 } = req.query;

      const result = await this.notificationService.getUserNotifications(userId, {
        is_read: is_read === 'true' ? true : is_read === 'false' ? false : undefined,
        type: type as string,
        page: Number(page),
        limit: Number(limit),
      });

      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / Number(limit)),
        },
        unread_count: result.unread_count,
      });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const notification = await this.notificationService.markAsRead(id, userId);
      successResponse(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const count = await this.notificationService.markAllAsRead(userId);
      successResponse(res, { count }, `${count} notifications marked as read`);
    } catch (error) {
      next(error);
    }
  };

  deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      await this.notificationService.deleteNotification(id, userId);
      successResponse(res, null, 'Notification deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const count = await this.notificationService.getUnreadCount(userId);
      successResponse(res, { count }, 'Unread count retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getNotificationsByUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { is_read, type, page = 1, limit = 20 } = req.query;

      const result = await this.notificationService.getUserNotifications(id, {
        is_read: is_read === 'true' ? true : is_read === 'false' ? false : undefined,
        type: type as string,
        page: Number(page),
        limit: Number(limit),
      });

      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / Number(limit)),
        },
        unread_count: result.unread_count,
      });
    } catch (error) {
      next(error);
    }
  };
}

