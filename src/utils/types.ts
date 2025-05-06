export type SubscriptionCategory = 
  | 'Streaming' 
  | 'Music' 
  | 'Shopping' 
  | 'Utilities' 
  | 'Car' 
  | 'Home' 
  | 'Entertainment'
  | 'Other';

export type BillingCycle = 'Monthly' | 'Yearly' | 'Quarterly';

export type SubscriptionStatus = 'active' | 'canceled' | 'trial';

export type NotificationDay = 1 | 3 | 5;

export interface NotificationPreferences {
  enabled: boolean;
  daysBeforeRenewal: NotificationDay[];
  browserNotifications: boolean;
  systemNotifications: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  provider: string;
  price: number;
  currency: string;
  category: SubscriptionCategory;
  billingCycle: BillingCycle;
  nextBilling: string;
  status: SubscriptionStatus;
  /** 
   * The name of the subscription used to generate the monogram avatar.
   * Used to be an image URL but now it's just the subscription name.
   */
  logo: string;
  notificationsEnabled: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingRecord {
  id: string;
  date: string;
  subscriptionId: string;
  subscriptionName: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  userId: string;
}

export interface Budget {
  id: string;
  userId: string;
  monthlyBudget: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  notifications: NotificationPreferences;
  createdAt: string;
  updatedAt: string;
} 