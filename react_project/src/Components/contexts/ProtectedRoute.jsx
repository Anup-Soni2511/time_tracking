// src/Components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();  // Get the authentication state

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If the user is authenticated, allow access to the route
  return children;
};

export default ProtectedRoute;
