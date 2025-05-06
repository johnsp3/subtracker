'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tv, Music, ShoppingBag, Lightbulb, Car, Home, Gamepad2, MoreHorizontal } from 'lucide-react';
import { getUserSubscriptions, getUserBudget, calculateMonthlySubscriptionCost } from '@/utils/firestore';
import { Subscription, SubscriptionCategory } from '@/utils/types';

type CategoryWithIcon = {
  name: SubscriptionCategory;
  icon: React.ReactNode;
  amount: string;
  count: number;
  color: string;
};

const SubscriptionCategories = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryWithIcon[]>([]);
  const [totals, setTotals] = useState({
    budget: 1000.00, // Default budget
    subscriptions: 0
  });

  // Category icons and colors mapping - wrapped in useMemo to prevent recreation on each render
  const categoryMappings = useMemo(() => ({
    'Streaming': { icon: <Tv size={18} />, color: 'bg-blue-500' },
    'Music': { icon: <Music size={18} />, color: 'bg-green-500' },
    'Shopping': { icon: <ShoppingBag size={18} />, color: 'bg-amber-500' },
    'Utilities': { icon: <Lightbulb size={18} />, color: 'bg-purple-500' },
    'Car': { icon: <Car size={18} />, color: 'bg-red-500' },
    'Home': { icon: <Home size={18} />, color: 'bg-indigo-500' },
    'Entertainment': { icon: <Gamepad2 size={18} />, color: 'bg-pink-500' },
    'Other': { icon: <MoreHorizontal size={18} />, color: 'bg-gray-500' }
  }), []);

  const processSubscriptions = useCallback((subscriptions: Subscription[], budgetAmount: number) => {
    // Group subscriptions by category
    const categoryGroups: Record<SubscriptionCategory, Subscription[]> = {} as Record<SubscriptionCategory, Subscription[]>;
    
    // Initialize all categories
    Object.keys(categoryMappings).forEach(cat => {
      categoryGroups[cat as SubscriptionCategory] = [];
    });
    
    // Group subscriptions
    subscriptions.forEach(sub => {
      if (categoryGroups[sub.category]) {
        categoryGroups[sub.category].push(sub);
      } else {
        categoryGroups['Other'].push(sub);
      }
    });
    
    // Calculate amount per category
    const categoriesWithAmount: CategoryWithIcon[] = Object.entries(categoryGroups).map(([catName, subs]) => {
      const category = catName as SubscriptionCategory;
      const activeSubscriptions = subs.filter(sub => sub.status === 'active');
      
      // Calculate monthly total for this category
      const monthlyTotal = activeSubscriptions.reduce((total, sub) => {
        let monthlyCost = sub.price;
        if (sub.billingCycle === 'Yearly') {
          monthlyCost = sub.price / 12;
        } else if (sub.billingCycle === 'Quarterly') {
          monthlyCost = sub.price / 3;
        }
        return total + monthlyCost;
      }, 0);
      
      // Currency from first subscription or default to €
      const currency = activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€';
      
      return {
        name: category,
        icon: categoryMappings[category].icon,
        amount: `${currency}${monthlyTotal.toFixed(2)}`,
        count: activeSubscriptions.length,
        color: categoryMappings[category].color
      };
    });
    
    // Sort categories by amount (descending)
    categoriesWithAmount.sort((a, b) => {
      const amountA = parseFloat(a.amount.replace(/[^0-9.]/g, ''));
      const amountB = parseFloat(b.amount.replace(/[^0-9.]/g, ''));
      return amountB - amountA;
    });
    
    // Calculate total monthly subscription cost
    const totalSubscriptionCost = calculateMonthlySubscriptionCost(subscriptions);
    
    // Update state
    setCategories(categoriesWithAmount);
    setTotals({
      budget: budgetAmount,
      subscriptions: totalSubscriptionCost
    });
  }, [categoryMappings]);

  useEffect(() => {
    // If auth is loading (including during logout), reset component state
    if (authLoading) {
      setCategories([]);
      setTotals({
        budget: 1000.00,
        subscriptions: 0
      });
      return;
    }

    const fetchUserData = async () => {
      // If user is null (logged out), reset state and stop loading
      if (!user) {
        setLoading(false);
        setCategories([]);
        setTotals({
          budget: 1000.00,
          subscriptions: 0
        });
        return;
      }

      try {
        setLoading(true);

        // Get user's subscriptions
        const subscriptions = await getUserSubscriptions(user.uid);
        
        // Get user's budget
        const budget = await getUserBudget(user.uid);

        // Process categories based on actual subscriptions
        processSubscriptions(subscriptions, budget?.monthlyBudget || 1000.00);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Reset to default values on error
        setCategories([]);
        setTotals({
          budget: 1000.00,
          subscriptions: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, processSubscriptions, authLoading]);

  const getBudgetPercentage = () => {
    return ((totals.subscriptions / totals.budget) * 100).toFixed(1);
  };
  
  if (authLoading || loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Categories</h2>
        <button className="text-primary text-sm font-medium hover:text-opacity-80 transition-colors">Edit</button>
      </div>
      
      {categories.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No subscriptions added yet
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.name} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center text-white`}>
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.count} subscriptions</p>
                </div>
              </div>
              <div className="font-medium">
                {category.amount}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Monthly Budget</p>
            <p className="text-xl font-bold mt-1">€{totals.budget.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Subscriptions</p>
            <p className="text-xl font-bold mt-1">€{totals.subscriptions.toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-4 bg-gray-100 h-2 rounded-full overflow-hidden">
          <div className="bg-primary h-full" style={{ width: `${getBudgetPercentage()}%` }}></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">You're spending {getBudgetPercentage()}% of your monthly budget on subscriptions</p>
      </div>
    </div>
  );
};

export default SubscriptionCategories; 