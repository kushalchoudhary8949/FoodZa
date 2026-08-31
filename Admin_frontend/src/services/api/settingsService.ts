import { SystemSettings } from '../../types';
import { db } from '../storage';

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_SETTINGS: SystemSettings = {
  managerOrderAcceptanceTimeoutMinutes: 3,
  adminInterventionTimeoutMinutes: 5,
  deliveryFeeBase: 25,
  deliveryFeePerKm: 10,
  freeDeliveryAbove: 499,
  platformCommissionPercentage: 12,
  systemNotifications: {
    notifyOnNewOrder: true,
    notifyOnTimeout: true,
    notifyOnCancellation: true,
    notifyOnPartnerOffline: false,
  },
};

const SETTINGS_KEY = 'foodfleet_settings';

export const settingsService = {
  async getSettings(): Promise<SystemSettings> {
    await delay();
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  },

  async updateSettings(newSettings: Partial<SystemSettings>): Promise<SystemSettings> {
    await delay();
    const current = await this.getSettings();
    const updated: SystemSettings = {
      ...current,
      ...newSettings,
      systemNotifications: {
        ...current.systemNotifications,
        ...(newSettings.systemNotifications || {}),
      },
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('foodfleet_db_change', {
        detail: { key: SETTINGS_KEY, data: updated },
      })
    );
    return updated;
  },
};
