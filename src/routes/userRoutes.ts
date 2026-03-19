import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';
import {
  updateUserSchema,
  changePasswordSchema,
  listUsersSchema,
} from '../validators/userValidators';

const router = Router();
const userController = new UserController();

// Protected routes - user's own profile
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, validate(updateUserSchema), userController.updateProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), userController.changePassword);

// Admin only - manage all users
router.get('/', authenticate, authorize('admin'), validate(listUsersSchema), userController.listUsers);
router.get('/:id', authenticate, authorize('admin'), userController.getUser);
router.put('/:id', authenticate, authorize('admin'), validate(updateUserSchema), userController.updateUser);
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

export default router;
