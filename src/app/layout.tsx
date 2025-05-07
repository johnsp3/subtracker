'use client';

import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import NotificationProvider from '@/contexts/NotificationContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import ErrorBoundary from '@/components/layout/ErrorBoundary';
import CurrencyServiceInitializer from '@/components/ui/CurrencyServiceInitializer';
import { useState, useEffect } from 'react';
import { migrateCurrencyProviders } from '@/utils/migrate-currency-providers';

const inter = Inter({ subsets: ['latin'] });

// Debug component to help identify mounting issues
function DebugInfo() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // This confirms the component has mounted on the client
    setMounted(true);
    console.log('Application mounted on client');
    
    // Log browser information for debugging
    console.log('User Agent:', navigator.userAgent);
    console.log('Window Size:', window.innerWidth, 'x', window.innerHeight);
    
    // Migrate currency providers to remove deprecated ones
    migrateCurrencyProviders();
  }, []);
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;
  
  return mounted ? (
    <div className="fixed bottom-0 right-0 bg-blue-100 p-2 z-50 text-xs opacity-70 hover:opacity-100">
      Mounted: Yes ✅
    </div>
  ) : (
    <div className="fixed bottom-0 right-0 bg-yellow-100 p-2 z-50 text-xs">
      Mounting... ⏳
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>SubTracker</title>
        <meta name="description" content="Track and manage your subscriptions with ease" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <NotificationProvider>
                <CurrencyProvider>
                  {/* Initialize currency service */}
                  <CurrencyServiceInitializer />
                  
                  {/* Simple indicator to confirm the page is properly loading */}
                  <div id="app-loading-indicator" style={{ 
                    position: 'fixed', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading SubTracker...</p>
                    <script dangerouslySetInnerHTML={{ __html: `
                      setTimeout(() => {
                        const indicator = document.getElementById('app-loading-indicator');
                        if (indicator) indicator.style.display = 'none';
                      }, 2000);
                    `}} />
                  </div>
                  {children}
                </CurrencyProvider>
              </NotificationProvider>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
} 