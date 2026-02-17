import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white/10 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/Dashboard" replace />;
  }

  return children;
}
