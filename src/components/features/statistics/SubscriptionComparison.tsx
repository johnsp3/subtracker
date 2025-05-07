'use client';

import React, { useMemo } from 'react';
import { Subscription } from '@/utils/types';
import MonogramAvatar from '@/components/features/subscriptions/MonogramAvatar';
import DualCurrencyDisplay from '@/components/ui/DualCurrencyDisplay';

interface SubscriptionComparisonProps {
  subscriptions: Subscription[];
}

const SubscriptionComparison: React.FC<SubscriptionComparisonProps> = ({ subscriptions }) => {
  // Only include active subscriptions
  const activeSubscriptions = useMemo(() => 
    subscriptions.filter(sub => sub.status === 'active'),
    [subscriptions]
  );

  // Calculate monthly cost for each subscription and sort by cost (descending)
  const subscriptionCosts = useMemo(() => {
    return activeSubscriptions.map(sub => {
      // Convert to monthly cost
      let monthlyCost = sub.price;
      if (sub.billingCycle === 'Yearly') {
        monthlyCost = sub.price / 12;
      } else if (sub.billingCycle === 'Quarterly') {
        monthlyCost = sub.price / 3;
      }
      
      return {
        ...sub,
        monthlyCost
      };
    }).sort((a, b) => b.monthlyCost - a.monthlyCost);
  }, [activeSubscriptions]);
  
  // Find max cost for bar width calculation
  const maxCost = useMemo(() => {
    return Math.max(...subscriptionCosts.map(sub => sub.monthlyCost), 1);
  }, [subscriptionCosts]);
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-xl font-bold mb-6">Subscription Cost Comparison</h2>
      
      {subscriptionCosts.length === 0 ? (
        <div className="flex items-center justify-center h-52">
          <p className="text-gray-500">No subscription data available.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptionCosts.map(subscription => {
            const percentage = (subscription.monthlyCost / maxCost) * 100;
            
            return (
              <div key={subscription.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  <MonogramAvatar name={subscription.logo || subscription.name} />
                </div>
                
                <div className="flex-grow">
                  <div className="flex justify-between mb-1">
                    <div>
                      <span className="font-medium">{subscription.name}</span>
                      <span className="text-xs ml-2 text-gray-500">{subscription.billingCycle}</span>
                    </div>
                    <span className="font-semibold">
                      <DualCurrencyDisplay 
                        amount={subscription.monthlyCost} 
                        currency={subscription.currency}
                        size="sm"
                      />
                      <span className="text-xs text-gray-500 ml-1">/mo</span>
                    </span>
                  </div>
                  
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-primary" 
                      style={{ width: `${percentage}%` }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}
          
          {subscriptionCosts.length > 0 && (
            <div className="pt-6 mt-6 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500">Most expensive</span>
                  <p className="font-medium">{subscriptionCosts[0].name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Least expensive</span>
                  <p className="font-medium">{subscriptionCosts[subscriptionCosts.length - 1].name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Average cost per subscription</span>
                  <p className="font-medium">
                    <DualCurrencyDisplay 
                      amount={subscriptionCosts.reduce((sum, sub) => sum + sub.monthlyCost, 0) / subscriptionCosts.length} 
                      currency={subscriptionCosts[0].currency} 
                    />
                    <span className="text-xs text-gray-500 ml-1">/mo</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionComparison; 