'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SpendingByCategory from '@/components/features/statistics/SpendingByCategory';
import MonthlySpendingTrend from '@/components/features/statistics/MonthlySpendingTrend';
import SubscriptionComparison from '@/components/features/statistics/SubscriptionComparison';
import YearlyProjection from '@/components/features/statistics/YearlyProjection';
import BudgetUtilization from '@/components/features/statistics/BudgetUtilization';
import { useSubscriptionViewModel } from '@/viewmodels/subscription/subscription.viewmodel';
import { useBudgetViewModel } from '@/viewmodels/budget/budget.viewmodel';
import Link from 'next/link';
import { Subscription } from '@/models/subscription/subscription.model';
import { Budget } from '@/models/budget/budget.model';

// Define the component props explicitly to help TypeScript
type SpendingByCategoryCompProps = {
  subscriptions: Subscription[];
  totalMonthlySpending: number;
};

type BudgetUtilizationCompProps = {
  subscriptions: Subscription[];
  budget: Budget | null;
  totalMonthlySpending: number;
};

// TypeScript type assertion functions
const asSpendingCategoryProps = (props: SpendingByCategoryCompProps): SpendingByCategoryCompProps => props;
const asBudgetUtilizationProps = (props: BudgetUtilizationCompProps): BudgetUtilizationCompProps => props;

export default function StatisticsPage() {
  const { user } = useAuth();
  
  // Use viewmodels instead of direct service calls
  const { 
    subscriptions,
    loading: subscriptionsLoading,
    calculateTotalMonthlyCost
  } = useSubscriptionViewModel(user?.uid || null);
  
  const {
    budget,
    loading: budgetLoading
  } = useBudgetViewModel(user?.uid || null);

  // Calculate the total monthly spending once when needed
  const totalMonthlySpending = subscriptions.length > 0 ? calculateTotalMonthlyCost() : 0;

  // Loading state - when either subscriptions or budget is loading
  if (subscriptionsLoading || budgetLoading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="flex-1 pl-[300px] p-10">
            <div className="flex min-h-screen items-center justify-center">
              <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 pl-[300px] p-10">
          <div className="max-w-7xl mx-auto">
            <Header />
            
            <div className="mb-10">
              <h1 className="text-3xl font-bold">Subscription Statistics</h1>
              <p className="text-gray-600 mt-2">Analyze your subscription spending patterns and trends.</p>
            </div>
            
            {subscriptions.length === 0 ? (
              <div className="bg-white rounded-xl p-10 shadow-sm text-center">
                <p className="text-lg text-gray-600 mb-6">You don't have any subscriptions yet to generate statistics.</p>
                <Link href="/subscriptions" className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors">
                  Add Subscriptions
                </Link>
              </div>
            ) : (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-8">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="category">By Category</TabsTrigger>
                  <TabsTrigger value="trends">Spending Trends</TabsTrigger>
                  <TabsTrigger value="budget">Budget Analysis</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SpendingByCategory 
                      {...asSpendingCategoryProps({
                        subscriptions,
                        totalMonthlySpending
                      })}
                    />
                    <BudgetUtilization 
                      {...asBudgetUtilizationProps({
                        subscriptions,
                        budget,
                        totalMonthlySpending
                      })}
                    />
                  </div>
                  <YearlyProjection subscriptions={subscriptions} />
                </TabsContent>
                
                <TabsContent value="category" className="space-y-8">
                  <SpendingByCategory 
                    {...asSpendingCategoryProps({
                      subscriptions,
                      totalMonthlySpending
                    })}
                  />
                  <SubscriptionComparison subscriptions={subscriptions} />
                </TabsContent>
                
                <TabsContent value="trends" className="space-y-8">
                  <MonthlySpendingTrend subscriptions={subscriptions} />
                </TabsContent>
                
                <TabsContent value="budget" className="space-y-8">
                  <BudgetUtilization 
                    {...asBudgetUtilizationProps({
                      subscriptions,
                      budget,
                      totalMonthlySpending
                    })}
                  />
                  <YearlyProjection subscriptions={subscriptions} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 