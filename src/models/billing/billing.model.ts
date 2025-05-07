/**
 * Billing Model
 * 
 * This file defines types and interfaces related to billing data.
 * Following the Single Responsibility Principle, this file only handles
 * billing record data structures.
 */

/**
 * Status of a billing record payment
 */
export type BillingStatus = 'paid' | 'pending' | 'failed';

/**
 * Billing record entity interface
 * 
 * Represents a payment record for a subscription
 */
export interface BillingRecord {
  /** Unique identifier */
  id: string;
  
  /** Date when the billing occurred */
  date: string;
  
  /** ID of the related subscription */
  subscriptionId: string;
  
  /** Name of the subscription for display purposes */
  subscriptionName: string;
  
  /** Amount charged */
  amount: number;
  
  /** Currency used for the transaction */
  currency: string;
  
  /** Status of the payment */
  status: BillingStatus;
  
  /** User ID who owns this record */
  userId: string;
}

/**
 * Data needed to create a new billing record
 * Omitting system-generated fields
 */
export type NewBillingRecord = Omit<BillingRecord, 'id' | 'userId'>;

/**
 * Mapped billing record with derived data used for display
 */
export interface BillingRecordDisplay {
  id: string;
  date: string;
  subscriptionName: string;
  amount: string;
  status: BillingStatus;
} 