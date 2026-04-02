import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminPanel from '@/pages/AdminPanel';
import AdminLayout from '@/pages/admin/AdminLayout';
import BulkUploadPage from '@/pages/admin/BulkUploadPage';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import DocsHub from '@/pages/DocsHub';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const PUBLIC_PATH_PREFIXES = ['/Login', '/docs'];

const AuthenticatedApp = () => {
  const location = useLocation();
  const isPublicPath = PUBLIC_PATH_PREFIXES.some(
    (p) => location.pathname === p || location.pathname.startsWith(`${p}/`),
  );
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  // Show loading spinner while checking app public settings or auth (not on public routes)
  if (!isPublicPath && (isLoadingPublicSettings || isLoadingAuth)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors (skip for public routes e.g. /docs)
  if (authError && !isPublicPath) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login safely during render
      return <Navigate to="/Login" replace />;
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
      
      {/* Login Route - Public */}
      <Route path="/Login" element={<Login />} />

      {/* Documentation PDFs hub - Public */}
      <Route path="/docs" element={<DocsHub />} />
      
      {/* Dashboard Route - Protected */}
      <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      
      {/* Admin Panel Routes - Admin only */}
      <Route
        path="/AdminPanel"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<AdminPanel />} />
        <Route path="bulk-upload" element={<BulkUploadPage />} />
      </Route>
      
      {/* Other Pages */}
      {Object.entries(Pages).filter(([path]) => path !== 'AdminPanel' && path !== 'Login' && path !== 'Dashboard').map(([path, Page]) => (
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
