import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../../types';
import { settingsService } from '../../services/api/settingsService';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import {
  Settings as SettingsIcon,
  Clock,
  IndianRupee,
  Percent,
  Bell,
  Shield,
  Save,
  RotateCcw,
  Sparkles,
  Server,
  Zap,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { success, error } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [managerTimeout, setManagerTimeout] = useState(3);
  const [adminTimeout, setAdminTimeout] = useState(5);
  const [deliveryBaseFee, setDeliveryBaseFee] = useState(25);
  const [deliveryFeePerKm, setDeliveryFeePerKm] = useState(10);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(499);
  const [platformCommissionPercentage, setPlatformCommissionPercentage] = useState(12);

  // Notification toggles
  const [notifyOnNewOrder, setNotifyOnNewOrder] = useState(true);
  const [notifyOnTimeout, setNotifyOnTimeout] = useState(true);
  const [notifyOnCancellation, setNotifyOnCancellation] = useState(true);
  const [notifyOnPartnerOffline, setNotifyOnPartnerOffline] = useState(false);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
      setManagerTimeout(data.managerOrderAcceptanceTimeoutMinutes);
      setAdminTimeout(data.adminInterventionTimeoutMinutes);
      setDeliveryBaseFee(data.deliveryFeeBase);
      setDeliveryFeePerKm(data.deliveryFeePerKm);
      setFreeDeliveryThreshold(data.freeDeliveryAbove);
      setPlatformCommissionPercentage(data.platformCommissionPercentage);
      setNotifyOnNewOrder(data.systemNotifications.notifyOnNewOrder);
      setNotifyOnTimeout(data.systemNotifications.notifyOnTimeout);
      setNotifyOnCancellation(data.systemNotifications.notifyOnCancellation);
      setNotifyOnPartnerOffline(data.systemNotifications.notifyOnPartnerOffline);
    } catch {
      error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await settingsService.updateSettings({
        managerOrderAcceptanceTimeoutMinutes: Number(managerTimeout),
        adminInterventionTimeoutMinutes: Number(adminTimeout),
        deliveryFeeBase: Number(deliveryBaseFee),
        deliveryFeePerKm: Number(deliveryFeePerKm),
        freeDeliveryAbove: Number(freeDeliveryThreshold),
        platformCommissionPercentage: Number(platformCommissionPercentage),
        systemNotifications: {
          notifyOnNewOrder,
          notifyOnTimeout,
          notifyOnCancellation,
          notifyOnPartnerOffline,
        },
      });
      setSettings(updated);
      success('Settings Saved', 'Platform operating parameters updated successfully.');
    } catch (err: any) {
      error('Save Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setManagerTimeout(3);
    setAdminTimeout(5);
    setDeliveryBaseFee(25);
    setDeliveryFeePerKm(10);
    setFreeDeliveryThreshold(499);
    setPlatformCommissionPercentage(12);
    setNotifyOnNewOrder(true);
    setNotifyOnTimeout(true);
    setNotifyOnCancellation(true);
    setNotifyOnPartnerOffline(false);
    success('Reset to Defaults', 'Default parameter values restored in form.');
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-white rounded-xl shadow-xs animate-pulse" />
        <div className="h-64 bg-white rounded-xl shadow-xs animate-pulse" />
      </div>
    );
  }

  return (
    <div id="platform-settings-page" className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform System Settings</h2>
          <p className="text-xs text-slate-500">
            Configure order acceptance timeouts, commission margins, delivery fees, and notification triggers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Defaults
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Timeout & Admin Intervention Configurations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Order Acceptance & Timeout SLAs</h3>
              <p className="text-xs text-slate-500">
                Determine when unaccepted orders trigger automated admin intervention alerts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Store Manager Acceptance Timeout *
              </label>
              <div className="relative">
                <input
                  id="setting-manager-timeout"
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={managerTimeout}
                  onChange={(e) => setManagerTimeout(Number(e.target.value))}
                  className="w-full text-sm font-bold rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  Minutes (Default: 3m)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                If the store manager does not accept or reject within this window, an Admin Intervention alert is triggered.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Admin Intervention Grace Window *
              </label>
              <div className="relative">
                <input
                  id="setting-admin-timeout"
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={adminTimeout}
                  onChange={(e) => setAdminTimeout(Number(e.target.value))}
                  className="w-full text-sm font-bold rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  Minutes (Default: 5m)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Total duration before system initiates automated fallback customer refund/escalation.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Delivery Fee & Platform Commission */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pricing, Delivery Fee & Commission</h3>
              <p className="text-xs text-slate-500">
                Revenue shares, campus delivery charge algorithms, and free shipping thresholds
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Platform Commission
              </label>
              <div className="relative">
                <input
                  id="setting-commission"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={platformCommissionPercentage}
                  onChange={(e) => setPlatformCommissionPercentage(Number(e.target.value))}
                  className="w-full text-sm font-bold rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  % per order
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Base Delivery Fee
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  id="setting-base-delivery"
                  type="number"
                  min="0"
                  value={deliveryBaseFee}
                  onChange={(e) => setDeliveryBaseFee(Number(e.target.value))}
                  className="w-full text-sm font-bold pl-7 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Per Km Extra Fee
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  id="setting-per-km-fee"
                  type="number"
                  min="0"
                  value={deliveryFeePerKm}
                  onChange={(e) => setDeliveryFeePerKm(Number(e.target.value))}
                  className="w-full text-sm font-bold pl-7 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Free Delivery Above
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  id="setting-free-delivery-above"
                  type="number"
                  min="0"
                  value={freeDeliveryThreshold}
                  onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                  className="w-full text-sm font-bold pl-7 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. System Notification Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Admin Notification Preferences</h3>
              <p className="text-xs text-slate-500">
                Select real-time sound and banner alerts for critical operational events
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 cursor-pointer hover:bg-slate-100/70">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Manager Timeout Alert Banner
                </span>
                <span className="text-[11px] text-slate-500">
                  Highlight unacknowledged orders immediately with audio beep & modal prompt
                </span>
              </div>
              <input
                id="toggle-notify-timeout"
                type="checkbox"
                checked={notifyOnTimeout}
                onChange={(e) => setNotifyOnTimeout(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 cursor-pointer hover:bg-slate-100/70">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  New Order Incoming Notification
                </span>
                <span className="text-[11px] text-slate-500">
                  Toast notification when customer places a fresh checkout
                </span>
              </div>
              <input
                id="toggle-notify-new-order"
                type="checkbox"
                checked={notifyOnNewOrder}
                onChange={(e) => setNotifyOnNewOrder(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 cursor-pointer hover:bg-slate-100/70">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Order Cancellation Alerts
                </span>
                <span className="text-[11px] text-slate-500">
                  Alert when an order is cancelled by manager or customer
                </span>
              </div>
              <input
                id="toggle-notify-cancellation"
                type="checkbox"
                checked={notifyOnCancellation}
                onChange={(e) => setNotifyOnCancellation(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
            </label>
          </div>
        </div>

        {/* Backend API Integration Readiness Card */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs flex items-start gap-3">
          <Server className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-900 block">Central Backend API Interface</span>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              All settings configured here adhere strictly to the target NestJS + PostgreSQL schema. When connecting the production backend, configure the base API endpoint in <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">src/services/api/</code>.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            id="save-settings-btn"
            type="submit"
            size="md"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
            className="font-bold px-6"
          >
            Save System Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
