import React from 'react';

export const metadata = {
  title: 'Login - SubTracker',
  description: 'Sign in to your SubTracker account to manage your subscriptions',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 