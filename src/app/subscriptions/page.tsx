'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { Bell, BellOff, Calendar, Plus, Trash2, Edit, ExternalLink, Check } from 'lucide-react';
import { 
  getUserSubscriptions, 
  addSubscription, 
  updateSubscription, 
  deleteSubscription,
  getUserBillingHistory 
} from '@/utils/firestore';
import { 
  Subscription, 
  SubscriptionCategory, 
  BillingCycle, 
  BillingRecord 
} from '@/utils/types';
import MonogramAvatar from '@/components/features/subscriptions/MonogramAvatar';
import DualCurrencyDisplay from '@/components/ui/DualCurrencyDisplay';
import ProcessDueBillings from '@/components/features/billing/ProcessDueBillings';
import { generateMonogram, generateBackgroundColor } from '@/utils/avatar';

type NewSubscriptionForm = {
  name: string;
  category: SubscriptionCategory;
  price: string;
  currency: string;
  billingCycle: BillingCycle;
  nextBilling: string;
  notificationsEnabled: boolean;
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'billing' | 'add'>('all');
  const [selectedCategory, setSelectedCategory] = useState<SubscriptionCategory | 'All'>('All');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  
  const [formData, setFormData] = useState<NewSubscriptionForm>({
    name: '',
    category: 'Streaming',
    price: '',
    currency: '€',
    billingCycle: 'Monthly',
    nextBilling: '',
    notificationsEnabled: false
  });

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    price?: string;
    nextBilling?: string;
  }>({});

  // Load user's subscriptions and billing history when user is authenticated
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get user's subscriptions
        const userSubscriptions = await getUserSubscriptions(user.uid);
        setSubscriptions(userSubscriptions);
        
        // Get user's billing history
        const userBillingHistory = await getUserBillingHistory(user.uid);
        setBillingHistory(userBillingHistory);
      } catch (error) {
        console.error('Error loading user data:', error);
        // Here you could set an error state or show a notification
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user]);

  const categories: SubscriptionCategory[] = [
    'Streaming',
    'Music',
    'Shopping',
    'Utilities',
    'Car',
    'Home',
    'Entertainment',
    'Other'
  ];

  const filteredSubscriptions = selectedCategory === 'All' 
    ? subscriptions 
    : subscriptions.filter(sub => sub.category === selectedCategory);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const validateForm = (): boolean => {
    const errors: {
      name?: string;
      price?: string;
      nextBilling?: string;
    } = {};

    if (!formData.name.trim()) {
      errors.name = 'Subscription name is required';
    }

    if (!formData.price.trim()) {
      errors.price = 'Price is required';
    } else if (!/^\d+(\.\d{1,2})?$/.test(formData.price)) {
      errors.price = 'Price must be a valid number';
    }

    if (!formData.nextBilling) {
      errors.nextBilling = 'Next billing date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditSubscription = (subscription: Subscription) => {
    // Set the subscription being edited
    setEditingSubscription(subscription);
    
    // Format date as YYYY-MM-DD for the date input
    const formattedDate = new Date(subscription.nextBilling).toISOString().split('T')[0];
    
    // Populate form with subscription data
    setFormData({
      name: subscription.name,
      category: subscription.category,
      price: subscription.price.toString(),
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      nextBilling: formattedDate,
      notificationsEnabled: subscription.notificationsEnabled
    });
    
    // Switch to add/edit tab
    setActiveTab('add');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) {
      return;
    }
    
    try {
      // Preserve exact case for monogram
      const exactName = formData.name;
      
      const subscriptionData = {
        name: formData.name,
        provider: formData.name, // Using name as provider for now
        price: parseFloat(formData.price),
        currency: formData.currency,
        category: formData.category,
        billingCycle: formData.billingCycle,
        nextBilling: formData.nextBilling,
        status: 'active' as const,
        logo: exactName,
        notificationsEnabled: formData.notificationsEnabled
      };
      
      if (editingSubscription) {
        // Update existing subscription
        await updateSubscription(editingSubscription.id, subscriptionData);
        
        // Show success message
        alert('Subscription updated successfully!');
      } else {
        // Add new subscription
        await addSubscription(user.uid, subscriptionData);
        
        // Show success message
        alert('Subscription added successfully!');
      }
      
      // Refresh subscriptions
      const updatedSubscriptions = await getUserSubscriptions(user.uid);
      setSubscriptions(updatedSubscriptions);
      
      // Reset form and editing state
      setFormData({
        name: '',
        category: 'Streaming',
        price: '',
        currency: '€',
        billingCycle: 'Monthly',
        nextBilling: '',
        notificationsEnabled: false
      });
      setEditingSubscription(null);
      
      // Switch to all subscriptions tab
      setActiveTab('all');
    } catch (error) {
      console.error('Error saving subscription:', error);
      alert('Failed to save subscription. Please try again.');
    }
  };

  const toggleNotification = async (subscription: Subscription) => {
    if (!user) return;
    
    try {
      await updateSubscription(subscription.id, {
        notificationsEnabled: !subscription.notificationsEnabled
      });
      
      // Update local state
      setSubscriptions(subs => 
        subs.map(sub => 
          sub.id === subscription.id 
            ? { ...sub, notificationsEnabled: !sub.notificationsEnabled } 
            : sub
        )
      );
    } catch (error) {
      console.error('Error toggling notification:', error);
    }
  };

  const handleDeleteSubscription = async (subscription: Subscription) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        await deleteSubscription(subscription.id);
        
        // Remove from local state
        setSubscriptions(subs => subs.filter(sub => sub.id !== subscription.id));
      } catch (error) {
        console.error('Error deleting subscription:', error);
        alert('Failed to delete subscription. Please try again.');
      }
    }
  };

  // Handle billing process completion
  const handleBillingProcessComplete = async (processedIds: string[], newBillingRecords: BillingRecord[]) => {
    if (processedIds.length > 0) {
      try {
        // Refresh subscriptions to get updated next billing dates
        const updatedSubscriptions = await getUserSubscriptions(user?.uid || '');
        setSubscriptions(updatedSubscriptions);
        
        // Refresh billing history with new records
        const updatedBillingHistory = await getUserBillingHistory(user?.uid || '');
        setBillingHistory(updatedBillingHistory);
      } catch (error) {
        console.error('Error refreshing data after billing process:', error);
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="flex-1 pl-[300px] p-10">
            <div className="flex min-h-screen items-center justify-center">
              <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 pl-[300px] p-10">
          <div className="max-w-7xl mx-auto">
            <Header />
            
            <div className="mb-10">
              <h1 className="text-3xl font-bold">Your Subscriptions</h1>
              <p className="text-gray-600 mt-2">Manage and track all your recurring subscriptions.</p>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
              <button 
                className={`px-6 py-3 font-medium ${activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('all')}
              >
                All Subscriptions
              </button>
              <button 
                className={`px-6 py-3 font-medium ${activeTab === 'billing' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('billing')}
              >
                Billing History
              </button>
              <button 
                className={`px-6 py-3 font-medium ${activeTab === 'add' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('add')}
              >
                Add Subscription
              </button>
            </div>
            
            {/* All Subscriptions */}
            {activeTab === 'all' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">All Subscriptions</h2>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                      {filteredSubscriptions.filter(s => s.status === 'active').length} active
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <select 
                        className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as SubscriptionCategory | 'All')}
                      >
                        <option value="All">All Categories</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                    <button 
                      className="flex items-center gap-2 text-white bg-primary px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                      onClick={() => setActiveTab('add')}
                    >
                      <Plus size={18} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
                
                {filteredSubscriptions.length === 0 ? (
                  <div className="bg-white rounded-xl p-10 shadow-sm text-center">
                    <p className="text-lg text-gray-600 mb-6">You don't have any subscriptions yet.</p>
                    <button 
                      className="flex items-center gap-2 mx-auto text-white bg-primary px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                      onClick={() => setActiveTab('add')}
                    >
                      <Plus size={18} />
                      <span>Add Your First Subscription</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredSubscriptions.map((subscription) => (
                      <div key={subscription.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden">
                              <MonogramAvatar name={subscription.logo || subscription.name} />
                            </div>
                            <div>
                              <h3 className="font-medium">{subscription.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{subscription.category}</span>
                                <span className="text-sm text-gray-500">{subscription.provider}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-bold">
                              <DualCurrencyDisplay amount={subscription.price} currency={subscription.currency} />
                            </span>
                            <span className="text-sm text-gray-500">{subscription.billingCycle}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-sm">
                              Next billing: {new Date(subscription.nextBilling).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            {subscription.status === 'active' ? (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success bg-opacity-20">
                                <Check size={14} className="text-success" />
                                <span className="text-xs text-success font-medium">Active</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-200">
                                <span className="text-xs text-gray-600 font-medium">Canceled</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2 mt-4">
                          <button 
                            className={`text-sm hover:text-primary transition-colors p-1.5 rounded-full hover:bg-primary hover:bg-opacity-10 ${
                              subscription.notificationsEnabled ? 'text-primary' : 'text-gray-500'
                            }`}
                            onClick={() => toggleNotification(subscription)}
                          >
                            {subscription.notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                          </button>
                          <button 
                            className="text-sm text-gray-500 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-primary hover:bg-opacity-10"
                            onClick={() => handleEditSubscription(subscription)}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="text-sm text-gray-500 hover:text-error transition-colors p-1.5 rounded-full hover:bg-error hover:bg-opacity-10"
                            onClick={() => handleDeleteSubscription(subscription)}
                          >
                            <Trash2 size={16} />
                          </button>
                          <button className="text-sm text-gray-500 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-primary hover:bg-opacity-10">
                            <ExternalLink size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {filteredSubscriptions.length > 0 && (
                  <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center justify-center py-6">
                      <p className="text-lg font-medium mb-2">Total Monthly Subscriptions</p>
                      <p className="text-3xl font-bold text-primary mb-4">
                        <DualCurrencyDisplay 
                          amount={filteredSubscriptions
                            .filter(s => s.status === 'active')
                            .reduce((total, sub) => {
                              // Normalize to monthly cost
                              let monthlyCost = sub.price;
                              if (sub.billingCycle === 'Yearly') {
                                monthlyCost = sub.price / 12;
                              } else if (sub.billingCycle === 'Quarterly') {
                                monthlyCost = sub.price / 3;
                              }
                              return total + monthlyCost;
                            }, 0)}
                          currency={filteredSubscriptions[0]?.currency || "€"}
                          size="lg"
                        />
                      </p>
                      <p className="text-sm text-gray-500">
                        You're spending an average of{' '}
                        <DualCurrencyDisplay
                          amount={(filteredSubscriptions
                            .filter(s => s.status === 'active')
                            .reduce((total, sub) => {
                              // Normalize to monthly cost
                              let monthlyCost = sub.price;
                              if (sub.billingCycle === 'Yearly') {
                                monthlyCost = sub.price / 12;
                              } else if (sub.billingCycle === 'Quarterly') {
                                monthlyCost = sub.price / 3;
                              }
                              return total + monthlyCost;
                            }, 0) / 30)}
                          currency={filteredSubscriptions[0]?.currency || "€"}
                          size="sm"
                        /> per day on subscriptions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Billing History */}
            {activeTab === 'billing' && (
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-xl font-bold mb-6">Billing History</h2>
                
                {/* Add the process due billings component */}
                <ProcessDueBillings 
                  subscriptions={subscriptions} 
                  onProcessComplete={handleBillingProcessComplete} 
                />
                
                {billingHistory.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No billing history available.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="py-3 text-left font-medium text-gray-500">Date</th>
                          <th className="py-3 text-left font-medium text-gray-500">Subscription</th>
                          <th className="py-3 text-left font-medium text-gray-500">Amount</th>
                          <th className="py-3 text-left font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingHistory.map((record) => (
                          <tr key={record.id} className="border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors">
                            <td className="py-4">{new Date(record.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}</td>
                            <td className="py-4">{record.subscriptionName}</td>
                            <td className="py-4">
                              <DualCurrencyDisplay amount={record.amount} currency={record.currency} />
                            </td>
                            <td className="py-4">
                              <span 
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  record.status === 'paid' 
                                    ? 'bg-success bg-opacity-20 text-success' 
                                    : record.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-error bg-opacity-20 text-error'
                                }`}
                              >
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {/* Add/Edit Subscription */}
            {activeTab === 'add' && (
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-xl font-bold mb-6">
                  {editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}
                </h2>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Name</label>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Netflix, Spotify" 
                        className={`w-full p-3 bg-gray-50 border ${formErrors.name ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary`}
                      />
                      {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select 
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{formData.currency}</span>
                        <input 
                          type="text" 
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="0.00" 
                          className={`w-full p-3 pl-8 bg-gray-50 border ${formErrors.price ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary`}
                        />
                      </div>
                      {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <select 
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="€">€ (Euro)</option>
                        <option value="$">$ (US Dollar)</option>
                        <option value="£">£ (British Pound)</option>
                        <option value="¥">¥ (Japanese Yen)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Billing Cycle</label>
                      <select 
                        name="billingCycle"
                        value={formData.billingCycle}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Next Billing Date</label>
                      <input 
                        type="date" 
                        name="nextBilling"
                        value={formData.nextBilling}
                        onChange={handleInputChange}
                        className={`w-full p-3 bg-gray-50 border ${formErrors.nextBilling ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary`}
                      />
                      {formErrors.nextBilling && <p className="text-red-500 text-xs mt-1">{formErrors.nextBilling}</p>}
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="notificationsEnabled"
                        checked={formData.notificationsEnabled}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 text-primary" 
                      />
                      <span className="text-sm text-gray-700">Enable notifications for this subscription</span>
                    </label>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="submit"
                      className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                      {editingSubscription ? 'Update Subscription' : 'Add Subscription'}
                    </button>
                    <button 
                      type="button"
                      className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      onClick={() => {
                        setActiveTab('all');
                        setEditingSubscription(null);
                        setFormData({
                          name: '',
                          category: 'Streaming',
                          price: '',
                          currency: '€',
                          billingCycle: 'Monthly',
                          nextBilling: '',
                          notificationsEnabled: false
                        });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 