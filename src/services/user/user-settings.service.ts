/**
 * User Settings Service
 * 
 * This file is responsible for handling all user settings related database operations.
 * Following the Single Responsibility Principle, this file only handles operations
 * related to user settings and notification preferences.
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
  UserSettings,
  UserSettingsUpdate,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_CURRENCY_PREFERENCES
} from '@/models/user/user-settings.model';

// Collection reference
const COLLECTION_NAME = 'userSettings';

/**
 * Get a user's settings, creating default settings if none exist
 * 
 * @param userId - The ID of the user whose settings to fetch
 * @returns The user settings object or null if an error occurs
 */
export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    // Check if user already has settings
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    // If user has at least one settings document
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
      } as UserSettings;
    }
    
    // Create default settings for new users
    return await createDefaultUserSettings(userId);
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw error;
  }
};

/**
 * Create default settings for a new user
 * 
 * @param userId - The ID of the user to create settings for
 * @returns The newly created settings object
 */
export const createDefaultUserSettings = async (userId: string): Promise<UserSettings> => {
  try {
    const defaultSettings = {
      userId,
      notifications: DEFAULT_NOTIFICATION_PREFERENCES,
      currency: DEFAULT_CURRENCY_PREFERENCES,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), defaultSettings);
    
    return {
      ...defaultSettings,
      id: docRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as UserSettings;
  } catch (error) {
    console.error('Error creating default user settings:', error);
    throw error;
  }
};

/**
 * Update a user's settings
 * 
 * @param id - The ID of the settings document to update
 * @param data - The updated settings data
 * @returns True if update was successful
 */
export const updateUserSettings = async (id: string, data: UserSettingsUpdate): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
}; 