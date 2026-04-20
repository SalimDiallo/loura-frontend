"use client";

import AppHeader from '@/components/AppHeader';
import { useCurrentUser } from '@/lib/hooks/auth/useCurrentUser';
import { useLogout } from '@/lib/hooks/auth/useLogout';
import React from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user, isLoading, error } = useCurrentUser();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Debug: log l'état du hook
  React.useEffect(() => {
    console.log('[Core Layout] useCurrentUser state:', {
      user: user ? `${user.first_name} ${user.last_name}` : null,
      isLoading,
      error: error?.message,
      hasToken: typeof window !== 'undefined' ? !!localStorage.getItem('loura_access_token') : false
    });
  }, [user, isLoading, error]);


  return (
    <>
    <AppHeader />
      {children}
    </>
  );
}