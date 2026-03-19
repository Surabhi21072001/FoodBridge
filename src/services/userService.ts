import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { User } from '../types';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(userData: {
    email: string;
    password: string;
    role: 'student' | 'provider' | 'admin';
    first_name: string;
    last_name: string;
    phone?: string;
  }): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new BadRequestError('Email already registered');
    }

    const password_hash = await bcrypt.hash(userData.password, 10);

    const user = await this.userRepository.create({
      ...userData,
      password_hash,
    });

    const token = this.generateToken(user);

    const { password_hash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    await this.userRepository.updateLastLogin(user.id);

    const token = this.generateToken(user);

    const { password_hash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async getUserById(id: string): Promise<Omit<User, 'password_hash'>> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(
    id: string,
    updates: Partial<Omit<User, 'id' | 'password_hash' | 'created_at'>>
  ): Promise<Omit<User, 'password_hash'>> {
    const user = await this.userRepository.update(id, updates);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(id, { password_hash });
  }

  async listUsers(filters?: {
    role?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ users: Omit<User, 'password_hash'>[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const { users, total } = await this.userRepository.findAll({
      role: filters?.role,
      is_active: filters?.is_active,
      limit,
      offset,
    });

    const usersWithoutPassword = users.map(({ password_hash, ...user }) => user);

    return { users: usersWithoutPassword, total };
  }

  private generateToken(user: User): string {
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';

    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: '7d' }
    );
  }

  async deleteUser(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('User not found');
    }
  }

  async deactivateUser(id: string, requestingUserId: string): Promise<Omit<User, 'password_hash'>> {
    // Verify requesting user is an admin
    const requestingUser = await this.userRepository.findById(requestingUserId);
    if (!requestingUser) {
      throw new UnauthorizedError('Requesting user not found');
    }

    if (requestingUser.role !== 'admin') {
      throw new UnauthorizedError('Only admins can deactivate users');
    }

    // Deactivate the target user
    const user = await this.userRepository.update(id, { is_active: false });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

