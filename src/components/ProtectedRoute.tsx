import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useFirebase } from './FirebaseProvider';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useFirebase();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
