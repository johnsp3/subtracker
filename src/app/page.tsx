'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, Suspense } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import ErrorBoundary from '@/components/layout/ErrorBoundary';
import { useToastContext } from '@/contexts/ToastContext';
import RefreshButton from '@/components/ui/RefreshButton';

// Lazy load heavier components
const StatisticsCards = dynamic(() => import('@/components/features/statistics/StatisticsCards'));
const UpcomingSubscriptions = dynamic(() => import('@/components/features/subscriptions/UpcomingSubscriptions'));
const SubscriptionCategories = dynamic(() => import('@/components/features/subscriptions/SubscriptionCategories'));
const ServiceWorkerRegistration = dynamic(() => import('@/components/ServiceWorkerRegistration'));
const NotificationChecker = dynamic(() => import('@/components/NotificationChecker'));

// Import dynamic for lazy loading
import dynamic from 'next/dynamic';

// Fallback loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-40">
    <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
  </div>
);

// Simple fallback in case the auth context isn't ready
const LoginFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
    <h1 className="text-2xl font-bold mb-4">Welcome to SubTracker</h1>
    <p className="mb-8 text-center">Please wait while we load your dashboard...</p>
    <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-8"></div>
    <RefreshButton text="Reload App" />
  </div>
);

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const toast = useToastContext();
  const [mounted, setMounted] = useState(false);
  
  // Verify client-side rendering is complete
  useEffect(() => {
    setMounted(true);
    console.log('Home component mounted, user:', user?.email);
  }, [user]);
  
  // If not mounted yet, show simple UI
  if (!mounted) {
    return <LoginFallback />;
  }
  
  // Return the protected content
  return (
    <ErrorBoundary fallback={<LoginFallback />}>
      <ProtectedRoute fallback={<LoginFallback />}>
        <div className="flex min-h-screen bg-gray-50">
          <ErrorBoundary>
            <Sidebar />
          </ErrorBoundary>
          
          <main className="flex-1 pl-[300px] p-10">
            <div className="max-w-7xl mx-auto">
              <ErrorBoundary>
                <Header />
              </ErrorBoundary>
              
              <div className="mb-10">
                <h1 className="text-3xl font-bold">
                  Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
                </h1>
                <p className="text-gray-600 mt-2">
                  Here's an overview of your subscription services.
                </p>
              </div>
              
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <StatisticsCards />
                </Suspense>
              </ErrorBoundary>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <div className="col-span-1 lg:col-span-2">
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                      <UpcomingSubscriptions />
                    </Suspense>
                  </ErrorBoundary>
                </div>
                
                <div className="col-span-1">
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                      <SubscriptionCategories />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          </main>
        </div>
        
        {/* Load these components last and within error boundaries */}
        <ErrorBoundary>
          <Suspense fallback={null}>
            <ServiceWorkerRegistration />
          </Suspense>
        </ErrorBoundary>
        
        <ErrorBoundary>
          <Suspense fallback={null}>
            <NotificationChecker />
          </Suspense>
        </ErrorBoundary>
      </ProtectedRoute>
    </ErrorBoundary>
  );
} 