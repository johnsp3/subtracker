/**
 * Budget Service
 * 
 * This file is responsible for handling all budget-related database operations.
 * Following the Single Responsibility Principle, this file only handles operations
 * related to budget management.
 */
import { 
  collection, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebase.service';
import { 
  Budget, 
  BudgetUpdate,
  DEFAULT_MONTHLY_BUDGET
} from '@/models/budget/budget.model';

// Collection reference
const COLLECTION_NAME = 'budgets';

/**
 * Get a user's budget, creating a default one if none exists
 * 
 * @param userId - The ID of the user whose budget to fetch
 * @returns The budget object or null if an error occurs
 */
export const getUserBudget = async (userId: string): Promise<Budget | null> => {
  try {
    // Check if user already has a budget
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    // If user has at least one budget document
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      return {
        ...docData,
        id: querySnapshot.docs[0].id,
        createdAt: docData.createdAt instanceof Timestamp 
          ? docData.createdAt.toDate().toISOString() 
          : docData.createdAt,
        updatedAt: docData.updatedAt instanceof Timestamp 
          ? docData.updatedAt.toDate().toISOString() 
          : docData.updatedAt
      } as Budget;
    }
    
    // Create a default budget for new users
    return await createDefaultBudget(userId);
  } catch (error) {
    console.error('Error getting user budget:', error);
    throw error;
  }
};

/**
 * Create a default budget for a new user
 * 
 * @param userId - The ID of the user to create a budget for
 * @returns The newly created budget object
 */
const createDefaultBudget = async (userId: string): Promise<Budget> => {
  try {
    const defaultBudget = {
      userId,
      monthlyBudget: DEFAULT_MONTHLY_BUDGET,
      currency: '€', // Default currency
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), defaultBudget);
    
    return {
      ...defaultBudget,
      id: docRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Budget;
  } catch (error) {
    console.error('Error creating default budget:', error);
    throw error;
  }
};

/**
 * Update a user's budget
 * 
 * @param budgetId - The ID of the budget to update
 * @param updates - The budget data to update
 * @returns True if the update was successful
 */
export const updateUserBudget = async (
  budgetId: string, 
  updates: BudgetUpdate
): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, budgetId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating budget:', error);
    throw error;
  }
}; 