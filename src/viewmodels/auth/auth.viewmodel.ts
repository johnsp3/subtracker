/**
 * Auth View Model
 * 
 * This file serves as a mediator between the auth service (model) and UI components (view).
 * Following the MVVM pattern, this file handles:
 * 1. Authentication state management
 * 2. Authentication operations
 * 3. Error handling and validation
 */
import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  AuthState, 
  AuthResult, 
  UserProfile, 
  mapUserToProfile 
} from '@/models/auth/auth.model';
import { auth } from '@/services/firebase/firebase.service';
import * as authService from '@/services/auth/auth.service';
import { handleError } from '@/services/error/error.service';

/**
 * Hook for managing authentication state and operations
 * 
 * @returns Auth state and functions
 */
export const useAuthViewModel = () => {
  // Authentication state
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  /**
   * Clear any error messages
   */
  const clearError = useCallback(() => {
    setState(prevState => ({ ...prevState, error: null }));
  }, []);

  /**
   * Sign in with Google
   * 
   * @returns Authentication result
   */
  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      const result = await authService.signInWithGoogle();
      
      if (!result.success) {
        setState(prevState => ({
          ...prevState,
          loading: false,
          error: result.error || 'Authentication failed'
        }));
      }
      
      return result;
    } catch (error) {
      const appError = handleError(error);
      
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: appError.message
      }));
      
      return {
        success: false,
        error: appError.message
      };
    }
  }, []);

  /**
   * Sign out the current user
   * 
   * @returns Sign out result
   */
  const signOut = useCallback(async (): Promise<AuthResult> => {
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      const result = await authService.signOutUser();
      
      if (!result.success) {
        setState(prevState => ({
          ...prevState,
          loading: false,
          error: result.error || 'Sign out failed'
        }));
      }
      
      return result;
    } catch (error) {
      const appError = handleError(error);
      
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: appError.message
      }));
      
      return {
        success: false,
        error: appError.message
      };
    }
  }, []);

  /**
   * Get the current user profile
   * 
   * @returns User profile or null if not authenticated
   */
  const getUserProfile = useCallback((): UserProfile | null => {
    return mapUserToProfile(state.user);
  }, [state.user]);

  /**
   * Check if the user is authenticated
   * 
   * @returns True if user is authenticated
   */
  const isAuthenticated = useCallback((): boolean => {
    return !!state.user;
  }, [state.user]);
  
  /**
   * Check if the user is an admin
   * 
   * @returns True if user is an admin
   */
  const isAdmin = useCallback((): boolean => {
    // In a real app, this might check custom claims or admin status
    // For now, we'll return a simple check based on email
    return !!state.user?.email?.includes('admin');
  }, [state.user]);

  /**
   * Listen for Firebase auth state changes
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user: User | null) => {
        setState({
          user,
          loading: false,
          error: null
        });
      },
      (error) => {
        const appError = handleError(error);
        setState({
          user: null,
          loading: false,
          error: appError.message
        });
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return {
    ...state,
    clearError,
    signInWithGoogle,
    signOut,
    getUserProfile,
    isAuthenticated,
    isAdmin
  };
}; 