import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';
import { Breadcrumbs } from './Breadcrumbs';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../shared/LoadingSpinner';
import LoginPage from '../../pages/LoginPage';

export default function Layout() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-primary-900 font-sans overflow-x-hidden">
      <NavBar memberName={user.name} isAdmin={user.isAdmin} />
      {/* Offset for fixed navbar height */}
      <div className="pt-14 sm:pt-16">
        <Breadcrumbs />
        <main className="container mx-auto px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
