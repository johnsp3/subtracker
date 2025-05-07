'use client';

/**
 * Auth Context
 * 
 * Provides global authentication functionality throughout the application.
 * Following the MVVM pattern, the context uses the auth view model instead of
 * directly interacting with Firebase.
 * Includes safeguards for server-side rendering.
 */
import { createContext, useContext, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useToastContext } from './ToastContext';
import { useRouter } from 'next/navigation';
import { useAuthViewModel } from '@/viewmodels/auth/auth.viewmodel';
import { AuthResult, UserProfile } from '@/models/auth/auth.model';

/**
 * Auth context type definition
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getUserProfile: () => UserProfile | null;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

// Empty handler functions for server-side rendering
const noopAsync = async () => {};
const noopReturn = () => null;
const noopBoolean = () => false;

// Default context values for server-side rendering
const defaultContextValue: AuthContextType = {
  user: null,
  loading: false,
  error: null,
  signInWithGoogle: noopAsync,
  signOut: noopAsync,
  getUserProfile: noopReturn,
  isAuthenticated: noopBoolean,
  isAdmin: noopBoolean
};

// Create the auth context with default values for SSR
const AuthContext = createContext<AuthContextType>(defaultContextValue);

/**
 * Auth provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider component
 * 
 * Wraps the application with authentication functionality
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Use the auth view model
  const { user, loading, error, signInWithGoogle: login, signOut: logout, getUserProfile, isAuthenticated, isAdmin, clearError } = useAuthViewModel();
  const router = useRouter();
  const toast = useToastContext();

  // Show error messages as toasts
  useEffect(() => {
    if (error) {
      toast.showError(error);
      clearError();
    }
  }, [error, toast, clearError]);

  /**
   * Sign in with Google and navigate to home page on success
   * Wrapped in useCallback to prevent recreation on every render
   */
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    const result: AuthResult = await login();
    
    if (result.success) {
      router.push('/');
      toast.showSuccess('Signed in successfully');
    }
  }, [login, router, toast]);

  /**
   * Sign out and navigate to login page
   * Wrapped in useCallback to prevent recreation on every render
   */
  const signOut = useCallback(async (): Promise<void> => {
    const result: AuthResult = await logout();
    
    if (result.success) {
      router.push('/login');
      toast.showSuccess('Signed out successfully');
    }
  }, [logout, router, toast]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    getUserProfile,
    isAuthenticated,
    isAdmin
  }), [user, loading, error, signInWithGoogle, signOut, getUserProfile, isAuthenticated, isAdmin]);

  // Provide the auth context
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use the auth context
 * 
 * @returns The auth context
 */
export function useAuth() {
  return useContext(AuthContext);
} 