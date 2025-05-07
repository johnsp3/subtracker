/**
 * Auth Service
 * 
 * This file is responsible for handling authentication operations.
 * Following the Single Responsibility Principle, this file only handles operations
 * related to authentication.
 */
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  UserCredential,
  User,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, googleProvider } from '@/services/firebase/firebase.service';
import { handleFirebaseError } from '@/services/error/error.service';
import { AuthResult } from '@/models/auth/auth.model';

/**
 * Sign in with Google
 * 
 * @returns Promise with authentication result
 */
export const signInWithGoogle = async (): Promise<AuthResult> => {
  try {
    // Set persistent auth state
    await setPersistence(auth, browserLocalPersistence);
    
    // Sign in with popup
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    
    // Add access token to auth header for API calls if needed
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    // Return the auth result
    return {
      success: true,
      user: result.user
    };
  } catch (error) {
    const appError = handleFirebaseError(error);
    return {
      success: false,
      error: appError.message
    };
  }
};

/**
 * Sign out the current user
 * 
 * @returns Promise with sign out result
 */
export const signOutUser = async (): Promise<AuthResult> => {
  try {
    await signOut(auth);
    return {
      success: true
    };
  } catch (error) {
    const appError = handleFirebaseError(error);
    return {
      success: false,
      error: appError.message
    };
  }
};

/**
 * Get the current user
 * 
 * @returns The current Firebase User or null if not authenticated
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Check if user is authenticated
 * 
 * @returns True if user is signed in
 */
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
}; 