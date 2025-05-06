'use client';

import { Home, CalendarClock, BarChart2, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = () => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  
  const navigation = [
    { name: 'Overview', href: '/', icon: Home },
    { name: 'Subscriptions', href: '/subscriptions', icon: CalendarClock },
    { name: 'Statistics', href: '/statistics', icon: BarChart2 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 w-[280px] bg-primary text-white p-6 flex flex-col shadow-lg">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
          <span className="text-primary font-bold text-xl">S</span>
        </div>
        <h1 className="text-xl font-bold">SubTracker</h1>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors \
                    ${isActive ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}
                >
                  <Icon size={24} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="mt-auto pt-6 border-t border-white border-opacity-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img 
              src={user?.photoURL || "https://picsum.photos/id/64/40/40"} 
              alt="User profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-medium">{user?.displayName || 'User'}</p>
            <p className="text-sm text-white text-opacity-70">{user?.email}</p>
          </div>
        </div>
        
        <button 
          onClick={signOut}
          className="flex items-center gap-2 w-full p-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 