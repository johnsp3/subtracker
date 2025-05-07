'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet } from 'lucide-react';
import { useBudgetViewModel } from '@/viewmodels/budget/budget.viewmodel';

const BudgetSettings = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Use the budget view model instead of direct service calls
  const {
    budget,
    loading,
    error,
    clearError,
    updateBudget
  } = useBudgetViewModel(user?.uid || null);
  
  const [formData, setFormData] = useState({
    monthlyBudget: '',
    currency: '€'
  });

  const [formErrors, setFormErrors] = useState<{
    monthlyBudget?: string;
  }>({});
  
  // Show error from view model as an alert
  useEffect(() => {
    if (error) {
      alert(error);
      clearError();
    }
  }, [error, clearError]);

  // Initialize form data when budget is loaded
  useEffect(() => {
    if (budget) {
      setFormData({
        monthlyBudget: budget.monthlyBudget.toString(),
        currency: budget.currency
      });
    }
  }, [budget]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear success message when form is changed
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = (): boolean => {
    const errors: { monthlyBudget?: string } = {};

    if (!formData.monthlyBudget.trim()) {
      errors.monthlyBudget = 'Monthly budget is required';
    } else if (!/^\d+(\.\d{1,2})?$/.test(formData.monthlyBudget)) {
      errors.monthlyBudget = 'Budget must be a valid number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user || !budget) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Use the view model to update the budget
      const success = await updateBudget({
        monthlyBudget: parseFloat(formData.monthlyBudget),
        currency: formData.currency
      });
      
      if (success) {
        // Show success message
        setSuccessMessage('Budget updated successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating budget:', error);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mr-4">
          <Wallet className="text-primary" size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Monthly Budget</h2>
          <p className="text-gray-600 text-sm">Set your monthly spending limit for subscriptions</p>
        </div>
      </div>
      
      <form className="mt-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Budget Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {formData.currency}
              </span>
              <input 
                type="text" 
                name="monthlyBudget"
                value={formData.monthlyBudget}
                onChange={handleInputChange}
                placeholder="0.00" 
                className={`w-full p-3 pl-8 bg-gray-50 border ${formErrors.monthlyBudget ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary`}
              />
            </div>
            {formErrors.monthlyBudget && (
              <p className="text-red-500 text-xs mt-1">{formErrors.monthlyBudget}</p>
            )}
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
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <button 
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Apply Changes'}
          </button>
          
          {successMessage && (
            <div className="flex items-center text-green-600">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default BudgetSettings; 