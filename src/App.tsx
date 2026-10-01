import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';

import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

import { HomePage } from '@/pages/HomePage';

import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

import { MoviesPage } from '@/pages/movies/MoviesPage';
import { MovieDetailPage } from '@/pages/movies/MovieDetailPage';

import { TheatersPage } from '@/pages/theaters/TheatersPage';
import { ShowsPage } from '@/pages/shows/ShowsPage';

import { SeatSelectionPage } from '@/pages/booking/SeatSelectionPage';
import { BookingConfirmationPage } from '@/pages/booking/BookingConfirmationPage';

import { CustomerDashboard } from '@/pages/dashboard/customer/CustomerDashboard';

import { AdminDashboard } from '@/pages/dashboard/admin/AdminDashboard';
import { AdminMoviesPage } from '@/pages/dashboard/admin/AdminMoviesPage';
import { AdminShowsPage } from '@/pages/dashboard/admin/AdminShowsPage';
import { AdminTheatersPage } from '@/pages/dashboard/admin/AdminTheatersPage';
import { AdminSecurityPage } from '@/pages/dashboard/admin/AdminSecurityPage';
import { AccountPage } from '@/pages/account/AccountPage';

import {
  AdminUsersPage,
  CustomerBookingsPage,
  CustomerHistoryPage,
} from '@/pages/dashboard/Placeholders';

import { AdminReportsPage } from '@/pages/dashboard/admin/AdminReportsPage';

import {
  ForbiddenPage,
  NotFoundPage,
} from '@/pages/errors/ErrorPages';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/movies/:id" element={<MovieDetailPage />} />
            <Route path="/theaters" element={<TheatersPage />} />
            <Route path="/shows" element={<ShowsPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AccountPage />} />
          </Route>

          <Route
            path="/booking/:showId/seats"
            element={
              <ProtectedRoute roles={['customer']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SeatSelectionPage />} />
          </Route>

          <Route
            path="/booking/confirmation"
            element={
              <ProtectedRoute roles={['customer']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<BookingConfirmationPage />} />
          </Route>

          <Route
            path="/dashboard/customer"
            element={
              <ProtectedRoute roles={['customer']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CustomerDashboard />} />
            <Route path="bookings" element={<CustomerBookingsPage />} />
            <Route path="history" element={<CustomerHistoryPage />} />
          </Route>

          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="movies" element={<AdminMoviesPage />} />
            <Route path="shows" element={<AdminShowsPage />} />
            <Route path="theaters" element={<AdminTheatersPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="security" element={<AdminSecurityPage />} />
          </Route>

          <Route
            path="/dashboard"
            element={<Navigate to="/dashboard/customer" replace />}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
