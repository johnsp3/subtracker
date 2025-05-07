/**
 * Transaction Model
 * 
 * This file defines data structures related to transactions.
 */

/**
 * Transaction type enum
 */
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

/**
 * Base transaction interface
 */
export interface Transaction {
  /** Unique identifier */
  id: string;
  
  /** Name of the transaction */
  name: string;
  
  /** Transaction date in ISO format */
  date: string;
  
  /** Amount of the transaction */
  amount: number;
  
  /** Currency code */
  currency: string;
  
  /** Transaction type */
  type: TransactionType;
  
  /** Transaction category */
  category: string;
  
  /** User ID of the transaction owner */
  userId: string;
  
  /** Icon or logo URL */
  icon?: string;
}

/**
 * Interface for displaying a transaction in the UI
 */
export interface TransactionDisplay {
  /** Unique identifier */
  id: string;
  
  /** Name of the transaction */
  name: string;
  
  /** Formatted date for display (e.g., '2:30 PM') */
  displayDate: string;
  
  /** Original date in ISO format */
  date: string;
  
  /** Formatted amount string with currency symbol */
  displayAmount: string;
  
  /** Original amount value */
  amount: number;
  
  /** Transaction type */
  type: TransactionType;
  
  /** Transaction category */
  category: string;
  
  /** Icon or logo URL */
  icon: string;
}

/**
 * New transaction data for creating a transaction
 */
export interface NewTransaction {
  /** Name of the transaction */
  name: string;
  
  /** Transaction date */
  date: string;
  
  /** Amount of the transaction */
  amount: number;
  
  /** Currency code */
  currency: string;
  
  /** Transaction type */
  type: TransactionType;
  
  /** Transaction category */
  category: string;
  
  /** Icon or logo URL */
  icon?: string;
}

/**
 * Transaction update data
 */
export interface TransactionUpdate {
  /** Name of the transaction */
  name?: string;
  
  /** Transaction date */
  date?: string;
  
  /** Amount of the transaction */
  amount?: number;
  
  /** Currency code */
  currency?: string;
  
  /** Transaction type */
  type?: TransactionType;
  
  /** Transaction category */
  category?: string;
  
  /** Icon or logo URL */
  icon?: string;
}

/**
 * Interface for the transaction summary by timeframe
 */
export interface TransactionsByTimeframe {
  [timeframe: string]: TransactionDisplay[];
} 