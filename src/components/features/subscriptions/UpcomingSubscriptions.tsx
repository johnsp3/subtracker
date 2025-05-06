'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MonogramAvatar from './MonogramAvatar';
import { getUserSubscriptions, updateSubscription } from '@/utils/firestore';
import { Subscription as FirestoreSubscription } from '@/utils/types';

type TimeframeSubscription = {
  id: string;
  name: string;
  logo: string;
  amount: string;
  nextPayment: string;
  daysLeft: number;
  category: string;
  notificationsEnabled: boolean;
};

type SubscriptionsByTimeframe = Record<string, TimeframeSubscription[]>;

const UpcomingSubscriptions = () => {
  const { user, loading: authLoading } = useAuth();
  const [expandedDay, setExpandedDay] = useState<string | null>('Coming up');
  const [subscriptions, setSubscriptions] = useState<SubscriptionsByTimeframe>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset state when user changes (including during logout)
    if (authLoading) {
      setSubscriptions({});
      return;
    }

    const fetchSubscriptions = async () => {
      if (!user) {
        setLoading(false);
        setSubscriptions({});
        return;
      }

      try {
        setLoading(true);
        const userSubscriptions = await getUserSubscriptions(user.uid);
        
        // Process subscriptions into timeframes
        const subscriptionsByTimeframe: SubscriptionsByTimeframe = {
          'Coming up': [],
          'Last week': []
        };

        userSubscriptions.forEach(sub => {
          const nextBillingDate = new Date(sub.nextBilling);
          const today = new Date();
          const daysUntilBilling = Math.ceil((nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          const mappedSubscription: TimeframeSubscription = {
            id: sub.id,
            name: sub.name,
            logo: sub.logo || sub.name,
            amount: `${sub.currency}${sub.price.toFixed(2)}`,
            nextPayment: daysUntilBilling <= 7 ? `In ${daysUntilBilling} days` : 'Next month',
            daysLeft: daysUntilBilling,
            category: sub.category,
            notificationsEnabled: sub.notificationsEnabled
          };

          // Sort subscriptions into timeframes
          if (daysUntilBilling <= 7) {
            subscriptionsByTimeframe['Coming up'].push(mappedSubscription);
          } else {
            subscriptionsByTimeframe['Last week'].push(mappedSubscription);
          }
        });

        // Sort within each timeframe by days left
        Object.keys(subscriptionsByTimeframe).forEach(timeframe => {
          subscriptionsByTimeframe[timeframe].sort((a, b) => a.daysLeft - b.daysLeft);
        });

        setSubscriptions(subscriptionsByTimeframe);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        // Set empty subscriptions object on error
        setSubscriptions({});
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [user, authLoading]);

  const toggleDay = (day: string) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  const toggleNotification = async (id: string) => {
    if (!user) return;

    try {
      // Find the subscription in any timeframe
      let subscriptionToUpdate: TimeframeSubscription | null = null;
      let timeframeKey = '';

      for (const [key, subs] of Object.entries(subscriptions)) {
        const found = subs.find(sub => sub.id === id);
        if (found) {
          subscriptionToUpdate = found;
          timeframeKey = key;
          break;
        }
      }

      if (!subscriptionToUpdate) return;

      // Update in Firebase
      await updateSubscription(id, {
        notificationsEnabled: !subscriptionToUpdate.notificationsEnabled
      });

      // Update local state
      const updatedSubscriptions = { ...subscriptions };
      updatedSubscriptions[timeframeKey] = updatedSubscriptions[timeframeKey].map(sub => 
        sub.id === id 
          ? { ...sub, notificationsEnabled: !sub.notificationsEnabled } 
          : sub
      );
      
      setSubscriptions(updatedSubscriptions);
    } catch (error) {
      console.error('Error toggling notification:', error);
    }
  };

  // If still in authentication loading state or component loading state, show loading spinner
  if (authLoading || loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow mb-8">
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // If user is null (not logged in) or no subscriptions, show empty state
  if (!user || Object.values(subscriptions).every(subs => subs.length === 0)) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Upcoming Payments</h2>
          <button className="text-primary text-sm font-medium hover:text-opacity-80 transition-colors">View all</button>
        </div>
        <div className="text-center py-6 text-gray-500">
          No upcoming payments found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Upcoming Payments</h2>
        <button className="text-primary text-sm font-medium hover:text-opacity-80 transition-colors">View all</button>
      </div>

      <div className="space-y-6">
        {Object.entries(subscriptions).map(([timeframe, timeframeSubscriptions]) => (
          timeframeSubscriptions.length > 0 && (
            <div key={timeframe} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div 
                className="flex items-center justify-between cursor-pointer py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors"
                onClick={() => toggleDay(timeframe)}
              >
                <h3 className="font-medium">{timeframe}</h3>
                {expandedDay === timeframe ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </div>

              {expandedDay === timeframe && (
                <div className="space-y-4 mt-4">
                  {timeframeSubscriptions.map((subscription) => (
                    <div key={subscription.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden">
                          <MonogramAvatar name={subscription.logo || subscription.name} />
                        </div>
                        <div>
                          <h4 className="font-medium">{subscription.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm px-2 py-0.5 bg-gray-100 rounded-full">{subscription.category}</span>
                            <span className="text-sm text-gray-500">{subscription.nextPayment}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNotification(subscription.id);
                          }}
                          className="text-gray-400 hover:text-primary transition-colors"
                        >
                          {subscription.notificationsEnabled ? (
                            <Bell size={18} />
                          ) : (
                            <BellOff size={18} />
                          )}
                        </button>
                        <div className="font-medium text-right">
                          {subscription.amount}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default UpcomingSubscriptions; 