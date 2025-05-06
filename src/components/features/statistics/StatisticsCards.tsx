'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarClock, Wallet, Clock } from 'lucide-react';
import { 
  getUserSubscriptions, 
  getUserBudget, 
  calculateMonthlySubscriptionCost 
} from '@/utils/firestore';
import { Subscription } from '@/utils/types';

interface StatCardProps {
  title: string;
  amount: string;
  subtitle: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

const StatCard = ({ title, amount, subtitle, icon, isLoading = false }: StatCardProps) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      {isLoading ? (
        <div className="flex items-center justify-center h-20">
          <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">{title}</h3>
            <div className="w-12 h-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary">
              {icon}
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold">{amount}</h2>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </>
      )}
    </div>
  );
};

const StatisticsCards = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
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
    const fetchUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Get user's subscriptions
        const subscriptions = await getUserSubscriptions(user.uid);
        
        // Get user's budget
        const budget = await getUserBudget(user.uid);
        
        // Update stats with real data
        updateStatisticsCards(subscriptions, budget?.monthlyBudget || 1000.00, budget?.currency || '€');
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const updateStatisticsCards = (subscriptions: Subscription[], budget: number, currency: string) => {
    // Only include active subscriptions
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    
    // Calculate monthly total
    const monthlyCost = calculateMonthlySubscriptionCost(subscriptions);
    
    // Find the next subscription payment
    const today = new Date();
    const upcomingSubscriptions = [...activeSubscriptions]
      .filter(sub => new Date(sub.nextBilling) > today)
      .sort((a, b) => new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime());
    
    let nextPaymentSub = upcomingSubscriptions.length > 0 ? upcomingSubscriptions[0] : null;
    let nextPaymentInfo = {
      name: 'None',
      subtitle: 'No upcoming payments'
    };
    
    if (nextPaymentSub) {
      const daysUntilPayment = Math.ceil((new Date(nextPaymentSub.nextBilling).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      nextPaymentInfo = {
        name: nextPaymentSub.name,
        subtitle: `In ${daysUntilPayment} day${daysUntilPayment === 1 ? '' : 's'} - ${nextPaymentSub.currency}${nextPaymentSub.price.toFixed(2)}`
      };
    }
    
    // Update stats
    const updatedStats = [
      {
        title: 'Monthly Subscriptions',
        amount: `${currency}${monthlyCost.toFixed(2)}`,
        subtitle: `${activeSubscriptions.length} active subscription${activeSubscriptions.length === 1 ? '' : 's'}`,
        icon: <CalendarClock size={20} />,
      },
      {
        title: 'Monthly Budget',
        amount: `${currency}${budget.toFixed(2)}`,
        subtitle: `${currency}${(budget - monthlyCost).toFixed(2)} remaining`,
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
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} isLoading={loading} />
      ))}
    </div>
  );
};

export default StatisticsCards; 