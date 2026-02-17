import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminPanel from '@/pages/AdminPanel';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import ForgotPassword from '@/pages/ForgotPassword';
import Dashboard from '@/pages/Dashboard';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Wrapper for public-only routes (Login, Signup) -- redirects authenticated users to Dashboard
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-white/10 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to="/Dashboard" replace />;
  }
  return children;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-white/10 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors -- only for non-public routes
  // We no longer auto-redirect on auth_required since public pages should be accessible
  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      
      {/* Auth Routes - Public Only (redirect if already logged in) */}
      <Route path="/Login" element={
        <PublicOnlyRoute>
          <Login />
        </PublicOnlyRoute>
      } />
      <Route path="/Signup" element={
        <PublicOnlyRoute>
          <Signup />
        </PublicOnlyRoute>
      } />
      <Route path="/ForgotPassword" element={
        <PublicOnlyRoute>
          <ForgotPassword />
        </PublicOnlyRoute>
      } />
      
      {/* Dashboard Routes - Protected (URL-based tabs for refresh persistence) */}
      <Route 
        path="/Dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/Dashboard/:tab" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      {/* Admin Panel Route - Admin only */}
      <Route 
        path="/AdminPanel" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminPanel />
          </ProtectedRoute>
        } 
      />
      
      {/* Other Pages (public: AboutUs, Blogs, Home, etc.) */}
      {Object.entries(Pages).filter(([path]) => 
        path !== 'AdminPanel' && path !== 'Login' && path !== 'Dashboard' && path !== 'Signup' && path !== 'ForgotPassword'
      ).map(([path, Page]) => (
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
      
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthProvider>
          <NavigationTracker />
          <AuthenticatedApp />
        </AuthProvider>
        <Toaster />
        <SonnerToaster position="bottom-right" richColors closeButton />
      </Router>
    </QueryClientProvider>
  )
}

export default App
