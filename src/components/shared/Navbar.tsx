import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, User as UserIcon, X } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui';
import { classNames, initials } from '@/utils/format';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardPath =
    user?.role === 'admin'
      ? '/dashboard/admin'
      : user?.role === 'owner'
        ? '/dashboard/owner'
        : '/dashboard/customer';

  const closeMenus = () => {
    setOpen(false);
    setMenuOpen(false);
  };

  const handleSignOut = async () => {
    closeMenus();
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink-950/90 backdrop-blur-xl">
      <div className="section-pad">
        <nav className="flex h-16 items-center justify-between">

          {/* Logo */}
          <div onClick={closeMenus} className="flex items-center gap-3">
            <Logo />
          </div>

          <div className="hidden md:block" aria-hidden="true" />

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setMenuOpen((value) => !value)}
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 transition-colors hover:border-white/20"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-600 text-xs font-bold text-white">
                    {initials(user.name)}
                  </span>

                  <span className="max-w-[140px] truncate text-sm font-medium text-ink-100">
                    {user.name}
                  </span>
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />

                    <div className="absolute right-0 z-20 mt-2 w-56 animate-slideUp rounded-xl glass-strong p-2">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate(dashboardPath);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-200 hover:bg-white/10 hover:text-white"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </button>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate('/account');
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-200 hover:bg-white/10 hover:text-white"
                      >
                        <UserIcon className="h-4 w-4" />
                        Profile
                      </button>

                      <div className="my-1 h-px bg-white/10" />

                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-error-300 hover:bg-error-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Sign in
                </Button>

                <Button
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  Get started
                </Button>
              </div>
            )}

            {/* Mobile menu */}
            <button
              className="rounded-lg p-2 text-ink-200 hover:bg-white/5 hover:text-white md:hidden"
              onClick={() => setOpen((value) => !value)}
              aria-label="Menu"
              aria-expanded={open}
            >
              {open ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile navigation */}
      {open && (
        <div className="animate-slideUp border-b border-white/10 glass-strong md:hidden">
          <div className="section-pad flex flex-col gap-2 py-4">

            <button
              onClick={() => {
                closeMenus();
                navigate('/movies');
              }}
              className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-200 hover:bg-white/5"
            >
              Movies
            </button>

            <button
              onClick={() => {
                closeMenus();
                navigate('/shows');
              }}
              className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-200 hover:bg-white/5"
            >
              Showtimes
            </button>

            <div className="my-1 h-px bg-white/10" />

            {user ? (
              <>
                <button
                  onClick={() => {
                    closeMenus();
                    navigate(dashboardPath);
                  }}
                  className={classNames(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-200 hover:bg-white/5'
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </button>

                <button
                  onClick={() => {
                    closeMenus();
                    navigate('/account');
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-200 hover:bg-white/5"
                >
                  <UserIcon className="h-4 w-4" />
                  Profile
                </button>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-error-300 hover:bg-error-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    closeMenus();
                    navigate('/login');
                  }}
                >
                  Sign in
                </Button>

                <Button
                  onClick={() => {
                    closeMenus();
                    navigate('/register');
                  }}
                >
                  Get started
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}