'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { useTransactionViewModel } from '@/viewmodels/transaction/transaction.viewmodel';

/**
 * Transaction List Component
 * 
 * Displays a list of transactions organized by timeframe.
 * Following the MVVM pattern, this component only handles UI rendering and user interaction,
 * while business logic is delegated to the transaction view model.
 */
const TransactionList = () => {
  const { user, loading: authLoading } = useAuth();
  const [expandedDay, setExpandedDay] = useState<string | null>('Today');
  const toast = useToastContext();
  
  // Use the transaction view model
  const {
    loading,
    error,
    clearError,
    getTransactionsByTimeframe
  } = useTransactionViewModel(user?.uid || null);

  // Get transactions grouped by timeframe
  const transactionsByTimeframe = getTransactionsByTimeframe();
  
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

  // If still loading, show a loading spinner
  if (authLoading || loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow mb-8">
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // If no transactions available, show empty state
  if (!user || Object.entries(transactionsByTimeframe).every(([_, transactions]) => transactions.length === 0)) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Transaction History</h2>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <Filter size={16} />
              <span>Filter</span>
            </button>
            <button className="text-primary text-sm font-medium hover:text-opacity-80 transition-colors">View all</button>
          </div>
        </div>
        <div className="text-center py-6 text-gray-500">
          No transactions found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Transaction History</h2>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <Filter size={16} />
            <span>Filter</span>
          </button>
          <button className="text-primary text-sm font-medium hover:text-opacity-80 transition-colors">View all</button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(transactionsByTimeframe).map(([day, dayTransactions]) => (
          dayTransactions.length > 0 && (
            <div key={day} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div 
                className="flex items-center justify-between cursor-pointer py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors"
                onClick={() => toggleDay(day)}
              >
                <h3 className="font-medium">{day}</h3>
                {expandedDay === day ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </div>

              {expandedDay === day && (
                <div className="space-y-4 mt-4">
                  {dayTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                          <img 
                            src={transaction.icon} 
                            alt={transaction.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-medium">{transaction.name}</h4>
                          <p className="text-sm text-gray-500">{transaction.displayDate}</p>
                        </div>
                      </div>
                      <div className={transaction.type === 'income' ? 'text-success font-medium' : 'text-error font-medium'}>
                        {transaction.displayAmount}
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

export default TransactionList; 