'use client';

import React, { useMemo } from 'react';
import { Subscription, SubscriptionCategory } from '@/utils/types';
import { calculateMonthlySubscriptionCost } from '@/utils/firestore';

interface SpendingByCategoryProps {
  subscriptions: Subscription[];
}

const SpendingByCategory: React.FC<SpendingByCategoryProps> = ({ subscriptions }) => {
  // Only include active subscriptions
  const activeSubscriptions = useMemo(() => 
    subscriptions.filter(sub => sub.status === 'active'),
    [subscriptions]
  );

  // Calculate spending by category
  const spendingByCategory = useMemo(() => {
    const categories: Record<SubscriptionCategory, number> = {
      'Streaming': 0,
      'Music': 0,
      'Shopping': 0,
      'Utilities': 0,
      'Car': 0,
      'Home': 0,
      'Entertainment': 0,
      'Other': 0
    };
    
    activeSubscriptions.forEach(sub => {
      // Convert to monthly cost
      let monthlyCost = sub.price;
      if (sub.billingCycle === 'Yearly') {
        monthlyCost = sub.price / 12;
      } else if (sub.billingCycle === 'Quarterly') {
        monthlyCost = sub.price / 3;
      }
      
      categories[sub.category] += monthlyCost;
    });
    
    // Filter out categories with zero spending
    return Object.entries(categories)
      .filter(([_, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]); // Sort by amount, descending
  }, [activeSubscriptions]);

  // Calculate total monthly spending
  const totalMonthlySpending = calculateMonthlySubscriptionCost(activeSubscriptions);
  
  // Generate colors for categories
  const categoryColors: Record<string, string> = {
    'Streaming': '#FF6384',
    'Music': '#36A2EB',
    'Shopping': '#FFCE56',
    'Utilities': '#4BC0C0',
    'Car': '#9966FF',
    'Home': '#FF9F40',
    'Entertainment': '#C9CBCF',
    'Other': '#7BC043'
  };

  // Calculate the total pie chart circumference (in SVG units)
  const circumference = 2 * Math.PI * 85; // radius = 85
  let currentOffset = 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-xl font-bold mb-4">Spending by Category</h2>
      
      {spendingByCategory.length === 0 ? (
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">No spending data available.</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="relative w-64 h-64 mb-6 md:mb-0">
            <svg width="100%" height="100%" viewBox="0 0 200 200">
              {/* Render pie chart slices */}
              {spendingByCategory.map(([category, amount], index) => {
                const percentage = totalMonthlySpending > 0 ? amount / totalMonthlySpending : 0;
                const sliceLength = circumference * percentage;
                const startOffset = currentOffset;
                currentOffset += sliceLength;
                
                return (
                  <circle
                    key={category}
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke={categoryColors[category] || '#CCC'}
                    strokeWidth="30"
                    strokeDasharray={`${sliceLength} ${circumference - sliceLength}`}
                    strokeDashoffset={-startOffset}
                    transform="rotate(-90, 100, 100)"
                  />
                );
              })}
              <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" className="text-xl font-bold fill-gray-800">
                {activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'}
                {totalMonthlySpending.toFixed(2)}
              </text>
              <text x="100" y="120" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-gray-500">
                monthly
              </text>
            </svg>
          </div>
          
          <div className="flex flex-col gap-3 flex-grow ml-0 md:ml-8">
            {spendingByCategory.map(([category, amount]) => {
              const percentage = totalMonthlySpending > 0 ? (amount / totalMonthlySpending) * 100 : 0;
              return (
                <div key={category} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: categoryColors[category] || '#CCC' }}
                  />
                  <div className="flex-grow">
                    <div className="flex justify-between">
                      <span className="font-medium">{category}</span>
                      <span>
                        {activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'}
                        {amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                      <div 
                        className="h-1.5 rounded-full" 
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: categoryColors[category] || '#CCC'
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingByCategory; 