'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '@/utils/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser ? "user authenticated" : "no user");
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error("Auth state error:", error);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      router.push('/');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Set loading to prevent components from making Firebase calls
      setLoading(true);
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Navigate to login page immediately
      router.push('/login');
      
      // Keep the loading state for a short time to prevent flickering
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error signing out:', error);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 