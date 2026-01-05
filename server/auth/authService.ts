import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';

const SALT_ROUNDS = 12;

export interface SignupData {
  email: string;
  password: string;
  name: string;
  businessType: string;
  jobRole: string;
  phoneNumber?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  businessType: string | null;
  jobRole: string | null;
  phoneNumber: string | null;
  profileImageUrl: string | null;
  isActive: boolean | null;
  isAdmin: boolean | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  lastLoginAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async signup(data: SignupData): Promise<UserProfile> {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('An account with this email already exists');
    }

    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const passwordHash = await this.hashPassword(data.password);

    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        businessType: data.businessType,
        jobRole: data.jobRole,
        phoneNumber: data.phoneNumber || null,
        isActive: true,
        isAdmin: false,
      })
      .returning();

    return this.sanitizeUser(newUser);
  }

  async login(data: LoginData): Promise<UserProfile> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()))
      .limit(1);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    if (user.isActive === false) {
      throw new Error('Your account has been deactivated. Please contact support.');
    }

    const isValid = await this.verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    return this.sanitizeUser(user);
  }

  async getUserById(id: string): Promise<UserProfile | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) return null;
    return this.sanitizeUser(user);
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(sql`${users.createdAt} DESC`);

    return allUsers.map(u => this.sanitizeUser(u));
  }

  async updateUser(id: string, data: Partial<{
    name: string;
    businessType: string;
    jobRole: string;
    phoneNumber: string;
    isActive: boolean;
    isAdmin: boolean;
  }>): Promise<UserProfile | null> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) return null;
    return this.sanitizeUser(updatedUser);
  }

  async resetPassword(id: string, newPassword: string): Promise<boolean> {
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const passwordHash = await this.hashPassword(newPassword);
    
    const result = await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return result.length > 0;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    return result.length > 0;
  }

  private sanitizeUser(user: any): UserProfile {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

export const authService = new AuthService();
