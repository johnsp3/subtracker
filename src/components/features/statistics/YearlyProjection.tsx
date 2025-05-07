'use client';

import React, { useMemo, useState } from 'react';
import { Subscription } from '@/utils/types';
import MonogramAvatar from '@/components/features/subscriptions/MonogramAvatar';
import DualCurrencyDisplay from '@/components/ui/DualCurrencyDisplay';

interface YearlyProjectionProps {
  subscriptions: Subscription[];
}

const YearlyProjection: React.FC<YearlyProjectionProps> = ({ subscriptions }) => {
  // Track which month is being hovered
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Only include active subscriptions
  const activeSubscriptions = useMemo(() => 
    subscriptions.filter(sub => sub.status === 'active'),
    [subscriptions]
  );

  // Generate monthly and yearly totals based on subscription billing cycles
  const projectionData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    // Initialize monthly spending data
    const monthlySpending = monthNames.map((name, index) => ({
      name,
      spending: 0,
      isPast: index < currentMonth,
      isCurrent: index === currentMonth
    }));
    
    // For projection - only show the current month with spending
    // All other months are zeroed out for display purposes
    if (activeSubscriptions.length > 0) {
      // Calculate current month spending
      const currentMonthSpending = activeSubscriptions.reduce((total, sub) => {
        if (sub.status === 'active') {
          return total + sub.price;
        }
        return total;
      }, 0);
      
      // Only set spending for the current month
      monthlySpending[currentMonth].spending = currentMonthSpending;
    }
    
    // Calculate yearly total based on monthly spending * 12 (simplified projection)
    // For demo/display purposes - in a real app we'd use more detailed calculations
    const yearlyTotal = activeSubscriptions.reduce((total, sub) => {
      if (sub.status === 'active') {
        if (sub.billingCycle === 'Monthly') {
          return total + (sub.price * 12);
        } else if (sub.billingCycle === 'Quarterly') {
          return total + (sub.price * 4);
        } else if (sub.billingCycle === 'Yearly') {
          return total + sub.price;
        }
      }
      return total;
    }, 0);
    
    return {
      monthly: monthlySpending,
      yearly: yearlyTotal
    };
  }, [activeSubscriptions]);
  
  // Find max spending to determine bar height
  const maxMonthlySpending = useMemo(() => {
    return Math.max(...projectionData.monthly.map(month => month.spending), 10);
  }, [projectionData.monthly]);
  
  // Calculate bar height percentage for each month
  const getBarHeight = (spending: number) => {
    return (spending / maxMonthlySpending) * 100;
  };
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-bold">Yearly Spending Projection</h2>
        
        <div className="text-right">
          <span className="text-sm text-gray-500">Total for {new Date().getFullYear()}</span>
          <p className="text-2xl font-bold text-primary">
            <DualCurrencyDisplay 
              amount={projectionData.yearly} 
              currency={activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'} 
              size="lg"
            />
          </p>
        </div>
      </div>
      
      {activeSubscriptions.length === 0 ? (
        <div className="flex items-center justify-center h-52">
          <p className="text-gray-500">No subscription data available.</p>
        </div>
      ) : (
        <div className="h-64 relative">
          <div className="grid grid-cols-12 gap-3 h-52">
            {projectionData.monthly.map((month, index) => (
              <div 
                key={month.name} 
                className="flex flex-col items-center relative"
                onMouseEnter={() => setHoveredMonth(index)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                <div className="h-full w-full flex items-end">
                  <div 
                    className={`w-full rounded-t-sm ${
                      month.isCurrent 
                        ? 'bg-primary' 
                        : 'bg-gray-200'
                    }`}
                    style={{ height: month.isCurrent ? `${getBarHeight(month.spending)}%` : '10%' }}
                  />
                </div>
                <div className={`text-xs mt-1 ${month.isCurrent ? 'font-bold text-primary' : 'text-gray-500'}`}>
                  {month.name}
                </div>
                <div className="text-[9px] text-gray-400 truncate w-full text-center">
                  {month.isCurrent ? (
                    <DualCurrencyDisplay 
                      amount={month.spending} 
                      currency={activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'} 
                      size="sm" 
                      showSecondary={false}
                    />
                  ) : (
                    <span>—</span>
                  )}
                </div>
                
                {/* Tooltip */}
                {hoveredMonth === index && (
                  <div className="absolute bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                    {month.isCurrent ? (
                      <DualCurrencyDisplay 
                        amount={month.spending} 
                        currency={activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'} 
                        size="sm" 
                        showSecondary={true}
                      />
                    ) : (
                      <span>No data for this month</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Horizontal guideline - only keep the max value */}
          <div className="absolute left-0 right-0 top-0 bottom-12 flex flex-col justify-between pointer-events-none">
            <div className="w-full border-t border-gray-100 relative">
              <span className="absolute -top-2 right-0 text-[9px] text-gray-400 bg-white px-1">
                <DualCurrencyDisplay 
                  amount={maxMonthlySpending} 
                  currency={activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'} 
                  size="sm" 
                  showSecondary={false}
                />
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <span className="text-sm text-gray-500 block">Average / Month</span>
          <span className="text-lg font-semibold">
            <DualCurrencyDisplay 
              amount={projectionData.yearly / 12} 
              currency={activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'} 
              showSecondary={false}
            />
          </span>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <span className="text-sm text-gray-500 block">Current Month</span>
          <span className="text-lg font-semibold">
            <DualCurrencyDisplay 
              amount={projectionData.monthly[new Date().getMonth()].spending} 
              currency={activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'} 
              showSecondary={false}
            />
          </span>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <span className="text-sm text-gray-500 block">Projected Year</span>
          <span className="text-lg font-semibold">
            <DualCurrencyDisplay 
              amount={projectionData.yearly} 
              currency={activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'} 
              showSecondary={false}
            />
          </span>
        </div>
      </div>
    </div>
  );
};

export default YearlyProjection; 