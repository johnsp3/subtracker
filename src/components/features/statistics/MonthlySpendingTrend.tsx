'use client';

import React, { useMemo } from 'react';
import { Subscription } from '@/utils/types';
import DualCurrencyDisplay from '@/components/ui/DualCurrencyDisplay';

interface MonthlySpendingTrendProps {
  subscriptions: Subscription[];
}

const MonthlySpendingTrend: React.FC<MonthlySpendingTrendProps> = ({ subscriptions }) => {
  // Only include active subscriptions
  const activeSubscriptions = useMemo(() => 
    subscriptions.filter(sub => sub.status === 'active'),
    [subscriptions]
  );

  // Generate past 6 months + current month + 3 future months of data
  const trendData = useMemo(() => {
    const data = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Generate data for the past 6 months + current month + 3 future months
    for (let i = -6; i <= 3; i++) {
      const month = (currentMonth + i) % 12;
      const year = currentYear + Math.floor((currentMonth + i) / 12);
      const monthDate = new Date(year, month, 1);
      
      const monthName = monthDate.toLocaleString('default', { month: 'short' });
      const monthYear = year !== currentYear ? `${monthName} ${year}` : monthName;
      
      // Calculate spending for this month based on which subscriptions were active
      let totalSpending = 0;
      
      activeSubscriptions.forEach(sub => {
        const subscriptionStartDate = new Date(sub.createdAt || '2023-01-01'); // Fallback to a default if createdAt is missing
        
        // Skip subscriptions that started after this month
        if (subscriptionStartDate > monthDate) {
          return;
        }
        
        // Convert to monthly cost
        let monthlyCost = sub.price;
        if (sub.billingCycle === 'Yearly') {
          monthlyCost = sub.price / 12;
        } else if (sub.billingCycle === 'Quarterly') {
          monthlyCost = sub.price / 3;
        }
        
        totalSpending += monthlyCost;
      });
      
      data.push({
        month: monthYear,
        spending: totalSpending,
        isFuture: i > 0,
        isCurrentMonth: i === 0
      });
    }
    
    return data;
  }, [activeSubscriptions]);
  
  // Find max spending to determine chart height
  const maxSpending = Math.max(...trendData.map(data => data.spending), 10);
  
  // Generate the chart path (SVG line path)
  const chartPath = useMemo(() => {
    const height = 180; // Chart height
    const width = 650; // Chart width
    const padding = 40; // Padding on both sides
    
    const availableWidth = width - padding * 2;
    const pointWidth = availableWidth / (trendData.length - 1);
    
    return trendData.map((data, i) => {
      const x = padding + i * pointWidth;
      const y = height - (data.spending / maxSpending) * height + 20;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [trendData, maxSpending]);
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-xl font-bold mb-6">Monthly Spending Trend</h2>
      
      {activeSubscriptions.length === 0 ? (
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">No subscription data available.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="h-64 overflow-x-auto pb-6">
            <svg width="700" height="220" viewBox="0 0 700 220" className="mx-auto">
              {/* X-axis */}
              <line x1="40" y1="200" x2="660" y2="200" stroke="#e2e8f0" strokeWidth="1" />
              
              {/* Y-axis */}
              <line x1="40" y1="20" x2="40" y2="200" stroke="#e2e8f0" strokeWidth="1" />
              
              {/* Chart line */}
              <path 
                d={chartPath} 
                fill="none" 
                stroke="#6366f1" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              
              {/* Data points */}
              {trendData.map((data, i) => {
                const height = 180;
                const width = 650;
                const padding = 40;
                const availableWidth = width - padding * 2;
                const pointWidth = availableWidth / (trendData.length - 1);
                
                const x = padding + i * pointWidth;
                const y = height - (data.spending / maxSpending) * height + 20;
                
                return (
                  <React.Fragment key={i}>
                    {/* Point circle */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={data.isCurrentMonth ? 6 : 4} 
                      fill={data.isFuture ? "#e0e7ff" : "#6366f1"} 
                      stroke="#ffffff" 
                      strokeWidth="2" 
                    />
                    
                    {/* Month labels */}
                    <text 
                      x={x} 
                      y="215" 
                      textAnchor="middle" 
                      fontSize="12" 
                      fill={data.isCurrentMonth ? "#4f46e5" : "#94a3b8"}
                      fontWeight={data.isCurrentMonth ? "bold" : "normal"}
                    >
                      {data.month}
                    </text>
                    
                    {/* Connecting line to axis */}
                    <line 
                      x1={x} 
                      y1={y} 
                      x2={x} 
                      y2="200" 
                      stroke={data.isCurrentMonth ? "#cbd5e1" : "#f1f5f9"} 
                      strokeWidth="1" 
                      strokeDasharray={data.isCurrentMonth ? "none" : "2,2"} 
                    />
                    
                    {/* Value labels for each point */}
                    <text 
                      x={x} 
                      y={y - 12} 
                      textAnchor="middle" 
                      fontSize="10" 
                      fill={data.isFuture ? "#94a3b8" : "#6366f1"}
                      fontWeight={data.isCurrentMonth ? "bold" : "normal"}
                    >
                      {activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'}
                      {data.spending.toFixed(2)}
                    </text>
                  </React.Fragment>
                );
              })}
              
              {/* Future indication */}
              <line 
                x1={40 + 650 / 2} 
                y1="20" 
                x2={40 + 650 / 2} 
                y2="200" 
                stroke="#cbd5e1" 
                strokeWidth="1" 
                strokeDasharray="4,4" 
              />
              <text 
                x={40 + 650 / 2 + 30} 
                y="40" 
                fontSize="10" 
                fill="#94a3b8"
              >
                Projected
              </text>
            </svg>
          </div>
          
          <div className="flex justify-between mt-4">
            <div>
              <span className="text-sm text-gray-500">Average monthly spend:</span>
              <span className="block text-lg font-semibold">
                <DualCurrencyDisplay 
                  amount={trendData.reduce((total, data) => total + data.spending, 0) / trendData.length} 
                  currency={activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'} 
                />
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Current month:</span>
              <span className="block text-lg font-semibold">
                <DualCurrencyDisplay 
                  amount={trendData.find(data => data.isCurrentMonth)?.spending || 0} 
                  currency={activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'} 
                />
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Projected next month:</span>
              <span className="block text-lg font-semibold">
                <DualCurrencyDisplay 
                  amount={trendData.find((data, i) => i === trendData.findIndex(d => d.isCurrentMonth) + 1)?.spending || 0} 
                  currency={activeSubscriptions.length > 0 ? activeSubscriptions[0].currency : '€'} 
                />
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlySpendingTrend; 