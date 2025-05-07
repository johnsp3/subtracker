/**
 * Billing Automation Service
 * 
 * This file is responsible for handling automated billing record creation.
 * It checks for subscriptions that are due for billing, creates billing records,
 * and updates the subscription's next billing date.
 */
import { 
  Subscription, 
  BillingCycle 
} from '@/models/subscription/subscription.model';
import { 
  NewBillingRecord,
  BillingStatus 
} from '@/models/billing/billing.model';
import { addBillingRecord } from './billing.service';
import { updateSubscription } from '../subscription/subscription.service';

/**
 * Check if a subscription is due for billing
 * 
 * @param subscription - The subscription to check
 * @returns True if the subscription is due for billing
 */
export const isSubscriptionDueForBilling = (subscription: Subscription): boolean => {
  // Only process active subscriptions
  if (subscription.status !== 'active') {
    return false;
  }

  const today = new Date();
  const nextBillingDate = new Date(subscription.nextBilling);
  
  // Consider it due if the next billing date is today or in the past
  return nextBillingDate <= today;
};

/**
 * Calculate the next billing date based on the current billing date and cycle
 * 
 * @param currentBillingDate - The current billing date
 * @param billingCycle - The billing cycle (Monthly, Quarterly, Yearly)
 * @returns The next billing date as an ISO string
 */
export const calculateNextBillingDate = (
  currentBillingDate: Date,
  billingCycle: BillingCycle
): string => {
  const nextDate = new Date(currentBillingDate);
  
  switch (billingCycle) {
    case 'Monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'Quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'Yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  return nextDate.toISOString();
};

/**
 * Create a billing record for a subscription
 * 
 * @param subscription - The subscription to create a billing record for
 * @param status - The billing status (defaults to 'paid')
 * @returns The ID of the newly created billing record
 */
export const createBillingRecord = async (
  subscription: Subscription, 
  status: BillingStatus = 'paid'
): Promise<string> => {
  const billingDate = new Date(subscription.nextBilling);
  
  const newBillingRecord: NewBillingRecord = {
    date: billingDate.toISOString(),
    subscriptionId: subscription.id,
    subscriptionName: subscription.name,
    amount: subscription.price,
    currency: subscription.currency,
    status
  };
  
  return addBillingRecord(subscription.userId, newBillingRecord);
};

/**
 * Update the subscription's next billing date
 * 
 * @param subscription - The subscription to update
 * @returns True if the update was successful
 */
export const updateNextBillingDate = async (subscription: Subscription): Promise<boolean> => {
  const currentBillingDate = new Date(subscription.nextBilling);
  const nextBillingDate = calculateNextBillingDate(currentBillingDate, subscription.billingCycle);
  
  return updateSubscription(subscription.id, {
    nextBilling: nextBillingDate
  });
};

/**
 * Process a single subscription for billing
 * 
 * @param subscription - The subscription to process
 * @returns True if processing was successful
 */
export const processBilling = async (subscription: Subscription): Promise<boolean> => {
  try {
    // Only process subscriptions that are due
    if (!isSubscriptionDueForBilling(subscription)) {
      return false;
    }
    
    // Create billing record
    await createBillingRecord(subscription);
    
    // Update next billing date
    await updateNextBillingDate(subscription);
    
    return true;
  } catch (error) {
    console.error('Error processing billing for subscription:', subscription.id, error);
    return false;
  }
};

/**
 * Process all subscriptions that are due for billing
 * 
 * @param subscriptions - The list of subscriptions to check and process
 * @returns An array of processed subscription IDs
 */
export const processAllDueBillings = async (subscriptions: Subscription[]): Promise<string[]> => {
  const processedIds: string[] = [];
  
  // Filter subscriptions that are due for billing
  const dueSubscriptions = subscriptions.filter(isSubscriptionDueForBilling);
  
  // Process each due subscription
  for (const subscription of dueSubscriptions) {
    const success = await processBilling(subscription);
    if (success) {
      processedIds.push(subscription.id);
    }
  }
  
  return processedIds;
}; 