import { AdminUser } from '../../types';
import { db } from '../storage';
import { INITIAL_ADMIN } from '../mockData';

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export interface LoginCredentials {
  adminId: string;
  password?: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AdminUser> {
    await delay(400);

    const trimmedId = credentials.adminId.trim().toUpperCase();
    
    // Accept valid test admin IDs or default ADMIN100
    // In production, central NestJS API + Firebase Auth verifies this
    if (trimmedId === 'ADMIN100' || trimmedId === 'ADMIN' || trimmedId === 'ROOT') {
      const admin: AdminUser = {
        ...INITIAL_ADMIN,
        adminId: trimmedId,
        lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      db.setAdmin(admin);
      return admin;
    }

    throw new Error('Invalid Admin ID or Password. (Tip: Use Admin ID: ADMIN100)');
  },

  async logout(): Promise<void> {
    await delay(150);
    db.setAdmin(null);
  },

  async getCurrentAdmin(): Promise<AdminUser | null> {
    await delay(100);
    return db.getAdmin();
  },

  async forgotPassword(adminIdOrEmail: string): Promise<{ success: boolean; message: string }> {
    await delay(500);
    if (!adminIdOrEmail || adminIdOrEmail.trim().length < 3) {
      throw new Error('Please provide a valid registered Admin ID or Email.');
    }
    return {
      success: true,
      message: `Password reset instructions and secure OTP have been dispatched to the recovery email associated with "${adminIdOrEmail}".`,
    };
  },
};
