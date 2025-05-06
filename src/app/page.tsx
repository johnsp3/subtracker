'use client';

import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import StatisticsCards from '@/components/features/statistics/StatisticsCards';
import UpcomingSubscriptions from '@/components/features/subscriptions/UpcomingSubscriptions';
import SubscriptionCategories from '@/components/features/subscriptions/SubscriptionCategories';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import NotificationChecker from '@/components/NotificationChecker';

export default function Home() {
  const { user } = useAuth();
  
  return (
    <ProtectedRoute>
      <ServiceWorkerRegistration />
      <NotificationChecker />
      
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 pl-[300px] p-10">
          <div className="max-w-7xl mx-auto">
            <Header />
            
            <div className="mb-10">
              <h1 className="text-3xl font-bold">Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!</h1>
              <p className="text-gray-600 mt-2">Here's an overview of your subscription services.</p>
            </div>
            
            <StatisticsCards />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              <div className="col-span-1 lg:col-span-2">
                <UpcomingSubscriptions />
              </div>
              
              <div className="col-span-1">
                <SubscriptionCategories />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 