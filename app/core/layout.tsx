"use client";

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
      {/* Afficher le nom et prénom si l'utilisateur est chargé + bouton de déconnexion */}
      {isLoading ? (
        <div>Chargement...</div>
      ) : error ? (
        <div style={{ color: 'red', padding: '1rem', marginBottom: '1rem' }}>
          Erreur de chargement de l'utilisateur: {error.message}
          <br />
          <small>Vérifiez la console pour plus de détails</small>
        </div>
      ) : user ? (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <span>
            {user.first_name} {user.last_name}
          </span>
          <button onClick={handleLogout} disabled={logoutMutation.status === "pending"}>
            {logoutMutation.status === "pending" ? "Déconnexion..." : "Se déconnecter"}
          </button>
        </div>
      ) : null}
      {children}
    </>
  );
}