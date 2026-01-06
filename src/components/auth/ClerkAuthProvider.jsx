import React, { createContext, useContext } from 'react';

const ClerkAuthContext = createContext();

export const ClerkAuthProvider = ({ children }) => {
  // No auth - just provide demo user
  const value = {
    user: { id: 'demo-user', email: 'demo@swipehire.com', full_name: 'Demo User' },
    clerkUser: null,
    isAuthenticated: true,
    isLoadingAuth: false,
    authError: null,
    logout: () => {},
    getLinkedInData: () => ({ hasLinkedIn: false })
  };

  return (
    <ClerkAuthContext.Provider value={value}>
      {children}
    </ClerkAuthContext.Provider>
  );
};

export const useClerkAuth = () => {
  const context = useContext(ClerkAuthContext);
  if (!context) {
    throw new Error('useClerkAuth must be used within ClerkAuthProvider');
  }
  return context;
};