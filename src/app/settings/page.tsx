'use client';

import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import BudgetSettings from '@/components/features/settings/BudgetSettings';
import NotificationSettings from '@/components/features/settings/NotificationSettings';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 pl-[300px] p-10">
          <div className="max-w-7xl mx-auto">
            <Header />
            
            <div className="mb-10">
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-gray-600 mt-2">Manage your account settings and preferences.</p>
            </div>
            
            <div className="grid gap-6">
              {/* Budget Settings Card */}
              <BudgetSettings />
              
              {/* Notification Settings Card */}
              <NotificationSettings />
              
              {/* More settings cards can be added here */}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 