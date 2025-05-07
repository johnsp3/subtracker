'use client';

import React, { useMemo } from 'react';
import { Subscription } from '@/utils/types';
import MonogramAvatar from '@/components/features/subscriptions/MonogramAvatar';
import DualCurrencyDisplay from '@/components/ui/DualCurrencyDisplay';

interface YearlyProjectionProps {
  subscriptions: Subscription[];
}

const YearlyProjection: React.FC<YearlyProjectionProps> = ({ subscriptions }) => {
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
    
    // Calculate spending per month including one-time payments
    activeSubscriptions.forEach(subscription => {
      // Base monthly cost
      let monthlyCost = subscription.price;
      if (subscription.billingCycle === 'Yearly') {
        monthlyCost = subscription.price / 12;
        
        // Get next billing month for yearly subscriptions
        const nextBillingDate = new Date(subscription.nextBilling);
        if (nextBillingDate.getFullYear() === currentYear) {
          const billingMonth = nextBillingDate.getMonth();
          monthlySpending[billingMonth].spending += subscription.price;
          
          // Subtract the average monthly cost from this month since we already added the full amount
          for (let i = 0; i < 12; i++) {
            monthlySpending[i].spending -= subscription.price / 12;
          }
        }
      } else if (subscription.billingCycle === 'Quarterly') {
        monthlyCost = subscription.price / 3;
        
        // Get next billing month for quarterly subscriptions
        const nextBillingDate = new Date(subscription.nextBilling);
        if (nextBillingDate.getFullYear() === currentYear) {
          const billingMonth = nextBillingDate.getMonth();
          
          // Add quarterly payments
          for (let i = 0; i < 4; i++) {
            const paymentMonth = (billingMonth + i * 3) % 12;
            if (paymentMonth >= 0 && paymentMonth < 12) {
              monthlySpending[paymentMonth].spending += subscription.price;
            }
          }
          
          // Subtract the average monthly cost since we already added the full amounts
          for (let i = 0; i < 12; i++) {
            monthlySpending[i].spending -= subscription.price / 3;
          }
        }
      }
      
      // Add the base monthly cost to each month
      for (let i = 0; i < 12; i++) {
        monthlySpending[i].spending += monthlyCost;
      }
    });
    
    // Calculate yearly total
    const yearlyTotal = monthlySpending.reduce((total, month) => total + month.spending, 0);
    
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
              <div key={month.name} className="flex flex-col items-center">
                <div className="h-full w-full flex items-end">
                  <div 
                    className={`w-full rounded-t-sm ${
                      month.isCurrent 
                        ? 'bg-primary' 
                        : month.isPast 
                          ? 'bg-gray-300' 
                          : 'bg-primary bg-opacity-60'
                    }`}
                    style={{ height: `${getBarHeight(month.spending)}%` }}
                  />
                </div>
                <div className={`text-xs mt-1 ${month.isCurrent ? 'font-bold text-primary' : 'text-gray-500'}`}>
                  {month.name}
                </div>
                <div className="text-[10px] text-gray-400 hidden sm:block">
                  <DualCurrencyDisplay 
                    amount={month.spending} 
                    currency={activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'} 
                    size="sm" 
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Horizontal guidelines */}
          <div className="absolute left-0 right-0 top-0 bottom-12 flex flex-col justify-between pointer-events-none">
            <div className="w-full border-t border-gray-100 relative">
              <span className="absolute -top-2 right-0 text-[10px] text-gray-400">
                <DualCurrencyDisplay 
                  amount={maxMonthlySpending} 
                  currency={activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'} 
                  size="sm" 
                  showSecondary={false}
                />
              </span>
            </div>
            <div className="w-full border-t border-gray-100 relative">
              <span className="absolute -top-2 right-0 text-[10px] text-gray-400">
                <DualCurrencyDisplay 
                  amount={maxMonthlySpending / 2} 
                  currency={activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'} 
                  size="sm" 
                  showSecondary={false}
                />
              </span>
            </div>
            <div className="w-full border-t border-gray-100 relative">
              <span className="absolute -top-2 right-0 text-[10px] text-gray-400">
                <DualCurrencyDisplay 
                  amount={0} 
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
            />
          </span>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <span className="text-sm text-gray-500 block">Highest Month</span>
          <span className="text-lg font-semibold">
            <DualCurrencyDisplay 
              amount={Math.max(...projectionData.monthly.map(m => m.spending))} 
              currency={activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'} 
            />
          </span>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <span className="text-sm text-gray-500 block">Lowest Month</span>
          <span className="text-lg font-semibold">
            <DualCurrencyDisplay 
              amount={Math.min(...projectionData.monthly.map(m => m.spending))} 
              currency={activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'} 
            />
          </span>
        </div>
      </div>
    </div>
  );
};

export default YearlyProjection; 