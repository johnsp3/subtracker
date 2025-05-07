/**
 * Auth Model
 * 
 * This file defines types and interfaces related to authentication data.
 * Following the Single Responsibility Principle, this file only handles
 * authentication data structures.
 */
import { User } from 'firebase/auth';

/**
 * Auth state interface
 */
export interface AuthState {
  /** The currently authenticated user, if any */
  user: User | null;
  
  /** Whether authentication is in progress */
  loading: boolean;
  
  /** The current authentication error, if any */
  error: string | null;
}

/**
 * Authentication result interface
 */
export interface AuthResult {
  /** Whether the operation was successful */
  success: boolean;
  
  /** Error message if the operation failed */
  error?: string;
  
  /** User data if authentication was successful */
  user?: User;
}

/**
 * User profile interface
 */
export interface UserProfile {
  /** User ID */
  id: string;
  
  /** Display name */
  displayName: string | null;
  
  /** Email */
  email: string | null;
  
  /** Avatar URL */
  photoURL: string | null;
  
  /** When the user signed in */
  lastSignInTime: string | null | undefined;
  
  /** When the user account was created */
  creationTime: string | null | undefined;
}

/**
 * Convert a Firebase User to a UserProfile
 * 
 * @param user - The Firebase User to convert
 * @returns A UserProfile object
 */
export const mapUserToProfile = (user: User | null): UserProfile | null => {
  if (!user) return null;
  
  return {
    id: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastSignInTime: user.metadata.lastSignInTime,
    creationTime: user.metadata.creationTime
  };
}; 