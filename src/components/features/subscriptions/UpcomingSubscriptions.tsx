'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import MonogramAvatar from './MonogramAvatar';
import { useSubscriptionViewModel } from '@/viewmodels/subscription/subscription.viewmodel';

/**
 * UpcomingSubscriptions Component
 * 
 * Displays a list of upcoming subscription payments organized by timeframe.
 * Following the MVVM pattern, this component only handles UI rendering and user interaction,
 * while business logic is delegated to the subscription view model.
 */
const UpcomingSubscriptions = () => {
  const { user, loading: authLoading } = useAuth();
  const [expandedDay, setExpandedDay] = useState<string | null>('Coming up');
  const toast = useToastContext();
  
  // Use the subscription view model
  const {
    loading,
    error,
    clearError,
    toggleNotification,
    getSubscriptionsByTimeframe
  } = useSubscriptionViewModel(user?.uid || null);

  // Get subscriptions grouped by timeframe
  const subscriptions = getSubscriptionsByTimeframe();
  
  // Show errors as toast notifications
  useEffect(() => {
    if (error) {
      toast.showError(error);
      clearError();
    }
  }, [error, toast, clearError]);

  /**
   * Toggle expansion of a timeframe section
   * 
   * @param day - The timeframe to toggle
   */
  const toggleDay = (day: string) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  /**
   * Handle notification toggle for a subscription
   * 
   * @param id - The subscription ID
   * @param event - The click event
   */
  const handleToggleNotification = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const success = await toggleNotification(id);
    
    if (success) {
      toast.showSuccess('Notification settings updated');
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
                          onClick={(e) => handleToggleNotification(subscription.id, e)}
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