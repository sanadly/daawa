import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { lang } = useParams<{ lang: string }>();

  // Show loading while checking authentication
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={`/${lang || 'en'}/login`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute; 