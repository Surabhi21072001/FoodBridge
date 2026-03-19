import { Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { PreferenceService } from '../services/preferenceService';
import { AuthRequest } from '../middleware/auth';
import { successResponse, paginatedResponse } from '../utils/response';

export class UserController {
  private userService: UserService;
  private preferenceService: PreferenceService;

  constructor() {
    this.userService = new UserService();
    this.preferenceService = new PreferenceService();
  }

  register = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.userService.register(req.body);
      successResponse(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.userService.login(email, password);
      successResponse(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const [user, preferences] = await Promise.all([
        this.userService.getUserById(userId),
        this.preferenceService.getUserPreferences(userId),
      ]);

      const profile = {
        ...user,
        dietary_preferences: preferences.dietary_restrictions || [],
        allergies: preferences.allergies || [],
        preferred_food_types: preferences.favorite_cuisines || [],
      };

      successResponse(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      const { dietary_preferences, allergies, preferred_food_types, notification_preferences, ...userUpdates } = req.body;

      // Update user fields if any provided
      let user = await this.userService.getUserById(userId);
      if (Object.keys(userUpdates).length > 0) {
        user = await this.userService.updateUser(userId, userUpdates);
      }

      // Persist preferences to user_preferences table
      const preferences = await this.preferenceService.updateUserPreferences(userId, {
        dietary_restrictions: dietary_preferences,
        allergies,
        favorite_cuisines: preferred_food_types,
        notification_preferences,
      });

      const profile = {
        ...user,
        dietary_preferences: preferences.dietary_restrictions || [],
        allergies: preferences.allergies || [],
        preferred_food_types: preferences.favorite_cuisines || [],
      };

      successResponse(res, profile, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { current_password, new_password } = req.body;
      await this.userService.changePassword(userId, current_password, new_password);
      successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { role, is_active, page = 1, limit = 20 } = req.query;
      const result = await this.userService.listUsers({
        role: role as string,
        is_active: is_active === 'true',
        page: Number(page),
        limit: Number(limit),
      });
      paginatedResponse(res, result.users, Number(page), Number(limit), result.total);
    } catch (error) {
      next(error);
    }
  };

  getUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await this.userService.updateUser(id, req.body);
      successResponse(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);
      successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

