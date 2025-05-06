'use client';

import { Search, Bell } from 'lucide-react';

const Header = () => {
  return (
    <div className="flex items-center justify-between mb-10">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Search transactions, subscriptions, etc."
            className="w-full rounded-xl bg-white pl-12 pr-4 py-3.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" 
            size={20} 
          />
        </div>
      </div>
      
      <div className="flex items-center">
        <button className="relative p-2.5 bg-white shadow-sm rounded-full hover:bg-gray-50 transition-colors">
          <Bell size={20} className="text-gray-700" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full flex items-center justify-center text-white text-xs">
            3
          </span>
        </button>
      </div>
    </div>
  );
};

export default Header; 