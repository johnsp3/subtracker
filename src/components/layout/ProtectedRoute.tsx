'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if auth has completed loading and there's no user
    if (!loading && !user) {
      console.log("No authenticated user, redirecting to login");
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading during initial auth check
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Only render children if user is authenticated
  return user ? <>{children}</> : null;
} 