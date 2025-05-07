'use client';

import React, { useMemo } from 'react';
import { Subscription } from '@/models/subscription/subscription.model';
import { Budget } from '@/models/budget/budget.model';
import { AlertTriangle } from 'lucide-react';

interface BudgetUtilizationProps {
  subscriptions: Subscription[];
  budget: Budget | null;
  totalMonthlySpending: number;
}

const BudgetUtilization: React.FC<BudgetUtilizationProps> = ({ 
  subscriptions, 
  budget,
  totalMonthlySpending 
}) => {
  // Only include active subscriptions
  const activeSubscriptions = useMemo(() => 
    subscriptions.filter(sub => sub.status === 'active'),
    [subscriptions]
  );
  
  // Get budget amount or use default
  const budgetAmount = budget?.monthlyBudget || 1000.00;
  const currency = budget?.currency || '€';
  
  // Calculate utilization percentage
  const utilizationPercentage = useMemo(() => {
    const percentage = (totalMonthlySpending / budgetAmount) * 100;
    return Math.min(percentage, 100); // Cap at 100% for the visual
  }, [totalMonthlySpending, budgetAmount]);
  
  // Determine status based on percentage
  const getBudgetStatus = () => {
    if (utilizationPercentage >= 90) {
      return {
        status: 'danger',
        color: '#ef4444',
        message: 'You are over or close to exceeding your budget!'
      };
    } else if (utilizationPercentage >= 75) {
      return {
        status: 'warning',
        color: '#f59e0b',
        message: 'You are approaching your budget limit.'
      };
    } else {
      return {
        status: 'good',
        color: '#10b981',
        message: 'Your spending is within budget.'
      };
    }
  };
  
  const budgetStatus = getBudgetStatus();
  
  // Calculate the gauge stroke properties
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (utilizationPercentage / 100) * circumference;
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-xl font-bold mb-4">Budget Utilization</h2>
      
      {activeSubscriptions.length === 0 ? (
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">No subscription data available.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-64">
            {/* Background circle */}
            <svg className="w-full h-full" viewBox="0 0 200 200">
              <circle 
                cx="100" 
                cy="100" 
                r={radius} 
                fill="none" 
                stroke="#f1f5f9" 
                strokeWidth="12"
              />
              
              {/* Progress circle */}
              <circle 
                cx="100" 
                cy="100" 
                r={radius} 
                fill="none" 
                stroke={budgetStatus.color} 
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90, 100, 100)"
              />
              
              {/* Center text */}
              <text x="100" y="90" textAnchor="middle" className="text-3xl font-bold fill-gray-800">
                {utilizationPercentage.toFixed(0)}%
              </text>
              <text x="100" y="115" textAnchor="middle" className="text-sm fill-gray-500">
                of budget used
              </text>
            </svg>
          </div>
          
          <div className="mt-4 text-center w-full max-w-xs">
            {utilizationPercentage >= 90 && (
              <div className="flex items-center justify-center gap-2 bg-red-100 p-2 rounded-lg mb-4">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-sm text-red-700">{budgetStatus.message}</span>
              </div>
            )}
            
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Monthly Spending</span>
              <span className="font-semibold">
                {currency}{totalMonthlySpending.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between mb-6">
              <span className="text-sm text-gray-500">Monthly Budget</span>
              <span className="font-semibold">
                {currency}{budgetAmount.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between border-t border-gray-100 pt-4">
              <span className="text-sm text-gray-500">Remaining</span>
              <span 
                className={`font-semibold ${
                  (budgetAmount - totalMonthlySpending) < 0 ? 'text-red-500' : ''
                }`}
              >
                {currency}{Math.max(0, budgetAmount - totalMonthlySpending).toFixed(2)}
              </span>
            </div>
            
            {totalMonthlySpending > budgetAmount && (
              <div className="flex justify-between text-red-500 mt-1">
                <span className="text-sm">Overspent</span>
                <span className="font-semibold">
                  {currency}{(totalMonthlySpending - budgetAmount).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetUtilization; 