/**
 * Budget View Model
 * 
 * This file serves as a mediator between the budget service (model) and UI components (view).
 * Following the MVVM pattern, this file handles:
 * 1. Business logic related to budgets
 * 2. State transformation between model and view formats
 * 3. Error handling and validation
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Budget, 
  BudgetUpdate,
  BudgetSummary 
} from '@/models/budget/budget.model';
import * as budgetService from '@/services/budget/budget.service';
import * as subscriptionService from '@/services/subscription/subscription.service';
import { handleError } from '@/services/error/error.service';

/**
 * Interface for budget view model state
 */
export interface BudgetState {
  /** User's budget */
  budget: Budget | null;
  /** Whether data is currently loading */
  loading: boolean;
  /** Current error if any */
  error: string | null;
}

/**
 * Hook for managing budget operations
 * 
 * @param userId - The ID of the user whose budget to manage
 * @returns Functions and state for budget management
 */
export const useBudgetViewModel = (userId: string | null) => {
  // State for budget
  const [state, setState] = useState<BudgetState>({
    budget: null,
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
   * Load user's budget
   */
  const loadBudget = useCallback(async () => {
    if (!userId) {
      setState({
        budget: null,
        loading: false,
        error: null
      });
      return;
    }

    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      const budget = await budgetService.getUserBudget(userId);
      
      setState({
        budget,
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
   * Update user's budget
   * 
   * @param updates - The budget data to update
   * @returns True if the update was successful
   */
  const updateBudget = useCallback(async (updates: BudgetUpdate): Promise<boolean> => {
    if (!userId || !state.budget) {
      setState(prevState => ({
        ...prevState,
        error: 'User must be logged in and have a budget to update it'
      }));
      return false;
    }

    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      await budgetService.updateUserBudget(state.budget.id, updates);
      
      // Update local state
      setState(prevState => ({
        ...prevState,
        loading: false,
        budget: prevState.budget 
          ? { ...prevState.budget, ...updates, updatedAt: new Date().toISOString() } 
          : null
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
  }, [userId, state.budget]);

  /**
   * Calculate budget summary with spending information
   * 
   * @returns Budget summary with calculated fields
   */
  const getBudgetSummary = useCallback(async (): Promise<BudgetSummary | null> => {
    if (!userId || !state.budget) {
      return null;
    }

    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      // Get all subscriptions to calculate total spending
      const subscriptions = await subscriptionService.getUserSubscriptions(userId);
      
      // Calculate total monthly cost
      const currentSpending = subscriptionService.calculateMonthlySubscriptionCost(subscriptions);
      
      // Calculate remaining budget and percentage used
      const remainingBudget = state.budget.monthlyBudget - currentSpending;
      const percentUsed = (currentSpending / state.budget.monthlyBudget) * 100;
      
      setState(prevState => ({ ...prevState, loading: false }));
      
      return {
        id: state.budget.id,
        monthlyBudget: state.budget.monthlyBudget,
        currentSpending,
        remainingBudget,
        currency: state.budget.currency,
        percentUsed,
        isOverBudget: remainingBudget < 0
      };
    } catch (error) {
      const appError = handleError(error);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: appError.message
      }));
      return null;
    }
  }, [userId, state.budget]);

  /**
   * Load budget when userId changes
   */
  useEffect(() => {
    loadBudget();
  }, [userId, loadBudget]);

  return {
    ...state,
    clearError,
    loadBudget,
    updateBudget,
    getBudgetSummary
  };
}; 