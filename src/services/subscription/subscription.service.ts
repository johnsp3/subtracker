/**
 * Subscription Service
 * 
 * This file is responsible for handling all subscription-related database operations.
 * Following the Single Responsibility Principle, this file only handles operations
 * related to subscription management.
 */
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
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
  Subscription, 
  NewSubscription,
  SubscriptionUpdate
} from '@/models/subscription/subscription.model';

// Collection reference
const COLLECTION_NAME = 'subscriptions';

/**
 * Add a new subscription for a user
 * 
 * @param userId - The ID of the user who owns the subscription
 * @param subscription - The subscription data to add
 * @returns The ID of the newly created subscription
 */
export const addSubscription = async (userId: string, subscription: NewSubscription): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...subscription,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding subscription:', error);
    throw error;
  }
};

/**
 * Get all subscriptions for a user
 * 
 * @param userId - The ID of the user whose subscriptions to fetch
 * @returns An array of subscription objects
 */
export const getUserSubscriptions = async (userId: string): Promise<Subscription[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firebase timestamps to string dates
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate().toISOString() 
          : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp 
          ? data.updatedAt.toDate().toISOString() 
          : data.updatedAt
      } as Subscription;
    });
  } catch (error) {
    console.error('Error getting subscriptions:', error);
    throw error;
  }
};

/**
 * Update an existing subscription
 * 
 * @param subscriptionId - The ID of the subscription to update
 * @param updates - The subscription data to update
 * @returns True if the update was successful
 */
export const updateSubscription = async (
  subscriptionId: string, 
  updates: SubscriptionUpdate
): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, subscriptionId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

/**
 * Delete a subscription
 * 
 * @param subscriptionId - The ID of the subscription to delete
 * @returns True if the deletion was successful
 */
export const deleteSubscription = async (subscriptionId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, subscriptionId);
    await deleteDoc(docRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting subscription:', error);
    throw error;
  }
};

/**
 * Get a subscription by its ID
 * 
 * @param subscriptionId - The ID of the subscription to fetch
 * @returns The subscription object or null if not found
 */
export const getSubscriptionById = async (subscriptionId: string): Promise<Subscription | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, subscriptionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate().toISOString() 
          : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp 
          ? data.updatedAt.toDate().toISOString() 
          : data.updatedAt
      } as Subscription;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting subscription:', error);
    throw error;
  }
};

/**
 * Calculate total monthly subscription cost
 * 
 * @param subscriptions - List of subscriptions to calculate from
 * @returns The total monthly cost of all active subscriptions
 */
export const calculateMonthlySubscriptionCost = (subscriptions: Subscription[]): number => {
  return subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((total, sub) => {
      // Convert all subscriptions to monthly cost
      let monthlyCost = sub.price;
      
      if (sub.billingCycle === 'Yearly') {
        monthlyCost = sub.price / 12;
      } else if (sub.billingCycle === 'Quarterly') {
        monthlyCost = sub.price / 3;
      }
      
      return total + monthlyCost;
    }, 0);
}; 