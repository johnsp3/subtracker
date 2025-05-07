/**
 * Subscription View Model
 * 
 * This file serves as a mediator between the subscription service (model) and UI components (view).
 * Following the MVVM pattern, this file handles:
 * 1. Business logic related to subscriptions
 * 2. State transformation between model and view formats
 * 3. Error handling and validation
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Subscription, 
  SubscriptionDisplay,
  NewSubscription, 
  SubscriptionUpdate 
} from '@/models/subscription/subscription.model';
import * as subscriptionService from '@/services/subscription/subscription.service';
import { handleError, ErrorType, createError } from '@/services/error/error.service';

/**
 * Interface for subscription view model state
 */
export interface SubscriptionState {
  /** List of user subscriptions */
  subscriptions: Subscription[];
  /** Whether data is currently loading */
  loading: boolean;
  /** Current error if any */
  error: string | null;
}

/**
 * Hook for managing subscription operations
 * 
 * @param userId - The ID of the user whose subscriptions to manage
 * @returns Functions and state for subscription management
 */
export const useSubscriptionViewModel = (userId: string | null) => {
  // State for subscriptions
  const [state, setState] = useState<SubscriptionState>({
    subscriptions: [],
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
   * Load all subscriptions for the current user
   */
  const loadSubscriptions = useCallback(async () => {
    if (!userId) {
      setState({
        subscriptions: [],
        loading: false,
        error: null
      });
      return;
    }

    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      const subscriptions = await subscriptionService.getUserSubscriptions(userId);
      
      setState({
        subscriptions,
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
   * Add a new subscription
   * 
   * @param subscription - The subscription data to add
   * @returns The ID of the newly created subscription or null if failed
   */
  const addSubscription = useCallback(async (subscription: NewSubscription): Promise<string | null> => {
    if (!userId) {
      setState(prevState => ({
        ...prevState,
        error: 'User must be logged in to add a subscription'
      }));
      return null;
    }

    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      const subscriptionId = await subscriptionService.addSubscription(userId, subscription);
      
      // Reload subscriptions to get the updated list
      await loadSubscriptions();
      
      return subscriptionId;
    } catch (error) {
      const appError = handleError(error);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: appError.message
      }));
      return null;
    }
  }, [userId, loadSubscriptions]);

  /**
   * Update an existing subscription
   * 
   * @param subscriptionId - The ID of the subscription to update
   * @param updates - The subscription data to update
   * @returns True if the update was successful
   */
  const updateSubscription = useCallback(async (
    subscriptionId: string, 
    updates: SubscriptionUpdate
  ): Promise<boolean> => {
    if (!userId) {
      setState(prevState => ({
        ...prevState,
        error: 'User must be logged in to update a subscription'
      }));
      return false;
    }

    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      await subscriptionService.updateSubscription(subscriptionId, updates);
      
      // Reload subscriptions to get the updated list
      await loadSubscriptions();
      
      return true;
    } catch (error) {
      const appError = handleError(error);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: appError.message
      }));
      return false;
    }
  }, [userId, loadSubscriptions]);

  /**
   * Delete a subscription
   * 
   * @param subscriptionId - The ID of the subscription to delete
   * @returns True if the deletion was successful
   */
  const deleteSubscription = useCallback(async (subscriptionId: string): Promise<boolean> => {
    if (!userId) {
      setState(prevState => ({
        ...prevState,
        error: 'User must be logged in to delete a subscription'
      }));
      return false;
    }

    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      await subscriptionService.deleteSubscription(subscriptionId);
      
      // Update local state to remove the deleted subscription
      setState(prevState => ({
        ...prevState,
        loading: false,
        subscriptions: prevState.subscriptions.filter(sub => sub.id !== subscriptionId)
      }));
      
      return true;
    } catch (error) {
      const appError = handleError(error);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: appError.message
      }));
      return false;
    }
  }, [userId]);

  /**
   * Toggle notification status for a subscription
   * 
   * @param subscriptionId - The ID of the subscription to toggle notifications for
   * @returns True if the update was successful
   */
  const toggleNotification = useCallback(async (subscriptionId: string): Promise<boolean> => {
    if (!userId) {
      setState(prevState => ({
        ...prevState,
        error: 'User must be logged in to update notification settings'
      }));
      return false;
    }

    try {
      // Find the subscription in the current state
      const subscription = state.subscriptions.find(sub => sub.id === subscriptionId);
      
      if (!subscription) {
        throw createError(
          ErrorType.VALIDATION,
          `Subscription with ID ${subscriptionId} not found`
        );
      }

      // Toggle the notification status
      const newStatus = !subscription.notificationsEnabled;
      
      await subscriptionService.updateSubscription(subscriptionId, {
        notificationsEnabled: newStatus
      });

      // Update the local state without reloading all subscriptions
      setState(prevState => ({
        ...prevState,
        subscriptions: prevState.subscriptions.map(sub => 
          sub.id === subscriptionId
            ? { ...sub, notificationsEnabled: newStatus }
            : sub
        )
      }));

      return true;
    } catch (error) {
      const appError = handleError(error);
      setState(prevState => ({
        ...prevState,
        error: appError.message
      }));
      return false;
    }
  }, [userId, state.subscriptions]);

  /**
   * Transform subscriptions into display-ready format grouped by timeframe
   * 
   * @returns Object with subscriptions grouped by timeframe
   */
  const getSubscriptionsByTimeframe = useCallback(() => {
    if (state.subscriptions.length === 0) {
      return {
        'Coming up': [],
        'Last week': []
      };
    }

    const result: Record<string, SubscriptionDisplay[]> = {
      'Coming up': [],
      'Last week': []
    };

    state.subscriptions.forEach(sub => {
      const nextBillingDate = new Date(sub.nextBilling);
      const today = new Date();
      const daysUntilBilling = Math.ceil(
        (nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const displaySubscription: SubscriptionDisplay = {
        id: sub.id,
        name: sub.name,
        logo: sub.logo || sub.name,
        amount: `${sub.currency}${sub.price.toFixed(2)}`,
        nextPayment: daysUntilBilling <= 7 ? `In ${daysUntilBilling} days` : 'Next month',
        daysLeft: daysUntilBilling,
        category: sub.category,
        notificationsEnabled: sub.notificationsEnabled
      };

      // Sort subscriptions into timeframes
      if (daysUntilBilling <= 7) {
        result['Coming up'].push(displaySubscription);
      } else {
        result['Last week'].push(displaySubscription);
      }
    });

    // Sort within each timeframe by days left
    Object.keys(result).forEach(timeframe => {
      result[timeframe].sort((a, b) => a.daysLeft - b.daysLeft);
    });

    return result;
  }, [state.subscriptions]);

  /**
   * Calculate total monthly cost of all subscriptions
   * 
   * @returns The total monthly cost
   */
  const calculateTotalMonthlyCost = useCallback((): number => {
    return subscriptionService.calculateMonthlySubscriptionCost(state.subscriptions);
  }, [state.subscriptions]);

  /**
   * Load subscriptions when userId changes
   */
  useEffect(() => {
    loadSubscriptions();
  }, [userId, loadSubscriptions]);

  return {
    ...state,
    clearError,
    loadSubscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleNotification,
    getSubscriptionsByTimeframe,
    calculateTotalMonthlyCost
  };
}; 