/**
 * User Settings View Model
 * 
 * This file serves as a mediator between the user settings service (model) and UI components (view).
 * Following the MVVM pattern, this file handles:
 * 1. Business logic related to user settings and notification preferences
 * 2. State transformation between model and view formats
 * 3. Error handling and validation
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  UserSettings, 
  UserSettingsUpdate,
  NotificationPreferences,
  NotificationSettingsDisplay,
  CurrencyPreferences,
  CurrencySettingsDisplay,
  NotificationDay
} from '@/models/user/user-settings.model';
import { CurrencyCode } from '@/models/currency/currency.model';
import * as userSettingsService from '@/services/user/user-settings.service';
import { handleError, createError, ErrorType } from '@/services/error/error.service';

/**
 * Interface for user settings view model state
 */
export interface UserSettingsState {
  /** User's settings */
  settings: UserSettings | null;
  /** Whether data is currently loading */
  loading: boolean;
  /** Current error if any */
  error: string | null;
}

/**
 * Hook for managing user settings operations
 * 
 * @param userId - The ID of the user whose settings to manage
 * @returns Functions and state for user settings management
 */
export const useUserSettingsViewModel = (userId: string | null) => {
  // State for settings
  const [state, setState] = useState<UserSettingsState>({
    settings: null,
    loading: false,
    error: null
  });

  /**
   * Clear any error messages
   */
  const clearError = useCallback(() => {
    setState(prevState => ({ ...prevState, error: null }));
  }, []);

  /**
   * Load user's settings
   */
  const loadUserSettings = useCallback(async () => {
    if (!userId) {
      setState({
        settings: null,
        loading: false,
        error: null
      });
      return;
    }

    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      const settings = await userSettingsService.getUserSettings(userId);
      
      setState({
        settings,
        loading: false,
        error: null
      });
    } catch (error) {
      const appError = handleError(error);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: appError.message
      }));
    }
  }, [userId]);

  /**
   * Update user's settings
   * 
   * @param data - The settings data to update
   * @returns True if update was successful
   */
  const updateUserSettings = useCallback(async (data: UserSettingsUpdate): Promise<boolean> => {
    if (!state.settings) {
      return false;
    }

    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      // Update in Firestore
      const success = await userSettingsService.updateUserSettings(state.settings.id, data);
      
      if (success) {
        // Update local state
        setState(prevState => ({
          ...prevState,
          settings: {
            ...prevState.settings!,
            ...data,
            updatedAt: new Date().toISOString()
          },
          loading: false
        }));
      }
      
      return success;
    } catch (error) {
      const appError = handleError(error);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: appError.message
      }));
      return false;
    }
  }, [state.settings]);

  /**
   * Update notification preferences
   * 
   * @param notifications - The updated notification preferences
   * @returns True if update was successful
   */
  const updateNotificationPreferences = useCallback(async (notifications: NotificationPreferences): Promise<boolean> => {
    return await updateUserSettings({ notifications });
  }, [updateUserSettings]);

  /**
   * Update currency preferences
   * 
   * @param currency - The updated currency preferences
   * @returns True if update was successful
   */
  const updateCurrencyPreferences = useCallback(async (currency: CurrencyPreferences): Promise<boolean> => {
    return await updateUserSettings({ currency });
  }, [updateUserSettings]);

  /**
   * Toggle global notifications on/off
   * 
   * @param enabled - Whether notifications should be enabled
   * @returns True if update was successful
   */
  const toggleGlobalNotifications = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (!state.settings) {
      return false;
    }
    
    const updatedNotifications = {
      ...state.settings.notifications,
      enabled
    };
    
    return await updateNotificationPreferences(updatedNotifications);
  }, [state.settings, updateNotificationPreferences]);

  /**
   * Toggle dual currency display on/off
   * 
   * @param enabled - Whether dual currency should be shown
   * @returns True if update was successful
   */
  const toggleDualCurrencyDisplay = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (!state.settings) {
      return false;
    }
    
    const updatedCurrencyPrefs = {
      ...state.settings.currency,
      showDualCurrency: enabled
    };
    
    return await updateCurrencyPreferences(updatedCurrencyPrefs);
  }, [state.settings, updateCurrencyPreferences]);

  /**
   * Update primary currency
   * 
   * @param currency - The new primary currency
   * @returns True if update was successful
   */
  const updatePrimaryCurrency = useCallback(async (currency: CurrencyCode): Promise<boolean> => {
    if (!state.settings) {
      return false;
    }
    
    const updatedCurrencyPrefs = {
      ...state.settings.currency,
      primaryCurrency: currency
    };
    
    return await updateCurrencyPreferences(updatedCurrencyPrefs);
  }, [state.settings, updateCurrencyPreferences]);

  /**
   * Update secondary currency
   * 
   * @param currency - The new secondary currency
   * @returns True if update was successful
   */
  const updateSecondaryCurrency = useCallback(async (currency: CurrencyCode): Promise<boolean> => {
    if (!state.settings) {
      return false;
    }
    
    const updatedCurrencyPrefs = {
      ...state.settings.currency,
      secondaryCurrency: currency
    };
    
    return await updateCurrencyPreferences(updatedCurrencyPrefs);
  }, [state.settings, updateCurrencyPreferences]);

  /**
   * Update notification days
   * 
   * @param days - Array of days before renewal to notify
   * @returns True if update was successful
   */
  const updateNotificationDays = useCallback(async (days: NotificationDay[]): Promise<boolean> => {
    if (!state.settings) {
      return false;
    }
    
    const updatedNotifications = {
      ...state.settings.notifications,
      daysBeforeRenewal: days
    };
    
    return await updateNotificationPreferences(updatedNotifications);
  }, [state.settings, updateNotificationPreferences]);

  /**
   * Toggle browser notifications on/off
   * 
   * @param enabled - Whether browser notifications should be enabled
   * @returns True if update was successful
   */
  const toggleBrowserNotifications = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (!state.settings) {
      return false;
    }
    
    const updatedNotifications = {
      ...state.settings.notifications,
      browserNotifications: enabled
    };
    
    return await updateNotificationPreferences(updatedNotifications);
  }, [state.settings, updateNotificationPreferences]);

  /**
   * Toggle system notifications on/off
   * 
   * @param enabled - Whether system notifications should be enabled
   * @returns True if update was successful
   */
  const toggleSystemNotifications = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (!state.settings) {
      return false;
    }
    
    const updatedNotifications = {
      ...state.settings.notifications,
      systemNotifications: enabled
    };
    
    return await updateNotificationPreferences(updatedNotifications);
  }, [state.settings, updateNotificationPreferences]);

  /**
   * Get notification settings for display
   * 
   * @returns Notification settings formatted for display
   */
  const getNotificationSettingsDisplay = useCallback((): NotificationSettingsDisplay | null => {
    if (!state.settings) {
      return null;
    }
    
    return {
      enabled: state.settings.notifications.enabled,
      notifyDaysBefore: state.settings.notifications.daysBeforeRenewal,
      browserEnabled: state.settings.notifications.browserNotifications,
      systemEnabled: state.settings.notifications.systemNotifications
    };
  }, [state.settings]);

  /**
   * Get currency settings for display
   * 
   * @returns Currency settings formatted for display
   */
  const getCurrencySettingsDisplay = useCallback((): CurrencySettingsDisplay | null => {
    if (!state.settings) {
      return null;
    }
    
    return {
      primaryCurrency: state.settings.currency.primaryCurrency,
      secondaryCurrency: state.settings.currency.secondaryCurrency,
      showDualCurrency: state.settings.currency.showDualCurrency
    };
  }, [state.settings]);

  /**
   * Load user settings when userId changes
   */
  useEffect(() => {
    loadUserSettings();
  }, [userId, loadUserSettings]);

  return {
    ...state,
    clearError,
    loadUserSettings,
    updateUserSettings,
    updateNotificationPreferences,
    updateCurrencyPreferences,
    toggleGlobalNotifications,
    toggleDualCurrencyDisplay,
    updatePrimaryCurrency,
    updateSecondaryCurrency,
    updateNotificationDays,
    toggleBrowserNotifications,
    toggleSystemNotifications,
    getNotificationSettingsDisplay,
    getCurrencySettingsDisplay
  };
}; 