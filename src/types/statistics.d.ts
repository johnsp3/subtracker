declare module '@/components/features/statistics/SpendingByCategory' {
  import { FC } from 'react';
  import { Subscription } from '@/utils/types';
  
  interface SpendingByCategoryProps {
    subscriptions: Subscription[];
  }
  
  const SpendingByCategory: FC<SpendingByCategoryProps>;
  export default SpendingByCategory;
}

declare module '@/components/features/statistics/MonthlySpendingTrend' {
  import { FC } from 'react';
  import { Subscription } from '@/utils/types';
  
  interface MonthlySpendingTrendProps {
    subscriptions: Subscription[];
  }
  
  const MonthlySpendingTrend: FC<MonthlySpendingTrendProps>;
  export default MonthlySpendingTrend;
}

declare module '@/components/features/statistics/SubscriptionComparison' {
  import { FC } from 'react';
  import { Subscription } from '@/utils/types';
  
  interface SubscriptionComparisonProps {
    subscriptions: Subscription[];
  }
  
  const SubscriptionComparison: FC<SubscriptionComparisonProps>;
  export default SubscriptionComparison;
}

declare module '@/components/features/statistics/YearlyProjection' {
  import { FC } from 'react';
  import { Subscription } from '@/utils/types';
  
  interface YearlyProjectionProps {
    subscriptions: Subscription[];
  }
  
  const YearlyProjection: FC<YearlyProjectionProps>;
  export default YearlyProjection;
}

declare module '@/components/features/statistics/BudgetUtilization' {
  import { FC } from 'react';
  import { Subscription, Budget } from '@/utils/types';
  
  interface BudgetUtilizationProps {
    subscriptions: Subscription[];
    budget: Budget | null;
  }
  
  const BudgetUtilization: FC<BudgetUtilizationProps>;
  export default BudgetUtilization;
} 