import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  Users,
  ShieldAlert,
  Building2,
  CalendarDays,
  Ticket,
  BarChart3,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/shared/Logo';
import { classNames, initials } from '@/utils/format';
import type { UserRole } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const NAV: NavItem[] = [
  // Admin
  { to: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard, roles: ['admin'] },
  { to: '/dashboard/admin/users', label: 'Users', icon: Users, roles: ['admin'] },
  { to: '/dashboard/admin/movies', label: 'Movies', icon: Film, roles: ['admin'] },
  { to: '/dashboard/admin/theaters', label: 'Theaters', icon: Building2, roles: ['admin'] },
  { to: '/dashboard/admin/shows', label: 'Shows', icon: CalendarDays, roles: ['admin'] },
  { to: '/dashboard/admin/reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
  { to: '/dashboard/admin/security', label: 'Security', icon: ShieldAlert, roles: ['admin'] },

  // Theater owner
  { to: '/dashboard/owner', label: 'Overview', icon: LayoutDashboard, roles: ['owner'] },
  { to: '/dashboard/owner/theaters', label: 'Theaters', icon: Building2, roles: ['owner'] },
  { to: '/dashboard/owner/shows', label: 'Shows', icon: CalendarDays, roles: ['owner'] },
  { to: '/dashboard/owner/bookings', label: 'Bookings', icon: Ticket, roles: ['owner'] },

  // Customer
  { to: '/dashboard/customer', label: 'Overview', icon: LayoutDashboard, roles: ['customer'] },
  { to: '/dashboard/customer/bookings', label: 'My Bookings', icon: Ticket, roles: ['customer'] },
  { to: '/dashboard/customer/history', label: 'History', icon: BarChart3, roles: ['customer'] },
];

const roleLabel: Record<UserRole, string> = {
  customer: 'Customer',
  owner: 'Theater Owner',
  admin: 'Administrator',
};

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((item) => user && item.roles.includes(user.role));

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-ink-950">
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/10 bg-ink-900/50 backdrop-blur-xl">
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <Logo />
        </div>

        <div className="px-3 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-600 text-xs font-bold text-white">
              {user ? initials(user.name) : 'U'}
            </span>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-100 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-ink-500">
                {user ? roleLabel[user.role] : ''}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            to="/account"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <UserIcon className="h-4 w-4" />
            Profile
          </Link>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-error-300 hover:bg-error-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute left-0 top-0 h-full w-72 bg-ink-900 border-r border-white/10 flex flex-col animate-slideInRight">
            <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
              <Logo />

              <button
                onClick={() => setOpen(false)}
                className="text-ink-400 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {items.map((item) => (
                <SidebarLink
                  key={item.to}
                  item={item}
                  onClick={() => setOpen(false)}
                />
              ))}
            </nav>

            <div className="p-3 border-t border-white/10">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-error-300 hover:bg-error-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-white/10 bg-ink-900/60 backdrop-blur-xl px-4 sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden text-ink-300 hover:text-white p-2 rounded-lg hover:bg-white/5"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block">
            <p className="text-sm text-ink-400">
              Welcome back,{' '}
              <span className="text-ink-100 font-medium">{user?.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-success-500/15 px-2.5 py-1 text-xs font-semibold text-success-300 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" />
              Secure session
            </span>
          </div>
        </header>

        <main className="flex-1 section-pad py-6 sm:py-8">
          <div className="container-max">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  onClick,
}: {
  item: NavItem;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={item.to}
      end={
        item.to === '/dashboard/admin' ||
        item.to === '/dashboard/owner' ||
        item.to === '/dashboard/customer'
      }
      onClick={onClick}
      className={({ isActive }) =>
        classNames(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary-600/15 text-primary-300 border border-primary-500/20'
            : 'text-ink-300 hover:bg-white/5 hover:text-white border border-transparent',
        )
      }
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </NavLink>
  );
}
