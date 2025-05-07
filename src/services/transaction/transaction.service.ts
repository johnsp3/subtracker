/**
 * Transaction Service
 * 
 * This file provides methods to interact with transaction data.
 * Currently uses mock data, but can be extended to use a real API.
 */
import { 
  Transaction, 
  TransactionType,
  NewTransaction, 
  TransactionUpdate 
} from '@/models/transaction/transaction.model';
import { handleError, createError, ErrorType } from '@/services/error/error.service';

// Mock data for transactions (would be replaced by API calls in a real app)
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    name: 'Netflix Subscription',
    date: new Date().toISOString(),
    amount: 12.99,
    currency: '$',
    type: TransactionType.EXPENSE,
    category: 'Entertainment',
    userId: 'mock-user-id',
    icon: 'https://picsum.photos/id/0/40/40'
  },
  {
    id: '2',
    name: 'Salary Deposit',
    date: new Date().toISOString(),
    amount: 2750.00,
    currency: '$',
    type: TransactionType.INCOME,
    category: 'Salary',
    userId: 'mock-user-id',
    icon: 'https://picsum.photos/id/1/40/40'
  },
  {
    id: '3',
    name: 'Grocery Shopping',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    amount: 65.35,
    currency: '$',
    type: TransactionType.EXPENSE,
    category: 'Groceries',
    userId: 'mock-user-id',
    icon: 'https://picsum.photos/id/2/40/40'
  },
  {
    id: '4',
    name: 'Freelance Payment',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    amount: 350.00,
    currency: '$',
    type: TransactionType.INCOME,
    category: 'Freelance',
    userId: 'mock-user-id',
    icon: 'https://picsum.photos/id/3/40/40'
  },
];

/**
 * Get all transactions for a user
 * 
 * @param userId - User ID
 * @returns Array of transactions
 */
export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real app, this would make an API call
    return MOCK_TRANSACTIONS.filter(transaction => transaction.userId === userId);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Get a transaction by ID
 * 
 * @param userId - User ID
 * @param transactionId - Transaction ID
 * @returns Transaction or null if not found
 */
export const getTransactionById = async (
  userId: string, 
  transactionId: string
): Promise<Transaction | null> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real app, this would make an API call
    const transaction = MOCK_TRANSACTIONS.find(
      t => t.id === transactionId && t.userId === userId
    );
    
    return transaction || null;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Add a new transaction
 * 
 * @param userId - User ID
 * @param transaction - New transaction data
 * @returns The created transaction
 */
export const addTransaction = async (
  userId: string,
  transaction: NewTransaction
): Promise<Transaction> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate new ID (in a real app, this would be done by the backend)
    const newId = `mock-${Date.now()}`;
    
    // Create the transaction object (in a real app, this would be returned by the API)
    const newTransaction: Transaction = {
      id: newId,
      ...transaction,
      userId
    };
    
    // In a real app, this would be a POST request
    // For now, we'll just return the new object
    return newTransaction;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Update a transaction
 * 
 * @param userId - User ID
 * @param transactionId - Transaction ID
 * @param update - Update data
 * @returns Updated transaction
 */
export const updateTransaction = async (
  userId: string,
  transactionId: string,
  update: TransactionUpdate
): Promise<Transaction> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Find the transaction (in a real app, this would be a PUT request)
    const transaction = MOCK_TRANSACTIONS.find(
      t => t.id === transactionId && t.userId === userId
    );
    
    if (!transaction) {
      throw createError(
        ErrorType.DATABASE,
        `Transaction with ID ${transactionId} not found`
      );
    }
    
    // Update the transaction (in a real app, this would be done by the backend)
    const updatedTransaction: Transaction = {
      ...transaction,
      ...update
    };
    
    return updatedTransaction;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Delete a transaction
 * 
 * @param userId - User ID
 * @param transactionId - Transaction ID
 * @returns True if the transaction was deleted
 */
export const deleteTransaction = async (
  userId: string,
  transactionId: string
): Promise<boolean> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find the transaction (in a real app, this would be a DELETE request)
    const transaction = MOCK_TRANSACTIONS.find(
      t => t.id === transactionId && t.userId === userId
    );
    
    if (!transaction) {
      throw createError(
        ErrorType.DATABASE,
        `Transaction with ID ${transactionId} not found`
      );
    }
    
    // In a real app, this would actually delete the transaction
    return true;
  } catch (error) {
    throw handleError(error);
  }
}; 