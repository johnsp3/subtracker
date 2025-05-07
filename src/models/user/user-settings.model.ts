/**
 * User Settings Model
 * 
 * This file defines types and interfaces related to user settings and preferences.
 * Following the Single Responsibility Principle, this file only handles
 * user settings data structures.
 */

import { CurrencyCode } from '@/models/currency/currency.model';

/**
 * Days before renewal when notifications can be sent
 */
export type NotificationDay = 1 | 3 | 5;

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  /** Whether notifications are enabled globally */
  enabled: boolean;
  
  /** Days before renewal when notifications should be sent */
  daysBeforeRenewal: NotificationDay[];
  
  /** Whether to show browser notifications */
  browserNotifications: boolean;
  
  /** Whether to show system notifications (if supported) */
  systemNotifications: boolean;
}

/**
 * User currency preferences
 */
export interface CurrencyPreferences {
  /** Primary currency used throughout the app */
  primaryCurrency: CurrencyCode;
  
  /** Secondary currency to display alongside primary */
  secondaryCurrency: CurrencyCode;
  
  /** Whether to show dual currency display */
  showDualCurrency: boolean;
}

/**
 * Default notification preferences for new users
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false,
  daysBeforeRenewal: [1],
  browserNotifications: true,
  systemNotifications: false
};

/**
 * Default currency preferences for new users
 */
export const DEFAULT_CURRENCY_PREFERENCES: CurrencyPreferences = {
  primaryCurrency: 'EUR',
  secondaryCurrency: 'USD',
  showDualCurrency: true
};

/**
 * User settings entity interface
 */
export interface UserSettings {
  /** Unique identifier */
  id: string;
  
  /** User ID who owns these settings */
  userId: string;
  
  /** Notification preferences */
  notifications: NotificationPreferences;
  
  /** Currency preferences */
  currency: CurrencyPreferences;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Data needed to update user settings
 * Omitting read-only fields
 */
export type UserSettingsUpdate = Partial<Omit<UserSettings, 'id' | 'userId' | 'createdAt'>>;

/**
 * Notification settings for display and form handling
 */
export interface NotificationSettingsDisplay {
  enabled: boolean;
  notifyDaysBefore: NotificationDay[];
  browserEnabled: boolean;
  systemEnabled: boolean;
}

/**
 * Currency settings for display and form handling
 */
export interface CurrencySettingsDisplay {
  primaryCurrency: CurrencyCode;
  secondaryCurrency: CurrencyCode;
  showDualCurrency: boolean;
} 