'use client';

import * as React from 'react';

interface TabsContextProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextProps | undefined>(undefined);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

interface TabsProps {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ defaultValue, className = '', children }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export const TabsList: React.FC<TabsListProps> = ({ className = '', children }) => {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  value, 
  className = '', 
  children
}) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;
  
  const handleClick = () => {
    setActiveTab(value);
  };
  
  return (
    <button 
      className={`px-6 py-3 font-medium ${isActive ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'} ${className}`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export const TabsContent: React.FC<TabsContentProps> = ({ 
  value, 
  className = '', 
  children
}) => {
  const { activeTab } = useTabsContext();
  
  if (activeTab !== value) {
    return null;
  }
  
  return (
    <div className={className}>
      {children}
    </div>
  );
}; 