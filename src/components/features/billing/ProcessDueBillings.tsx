/**
 * Process Due Billings Component
 * 
 * This component provides a UI for users to manually check for
 * due subscriptions and process their billing.
 */
import { useState } from 'react';
import { Subscription } from '@/models/subscription/subscription.model';
import { BillingRecord } from '@/models/billing/billing.model';
import { processAllDueBillings, isSubscriptionDueForBilling } from '@/services/billing/billing-automation.service';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface ProcessDueBillingsProps {
  subscriptions: Subscription[];
  onProcessComplete: (processed: string[], newBillingRecords: BillingRecord[]) => void;
}

export default function ProcessDueBillings({ 
  subscriptions, 
  onProcessComplete 
}: ProcessDueBillingsProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  
  // Determine if there are any subscriptions due for billing
  const dueSubscriptions = subscriptions.filter(isSubscriptionDueForBilling);
  const hasDueSubscriptions = dueSubscriptions.length > 0;
  
  const handleProcessBillings = async () => {
    if (!hasDueSubscriptions) {
      setStatus('success');
      setMessage('No subscriptions due for billing today.');
      return;
    }
    
    try {
      setLoading(true);
      setStatus('idle');
      setMessage('');
      
      // Process all due billings
      const processedIds = await processAllDueBillings(subscriptions);
      
      // Create billing records from processed subscriptions
      const processedSubscriptions = subscriptions.filter(sub => 
        processedIds.includes(sub.id)
      );
      
      // Format the billing records for display
      const newBillingRecords: BillingRecord[] = processedSubscriptions.map(sub => ({
        id: `temp-${sub.id}`, // This will be replaced with the actual ID from Firebase
        date: new Date(sub.nextBilling).toISOString(),
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        amount: sub.price,
        currency: sub.currency,
        status: 'paid',
        userId: sub.userId
      }));
      
      // Call the callback with processed IDs and new billing records
      onProcessComplete(processedIds, newBillingRecords);
      
      // Update status
      setStatus('success');
      setMessage(`Successfully processed ${processedIds.length} subscription${processedIds.length !== 1 ? 's' : ''}.`);
    } catch (error) {
      console.error('Error processing billings:', error);
      setStatus('error');
      setMessage('Failed to process billings. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between flex-wrap">
        <div>
          <h3 className="font-medium">Billing Automation</h3>
          <p className="text-sm text-gray-500">
            {hasDueSubscriptions
              ? `You have ${dueSubscriptions.length} subscription${dueSubscriptions.length !== 1 ? 's' : ''} due for billing.`
              : 'No subscriptions due for billing today.'}
          </p>
        </div>
        
        <div className="mt-3 sm:mt-0">
          <button
            onClick={handleProcessBillings}
            disabled={loading || (!hasDueSubscriptions && status !== 'idle')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              loading || (!hasDueSubscriptions && status !== 'idle')
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              'Process Due Billings'
            )}
          </button>
        </div>
      </div>
      
      {status !== 'idle' && (
        <div className={`mt-3 text-sm font-medium flex items-center gap-2 ${
          status === 'success' ? 'text-success' : 'text-error'
        }`}>
          {status === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {message}
        </div>
      )}
    </div>
  );
} 