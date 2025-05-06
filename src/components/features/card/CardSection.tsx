'use client';

import { Wallet, Send } from 'lucide-react';

const CardSection = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Cards</h2>
        <button className="text-primary text-sm font-medium hover:text-opacity-80 transition-colors">+ Add Card</button>
      </div>
      
      {/* Card Display */}
      <div className="bg-primary rounded-xl p-6 text-white mb-6 shadow-md">
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-sm text-white text-opacity-70 mb-1">Current Balance</p>
            <h3 className="text-2xl font-bold">$5,756.00</h3>
          </div>
          <Wallet size={24} />
        </div>
        
        <div>
          <p className="text-sm text-white text-opacity-70 mb-1">Card Number</p>
          <p className="font-medium">**** **** **** 4587</p>
        </div>
        
        <div className="flex justify-between mt-4">
          <div>
            <p className="text-sm text-white text-opacity-70 mb-1">Card Holder</p>
            <p className="font-medium">John Doe</p>
          </div>
          <div>
            <p className="text-sm text-white text-opacity-70 mb-1">Expiry Date</p>
            <p className="font-medium">05/25</p>
          </div>
        </div>
      </div>
      
      {/* Quick Send Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Quick Send</h3>
          <button className="text-primary text-sm font-medium hover:text-opacity-80 transition-colors">See All</button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2">
          {['Emma', 'Mike', 'Sarah', 'Alex', 'Lisa'].map((name, index) => (
            <div key={name} className="flex flex-col items-center min-w-[60px] group">
              <div className="w-12 h-12 rounded-full overflow-hidden mb-2 ring-2 ring-transparent group-hover:ring-primary transition-all">
                <img 
                  src={`https://picsum.photos/id/${index + 10}/48/48`} 
                  alt={name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm">{name}</p>
            </div>
          ))}
          <div className="flex flex-col items-center min-w-[60px] group">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2 group-hover:bg-gray-200 transition-colors">
              <Send size={20} className="text-gray-500" />
            </div>
            <p className="text-sm">New</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardSection; 