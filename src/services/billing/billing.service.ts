/**
 * Billing Service
 * 
 * This file is responsible for handling all billing-related database operations.
 * Following the Single Responsibility Principle, this file only handles operations
 * related to billing records.
 */
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebase.service';
import { 
  BillingRecord, 
  NewBillingRecord
} from '@/models/billing/billing.model';

// Collection reference
const COLLECTION_NAME = 'billing';

/**
 * Add a new billing record for a user
 * 
 * @param userId - The ID of the user who owns the billing record
 * @param billing - The billing record data to add
 * @returns The ID of the newly created billing record
 */
export const addBillingRecord = async (userId: string, billing: NewBillingRecord): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...billing,
      userId,
      timestamp: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding billing record:', error);
    throw error;
  }
};

/**
 * Get billing history for a user
 * 
 * @param userId - The ID of the user whose billing history to fetch
 * @returns An array of billing record objects
 */
export const getUserBillingHistory = async (userId: string): Promise<BillingRecord[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firebase timestamps to string dates if needed
      return {
        ...data,
        id: doc.id,
        date: data.date instanceof Timestamp 
          ? data.date.toDate().toISOString() 
          : data.date,
      } as BillingRecord;
    });
  } catch (error) {
    console.error('Error getting billing history:', error);
    throw error;
  }
};

/**
 * Get billing records for a specific subscription
 * 
 * @param userId - The ID of the user who owns the subscription
 * @param subscriptionId - The ID of the subscription to fetch billing records for
 * @returns An array of billing record objects
 */
export const getSubscriptionBillingHistory = async (
  userId: string,
  subscriptionId: string
): Promise<BillingRecord[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', userId),
      where('subscriptionId', '==', subscriptionId)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        ...data,
        id: doc.id,
        date: data.date instanceof Timestamp 
          ? data.date.toDate().toISOString() 
          : data.date,
      } as BillingRecord;
    });
  } catch (error) {
    console.error('Error getting subscription billing history:', error);
    throw error;
  }
}; 