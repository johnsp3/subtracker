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
  Timestamp,
  DocumentData,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Subscription, BillingRecord, Budget, UserSettings, NotificationPreferences } from './types';

// Collection references
const subscriptionsCollection = 'subscriptions';
const billingCollection = 'billing';
const budgetCollection = 'budgets';
const userSettingsCollection = 'userSettings';

// Default monthly budget amount
const DEFAULT_MONTHLY_BUDGET = 1000.00;

// Default notification preferences
const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false,
  daysBeforeRenewal: [1],
  browserNotifications: true,
  systemNotifications: false
};

// Add new subscription
export const addSubscription = async (userId: string, subscription: Omit<Subscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, subscriptionsCollection), {
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

// Get all user subscriptions
export const getUserSubscriptions = async (userId: string): Promise<Subscription[]> => {
  try {
    const q = query(collection(db, subscriptionsCollection), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Firebase timestamps to string dates if needed
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
      } as Subscription;
    });
  } catch (error) {
    console.error('Error getting subscriptions:', error);
    throw error;
  }
};

// Update subscription
export const updateSubscription = async (subscriptionId: string, updates: Partial<Omit<Subscription, 'id' | 'userId' | 'createdAt'>>) => {
  try {
    const docRef = doc(db, subscriptionsCollection, subscriptionId);
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

// Delete subscription
export const deleteSubscription = async (subscriptionId: string) => {
  try {
    const docRef = doc(db, subscriptionsCollection, subscriptionId);
    await deleteDoc(docRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting subscription:', error);
    throw error;
  }
};

// Get subscription by ID
export const getSubscriptionById = async (subscriptionId: string): Promise<Subscription | null> => {
  try {
    const docRef = doc(db, subscriptionsCollection, subscriptionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
      } as Subscription;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting subscription:', error);
    throw error;
  }
};

// Add billing record
export const addBillingRecord = async (userId: string, billing: Omit<BillingRecord, 'id' | 'userId'>) => {
  try {
    const docRef = await addDoc(collection(db, billingCollection), {
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

// Get user's billing history
export const getUserBillingHistory = async (userId: string): Promise<BillingRecord[]> => {
  try {
    const q = query(collection(db, billingCollection), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as BillingRecord));
  } catch (error) {
    console.error('Error getting billing history:', error);
    throw error;
  }
};

// Get user's budget
export const getUserBudget = async (userId: string): Promise<Budget | null> => {
  try {
    // Check if user already has a budget
    const q = query(collection(db, budgetCollection), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    // If user has at least one budget document
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      return {
        ...docData,
        id: querySnapshot.docs[0].id,
        createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate().toISOString() : docData.createdAt,
        updatedAt: docData.updatedAt instanceof Timestamp ? docData.updatedAt.toDate().toISOString() : docData.updatedAt
      } as Budget;
    }
    
    // Create a default budget for new users
    const defaultBudget = {
      userId,
      monthlyBudget: DEFAULT_MONTHLY_BUDGET,
      currency: '€', // Default currency
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, budgetCollection), defaultBudget);
    
    return {
      ...defaultBudget,
      id: docRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Budget;
  } catch (error) {
    console.error('Error getting user budget:', error);
    throw error;
  }
};

// Update user's budget
export const updateUserBudget = async (budgetId: string, updates: Partial<Omit<Budget, 'id' | 'userId' | 'createdAt'>>) => {
  try {
    const docRef = doc(db, budgetCollection, budgetId);
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

// Get user's notification settings
export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    // Check if user already has settings
    const q = query(collection(db, userSettingsCollection), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    // If user has at least one settings document
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      return {
        ...docData,
        id: querySnapshot.docs[0].id,
        createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate().toISOString() : docData.createdAt,
        updatedAt: docData.updatedAt instanceof Timestamp ? docData.updatedAt.toDate().toISOString() : docData.updatedAt
      } as UserSettings;
    }
    
    // Create default settings for new users
    const defaultSettings = {
      userId,
      notifications: DEFAULT_NOTIFICATION_PREFERENCES,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, userSettingsCollection), defaultSettings);
    
    return {
      ...defaultSettings,
      id: docRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as UserSettings;
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw error;
  }
};

// Update user's notification settings
export const updateUserSettings = async (settingsId: string, updates: Partial<Omit<UserSettings, 'id' | 'userId' | 'createdAt'>>) => {
  try {
    const docRef = doc(db, userSettingsCollection, settingsId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

// Calculate monthly subscription cost
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