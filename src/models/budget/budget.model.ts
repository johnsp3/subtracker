/**
 * Budget Model
 * 
 * This file defines types and interfaces related to budget data.
 * Following the Single Responsibility Principle, this file only handles
 * budget data structures.
 */

/**
 * Budget entity interface
 * 
 * Represents a user's monthly budget for subscriptions
 */
export interface Budget {
  /** Unique identifier */
  id: string;
  
  /** User ID who owns this budget */
  userId: string;
  
  /** Monthly budget amount */
  monthlyBudget: number;
  
  /** Currency used for the budget */
  currency: string;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Default budget amount for new users
 */
export const DEFAULT_MONTHLY_BUDGET = 1000.00;

/**
 * Data needed to update a budget
 * Omitting read-only fields
 */
export type BudgetUpdate = Partial<Omit<Budget, 'id' | 'userId' | 'createdAt'>>;

/**
 * Budget with additional calculated fields for display
 */
export interface BudgetSummary {
  id: string;
  monthlyBudget: number;
  currentSpending: number;
  remainingBudget: number;
  currency: string;
  percentUsed: number;
  isOverBudget: boolean;
} 