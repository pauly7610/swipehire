import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { base44 } from '@/api/base44Client';

const ClerkAuthContext = createContext();

export const ClerkAuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerkAuth();
  const [base44User, setBase44User] = useState(null);
  const [isLoadingBase44, setIsLoadingBase44] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sync Clerk user with Base44
  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded) {
        return;
      }

      if (!isSignedIn || !clerkUser) {
        setBase44User(null);
        setIsLoadingBase44(false);
        return;
      }

      try {
        setIsLoadingBase44(true);
        setAuthError(null);

        // Get or create Base44 user based on Clerk user
        const userId = clerkUser.id;
        const email = clerkUser.primaryEmailAddress?.emailAddress;
        const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();

        // Check if candidate profile exists
        const candidates = await base44.entities.Candidate.filter({
          email: email
        }).catch(() => []);

        if (candidates.length > 0) {
          // User already has a profile
          setBase44User({
            id: userId,
            email: email,
            full_name: fullName,
            clerk_id: clerkUser.id,
            candidate_id: candidates[0].id
          });
        } else {
          // New user - will need onboarding
          setBase44User({
            id: userId,
            email: email,
            full_name: fullName,
            clerk_id: clerkUser.id,
            needs_onboarding: true
          });
        }

        setIsLoadingBase44(false);
      } catch (error) {
        console.error('Failed to sync with Base44:', error);
        setAuthError({
          type: 'sync_error',
          message: 'Failed to sync user data'
        });
        setIsLoadingBase44(false);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, clerkUser]);

  const logout = async () => {
    await signOut();
    setBase44User(null);
  };

  const value = {
    user: base44User,
    clerkUser,
    isAuthenticated: isSignedIn && !authError,
    isLoadingAuth: !isLoaded || isLoadingBase44,
    authError,
    logout,
    // Helper to get LinkedIn data if available
    getLinkedInData: () => {
      if (!clerkUser) return null;

      // Check if user signed in with LinkedIn
      const linkedInAccount = clerkUser.externalAccounts?.find(
        account => account.provider === 'oauth_linkedin' || account.provider === 'oauth_linkedin_oidc'
      );

      if (linkedInAccount) {
        return {
          hasLinkedIn: true,
          linkedInId: linkedInAccount.externalId,
          // Additional LinkedIn data would come from verification object
          profileData: linkedInAccount.verification?.externalVerificationRedirectURL || null
        };
      }

      return { hasLinkedIn: false };
    }
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
