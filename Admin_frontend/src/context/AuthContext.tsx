import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AdminUser } from '../types';
import { authService, LoginCredentials } from '../services/api/authService';
import { db } from '../services/storage';

interface AuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AdminUser>;
  logout: () => Promise<void>;
  forgotPassword: (adminIdOrEmail: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check existing session in storage
    const storedAdmin = db.getAdmin();
    setAdmin(storedAdmin);
    setIsLoading(false);

    // Listen for storage events
    const handleDbChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === 'foodfleet_admin_session') {
        setAdmin(db.getAdmin());
      }
    };

    window.addEventListener('foodfleet_db_change', handleDbChange);
    return () => window.removeEventListener('foodfleet_db_change', handleDbChange);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AdminUser> => {
    setIsLoading(true);
    try {
      const user = await authService.login(credentials);
      setAdmin(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (adminIdOrEmail: string) => {
    return authService.forgotPassword(adminIdOrEmail);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
