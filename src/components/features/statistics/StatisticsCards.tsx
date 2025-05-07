'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarClock, Wallet, Clock } from 'lucide-react';
import { useSubscriptionViewModel } from '@/viewmodels/subscription/subscription.viewmodel';
import { useBudgetViewModel } from '@/viewmodels/budget/budget.viewmodel';
import DualCurrencyDisplay from '@/components/ui/DualCurrencyDisplay';

interface StatCardProps {
  title: string;
  amount: string | JSX.Element;
  subtitle: string | JSX.Element;
  icon: React.ReactNode;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, amount, subtitle, icon, isLoading = false }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <span className="p-2 bg-gray-50 rounded-full">{icon}</span>
          </div>
          <div className="text-2xl font-bold mb-1">{amount}</div>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </>
      )}
    </div>
  );
};

const StatisticsCards = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Use the viewmodels instead of direct service calls
  const { 
    subscriptions,
    loading: subscriptionsLoading,
    calculateTotalMonthlyCost
  } = useSubscriptionViewModel(user?.uid || null);
  
  const {
    budget,
    loading: budgetLoading
  } = useBudgetViewModel(user?.uid || null);
  
  const [stats, setStats] = useState<StatCardProps[]>([
    {
      title: 'Monthly Subscriptions',
      amount: '€0.00',
      subtitle: '0 active subscriptions',
      icon: <CalendarClock size={20} />,
    },
    {
      title: 'Monthly Budget',
      amount: '€1,000.00',
      subtitle: '€1,000.00 remaining',
      icon: <Wallet size={20} />,
    },
    {
      title: 'Next Payment',
      amount: 'None',
      subtitle: 'No upcoming payments',
      icon: <Clock size={20} />,
    },
  ]);

  useEffect(() => {
    // Update loading state based on viewmodel loading states
    setLoading(subscriptionsLoading || budgetLoading);
    
    // Only update stats when we have the data and user is authenticated
    if (!user || subscriptionsLoading || budgetLoading) return;
    
    // Calculate monthly cost using the viewmodel method
    const monthlyCost = calculateTotalMonthlyCost();
    
    // Get budget information from the budget viewmodel
    const budgetAmount = budget?.monthlyBudget || 1000.00;
    const currency = budget?.currency || '€';
    
    // Only include active subscriptions
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    
    // Find the next subscription payment
    const today = new Date();
    const upcomingSubscriptions = [...activeSubscriptions]
      .filter(sub => new Date(sub.nextBilling) > today)
      .sort((a, b) => new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime());
    
    let nextPaymentSub = upcomingSubscriptions.length > 0 ? upcomingSubscriptions[0] : null;
    let nextPaymentInfo: {
      name: string;
      subtitle: string | JSX.Element;
    } = {
      name: 'None',
      subtitle: 'No upcoming payments'
    };
    
    if (nextPaymentSub) {
      const daysUntilPayment = Math.ceil((new Date(nextPaymentSub.nextBilling).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      nextPaymentInfo = {
        name: nextPaymentSub.name,
        subtitle: (
          <>
            In {daysUntilPayment} day{daysUntilPayment === 1 ? '' : 's'} - <DualCurrencyDisplay amount={nextPaymentSub.price} currency={nextPaymentSub.currency} size="sm" />
          </>
        )
      };
    }
    
    // Update stats
    const updatedStats = [
      {
        title: 'Monthly Subscriptions',
        amount: (
          <DualCurrencyDisplay amount={monthlyCost} currency={currency} />
        ),
        subtitle: `${activeSubscriptions.length} active subscription${activeSubscriptions.length === 1 ? '' : 's'}`,
        icon: <CalendarClock size={20} />,
      },
      {
        title: 'Monthly Budget',
        amount: (
          <DualCurrencyDisplay amount={budgetAmount} currency={currency} />
        ),
        subtitle: (
          <>
            <DualCurrencyDisplay amount={budgetAmount - monthlyCost} currency={currency} size="sm" /> remaining
          </>
        ),
        icon: <Wallet size={20} />,
      },
      {
        title: 'Next Payment',
        amount: nextPaymentInfo.name,
        subtitle: nextPaymentInfo.subtitle,
        icon: <Clock size={20} />,
      },
    ];
    
    setStats(updatedStats);
  }, [user, subscriptions, budget, subscriptionsLoading, budgetLoading, calculateTotalMonthlyCost]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} isLoading={loading} />
      ))}
    </div>
  );
};

export default StatisticsCards; 