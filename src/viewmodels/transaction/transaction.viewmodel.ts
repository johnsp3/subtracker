/**
 * Transaction View Model
 * 
 * This file serves as a mediator between the transaction service (model) and UI components (view).
 * Following the MVVM pattern, this file handles:
 * 1. Business logic related to transactions
 * 2. State transformation between model and view formats
 * 3. Error handling and validation
 */
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  Transaction, 
  TransactionType,
  TransactionDisplay,
  TransactionsByTimeframe,
  NewTransaction,
  TransactionUpdate
} from '@/models/transaction/transaction.model';
import * as transactionService from '@/services/transaction/transaction.service';
import { handleError } from '@/services/error/error.service';

/**
 * Interface for transaction view model state
 */
export interface TransactionState {
  /** List of user transactions */
  transactions: Transaction[];
  /** Whether data is currently loading */
  loading: boolean;
  /** Current error if any */
  error: string | null;
}

/**
 * Hook for managing transaction data and operations
 * 
 * @param userId - User ID to fetch transactions for
 * @returns Transaction state and functions
 */
export const useTransactionViewModel = (userId: string | null) => {
  // Transaction state
  const [state, setState] = useState<TransactionState>({
    transactions: [],
    loading: false,
    error: null
  });

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setState((prevState) => ({ ...prevState, error: null }));
  }, []);

  /**
   * Load user transactions
   */
  const loadTransactions = useCallback(async () => {
    // If no user is logged in, return empty array
    if (!userId) {
      setState({
        transactions: [],
        loading: false,
        error: null
      });
      return;
    }
    
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      
      const transactions = await transactionService.getTransactions(userId);
      
      setState({
        transactions,
        loading: false,
        error: null
      });
    } catch (error) {
      const appError = handleError(error);
      
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: appError.message
      }));
    }
  }, [userId]);

  /**
   * Add a new transaction
   * 
   * @param transaction - New transaction data
   * @returns True if the transaction was added successfully
   */
  const addTransaction = useCallback(async (transaction: NewTransaction): Promise<boolean> => {
    if (!userId) {
      setState((prevState) => ({ 
        ...prevState, 
        error: 'User must be logged in to add a transaction' 
      }));
      return false;
    }
    
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      
      const newTransaction = await transactionService.addTransaction(userId, transaction);
      
      setState((prevState) => ({
        ...prevState,
        transactions: [...prevState.transactions, newTransaction],
        loading: false
      }));
      
      return true;
    } catch (error) {
      const appError = handleError(error);
      
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: appError.message
      }));
      
      return false;
    }
  }, [userId]);

  /**
   * Update a transaction
   * 
   * @param id - Transaction ID
   * @param update - Update data
   * @returns True if the transaction was updated successfully
   */
  const updateTransaction = useCallback(async (
    id: string, 
    update: TransactionUpdate
  ): Promise<boolean> => {
    if (!userId) {
      setState((prevState) => ({ 
        ...prevState, 
        error: 'User must be logged in to update a transaction' 
      }));
      return false;
    }
    
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      
      const updatedTransaction = await transactionService.updateTransaction(
        userId, 
        id, 
        update
      );
      
      setState((prevState) => ({
        ...prevState,
        transactions: prevState.transactions.map(t => 
          t.id === id ? updatedTransaction : t
        ),
        loading: false
      }));
      
      return true;
    } catch (error) {
      const appError = handleError(error);
      
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: appError.message
      }));
      
      return false;
    }
  }, [userId]);

  /**
   * Delete a transaction
   * 
   * @param id - Transaction ID
   * @returns True if the transaction was deleted successfully
   */
  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    if (!userId) {
      setState((prevState) => ({ 
        ...prevState, 
        error: 'User must be logged in to delete a transaction' 
      }));
      return false;
    }
    
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      
      const success = await transactionService.deleteTransaction(userId, id);
      
      if (success) {
        setState((prevState) => ({
          ...prevState,
          transactions: prevState.transactions.filter(t => t.id !== id),
          loading: false
        }));
      }
      
      return success;
    } catch (error) {
      const appError = handleError(error);
      
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: appError.message
      }));
      
      return false;
    }
  }, [userId]);

  /**
   * Format transaction amount with currency symbol
   * 
   * @param transaction - The transaction to format
   * @returns Formatted amount string
   */
  const formatAmount = (transaction: Transaction): string => {
    const sign = transaction.type === TransactionType.EXPENSE ? '-' : '+';
    return `${sign}${transaction.currency}${Math.abs(transaction.amount).toFixed(2)}`;
  };

  /**
   * Format transaction date for display
   * 
   * @param isoDate - ISO date string
   * @returns Formatted date string
   */
  const formatTransactionDate = (isoDate: string): string => {
    try {
      const date = new Date(isoDate);
      return format(date, 'h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  /**
   * Get transactions grouped by timeframe
   * 
   * @returns Object with transactions grouped by timeframe
   */
  const getTransactionsByTimeframe = useCallback((): TransactionsByTimeframe => {
    const result: TransactionsByTimeframe = {
      'Today': [],
      'Yesterday': [],
    };
    
    // Group transactions by day
    state.transactions.forEach(transaction => {
      const txDate = new Date(transaction.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Format the display transaction
      const displayTransaction: TransactionDisplay = {
        id: transaction.id,
        name: transaction.name,
        displayDate: formatTransactionDate(transaction.date),
        date: transaction.date,
        displayAmount: formatAmount(transaction),
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        icon: transaction.icon || 'https://picsum.photos/id/1/40/40' // Default icon
      };
      
      // Check which day this transaction belongs to
      if (txDate.setHours(0,0,0,0) === today.setHours(0,0,0,0)) {
        result['Today'].push(displayTransaction);
      } else if (txDate.setHours(0,0,0,0) === yesterday.setHours(0,0,0,0)) {
        result['Yesterday'].push(displayTransaction);
      }
    });
    
    return result;
  }, [state.transactions]);

  // Load transactions when the component mounts or userId changes
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    ...state,
    clearError,
    loadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByTimeframe
  };
}; 