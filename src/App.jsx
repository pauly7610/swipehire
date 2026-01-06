import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { ClerkProvider, SignIn, SignUp } from '@clerk/clerk-react';
import { ClerkAuthProvider, useClerkAuth } from '@/components/auth/ClerkAuthProvider';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY. Please add it to your .env file');
}

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError, isAuthenticated, user } = useClerkAuth();

  // Show loading spinner while checking auth
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show sign-in
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
              SwipeHire
            </h1>
            <p className="text-gray-600">Find your dream job</p>
          </div>
          <SignIn
            routing="path"
            path="/sign-in"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-gradient-to-r from-pink-600 to-orange-600',
                card: 'shadow-xl'
              }
            }}
          />
        </div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/sign-in/*" element={
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50">
          <SignIn routing="path" path="/sign-in" />
        </div>
      } />
      <Route path="/sign-up/*" element={
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50">
          <SignUp routing="path" path="/sign-up" />
        </div>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Configuration Error</h2>
          <p className="text-gray-600">
            Missing Clerk publishable key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ClerkAuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <VisualEditAgent />
        </QueryClientProvider>
      </ClerkAuthProvider>
    </ClerkProvider>
  );
}

export default App
