'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tv, Music, ShoppingBag, Lightbulb, Car, Home, Gamepad2, MoreHorizontal } from 'lucide-react';
import { Subscription, SubscriptionCategory } from '@/models/subscription/subscription.model';
import { useSubscriptionViewModel } from '@/viewmodels/subscription/subscription.viewmodel';
import { useBudgetViewModel } from '@/viewmodels/budget/budget.viewmodel';
import DualCurrencyDisplay from '@/components/ui/DualCurrencyDisplay';

type CategoryWithIcon = {
  name: SubscriptionCategory;
  icon: React.ReactNode;
  amount: string;
  count: number;
  color: string;
};

/**
 * SubscriptionCategories Component
 * 
 * Displays subscription categories with their totals and budget information.
 * Uses extensive memoization for optimal performance.
 */
const SubscriptionCategories = () => {
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<CategoryWithIcon[]>([]);
  const [totals, setTotals] = useState({
    budget: 1000.00, // Default budget
    subscriptions: 0
  });

  // Use viewmodels instead of direct service calls
  const { 
    subscriptions, 
    loading: subscriptionsLoading,
    calculateTotalMonthlyCost
  } = useSubscriptionViewModel(user?.uid || null);
  
  const {
    budget,
    loading: budgetLoading
  } = useBudgetViewModel(user?.uid || null);

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

  // Process subscriptions and compute categories - heavily memoized to prevent recalculation
  const processSubscriptions = useCallback(() => {
    if (!subscriptions) return;
    
    // Group subscriptions by category
    const categoryGroups: Record<SubscriptionCategory, Subscription[]> = {} as Record<SubscriptionCategory, Subscription[]>;
    
    // Initialize all categories
    Object.keys(categoryMappings).forEach(cat => {
      categoryGroups[cat as SubscriptionCategory] = [];
    });
    
    // Group subscriptions
    subscriptions.forEach((sub: Subscription) => {
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
    
    // Get the budget amount
    const budgetAmount = budget?.monthlyBudget || 1000.00;
    
    // Calculate total monthly subscription cost using the viewmodel function
    const totalSubscriptionCost = calculateTotalMonthlyCost();
    
    // Update state
    setCategories(categoriesWithAmount);
    setTotals({
      budget: budgetAmount,
      subscriptions: totalSubscriptionCost
    });
  }, [subscriptions, budget, calculateTotalMonthlyCost, categoryMappings]);

  // Only process data when needed
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

    // If user is null (logged out), reset state
    if (!user) {
      setCategories([]);
      setTotals({
        budget: 1000.00,
        subscriptions: 0
      });
      return;
    }

    // Process data once subscriptions and budget are loaded
    if (!subscriptionsLoading && !budgetLoading) {
      processSubscriptions();
    }
  }, [
    user, 
    authLoading, 
    subscriptions,
    budget,
    subscriptionsLoading,
    budgetLoading,
    processSubscriptions
  ]);

  // Memoize the budget percentage calculation
  const getBudgetPercentage = useMemo(() => {
    return ((totals.subscriptions / totals.budget) * 100).toFixed(1);
  }, [totals.subscriptions, totals.budget]);
  
  // Memoize the entire categories list rendering to prevent rerenders
  const categoriesList = useMemo(() => {
    if (categories.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No subscriptions added yet
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {categories.map((category) => (
          <div 
            key={category.name} 
            className="relative z-10 flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors overflow-hidden"
            style={{ position: 'relative' }}
          >
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
    );
  }, [categories]);
  
  // Memoize the budget summary section
  const budgetSummary = useMemo(() => {
    return (
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Monthly Budget</p>
            <p className="text-xl font-bold mt-1">
              <DualCurrencyDisplay amount={totals.budget} currency={budget?.currency || '€'} />
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Subscriptions</p>
            <p className="text-xl font-bold mt-1">
              <DualCurrencyDisplay amount={totals.subscriptions} currency={budget?.currency || '€'} />
            </p>
          </div>
        </div>
        <div className="mt-4 bg-gray-100 h-2 rounded-full overflow-hidden">
          <div className="bg-primary h-full" style={{ width: `${getBudgetPercentage}%` }}></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">You're spending {getBudgetPercentage}% of your monthly budget on subscriptions</p>
      </div>
    );
  }, [totals, budget, getBudgetPercentage]);
  
  // Show loading spinner if any data is still loading
  if (authLoading || subscriptionsLoading || budgetLoading) {
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
      
      {categoriesList}
      {budgetSummary}
    </div>
  );
};

export default SubscriptionCategories; 