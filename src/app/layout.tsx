'use client';

import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import NotificationProvider from '@/contexts/NotificationContext';

const inter = Inter({ subsets: ['latin'] });

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
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 