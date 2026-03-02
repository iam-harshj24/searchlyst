import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AdminProtectedRoute({ children }) {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/Login" replace state={{ from: 'admin', message: 'Admin access required. Please log in with admin credentials.' }} />;
  }

  return children;
}
