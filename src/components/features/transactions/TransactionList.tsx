'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';

type Transaction = {
  id: string;
  name: string;
  date: string;
  amount: string;
  type: 'income' | 'expense';
  category: string;
  icon: string;
};

const TransactionList = () => {
  const [expandedDay, setExpandedDay] = useState<string | null>('Today');

  const transactions: Record<string, Transaction[]> = {
    'Today': [
      {
        id: '1',
        name: 'Netflix Subscription',
        date: '2:30 PM',
        amount: '-$12.99',
        type: 'expense',
        category: 'Entertainment',
        icon: 'https://picsum.photos/id/0/40/40'
      },
      {
        id: '2',
        name: 'Salary Deposit',
        date: '9:20 AM',
        amount: '+$2,750.00',
        type: 'income',
        category: 'Salary',
        icon: 'https://picsum.photos/id/1/40/40'
      },
    ],
    'Yesterday': [
      {
        id: '3',
        name: 'Grocery Shopping',
        date: '7:45 PM',
        amount: '-$65.35',
        type: 'expense',
        category: 'Groceries',
        icon: 'https://picsum.photos/id/2/40/40'
      },
      {
        id: '4',
        name: 'Freelance Payment',
        date: '2:15 PM',
        amount: '+$350.00',
        type: 'income',
        category: 'Freelance',
        icon: 'https://picsum.photos/id/3/40/40'
      },
    ],
  };

  const toggleDay = (day: string) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

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
        {Object.entries(transactions).map(([day, dayTransactions]) => (
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
                        <p className="text-sm text-gray-500">{transaction.date}</p>
                      </div>
                    </div>
                    <div className={transaction.type === 'income' ? 'text-success font-medium' : 'text-error font-medium'}>
                      {transaction.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionList; 