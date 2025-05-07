/**
 * Subscription Model
 * 
 * This file defines types and interfaces related to subscription data.
 * Following the Single Responsibility Principle, this file only handles
 * subscription data structures.
 */

/**
 * Available subscription categories
 */
export type SubscriptionCategory = 
  | 'Streaming' 
  | 'Music' 
  | 'Shopping' 
  | 'Utilities' 
  | 'Car' 
  | 'Home' 
  | 'Entertainment'
  | 'Other';

/**
 * Billing cycle options for subscriptions
 */
export type BillingCycle = 'Monthly' | 'Yearly' | 'Quarterly';

/**
 * Current status of a subscription
 */
export type SubscriptionStatus = 'active' | 'canceled' | 'trial';

/**
 * Subscription entity interface
 * 
 * Represents a user's subscription to a service
 */
export interface Subscription {
  /** Unique identifier */
  id: string;
  
  /** Name of the subscription service */
  name: string;
  
  /** Provider of the service */
  provider: string;
  
  /** Price amount */
  price: number;
  
  /** Currency code */
  currency: string;
  
  /** Category the subscription belongs to */
  category: SubscriptionCategory;
  
  /** How often billing occurs */
  billingCycle: BillingCycle;
  
  /** Date of next billing occurrence */
  nextBilling: string;
  
  /** Current subscription status */
  status: SubscriptionStatus;
  
  /** 
   * The name of the subscription used to generate the monogram avatar.
   * Used to be an image URL but now it's just the subscription name.
   */
  logo: string;
  
  /** Whether notifications are enabled for this subscription */
  notificationsEnabled: boolean;
  
  /** User ID who owns this subscription */
  userId: string;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Data needed to create a new subscription
 * Omitting system-generated fields
 */
export type NewSubscription = Omit<Subscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

/**
 * Data needed to update an existing subscription
 * Omitting read-only fields
 */
export type SubscriptionUpdate = Partial<Omit<Subscription, 'id' | 'userId' | 'createdAt'>>;

/**
 * Mapped subscription with derived data used for display
 */
export interface SubscriptionDisplay {
  id: string;
  name: string;
  logo: string;
  amount: string;
  nextPayment: string;
  daysLeft: number;
  category: string;
  notificationsEnabled: boolean;
} 