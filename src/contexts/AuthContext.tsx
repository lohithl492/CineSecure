import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';
import { STORAGE_KEYS, APP_CONFIG } from '@/constants/config';
import { logSecurityEvent } from '@/utils/securityLog';
import type { AuthStatus, User, UserRole } from '@/types';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;

  /**
   * Signs in the user and returns the fully loaded application user.
   * Returning the user allows the login page to redirect based on role
   * without waiting for React state to update.
   */
  signIn: (email: string, password: string) => Promise<User>;

  signUp: (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<void>;

  signOut: () => Promise<void>;

  updateProfile: (
    patch: Partial<Pick<User, 'name' | 'phone' | 'avatarUrl'>>
  ) => Promise<void>;

  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PROFILE_RETRIES = 3;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================================================
   Local Storage
============================================================ */

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);

    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function persistUser(user: User) {
  localStorage.setItem(
    STORAGE_KEYS.user,
    JSON.stringify(user)
  );
}

function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEYS.user);
}

/* ============================================================
   Auth Provider
============================================================ */

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(
    readStoredUser
  );

  /*
   * Always start in loading state.

   * This prevents protected routes from rendering before
   * Supabase has finished restoring the current session.
   */
  const [status, setStatus] =
    useState<AuthStatus>('loading');

  /*
   * Each authentication/profile operation gets a unique number.

   * If an older async operation finishes after a newer operation,
   * its result is ignored. This prevents stale roles such as
   * "customer" from replacing the correct "admin" role.
   */
  const authOperationRef = useRef(0);

  /* ==========================================================
     Refresh Application User
  ========================================================== */

  const refreshUser = useCallback(
    async (
      authUser: import('@supabase/supabase-js').User
    ): Promise<User | null> => {
      const operation =
        ++authOperationRef.current;

      const mapped =
        await loadUserProfileWithRetry(authUser);

      /*
       * Ignore stale asynchronous results.
       */
      if (
        operation !==
        authOperationRef.current
      ) {
        return null;
      }

      setUser(mapped);
      setStatus('authenticated');
      persistUser(mapped);

      return mapped;
    },
    []
  );

  /* ==========================================================
     Initialize Authentication
  ========================================================== */

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      const initialization =
        ++authOperationRef.current;

      setStatus('loading');

      const {
        data,
        error,
      } = await supabase.auth.getSession();

      if (
        !active ||
        initialization !==
          authOperationRef.current
      ) {
        return;
      }

      if (error) {
        console.error(
          'Unable to restore session:',
          error
        );

        authOperationRef.current += 1;

        setUser(null);
        setStatus('unauthenticated');
        clearStoredUser();

        return;
      }

      /*
       * No existing Supabase session.
       */
      if (!data.session?.user) {
        setUser(null);
        setStatus('unauthenticated');
        clearStoredUser();

        return;
      }

      try {
        const mapped =
          await loadUserProfileWithRetry(
            data.session.user
          );

        if (
          !active ||
          initialization !==
            authOperationRef.current
        ) {
          return;
        }

        setUser(mapped);
        setStatus('authenticated');
        persistUser(mapped);
      } catch (profileError) {
        if (!active) {
          return;
        }

        console.error(
          'Unable to load user profile:',
          profileError
        );

        authOperationRef.current += 1;

        setUser(null);
        setStatus('unauthenticated');
        clearStoredUser();
      }
    };

    void initializeAuth();

    /* ========================================================
       Supabase Auth State Listener
    ======================================================== */

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          /*
           * INITIAL_SESSION is handled by initializeAuth().
           */
          if (
            event === 'INITIAL_SESSION'
          ) {
            return;
          }

          /*
           * SIGNED_OUT must immediately clear
           * application authentication state.
           */
          if (
            event === 'SIGNED_OUT' ||
            !session?.user
          ) {
            authOperationRef.current += 1;

            setUser(null);
            setStatus('unauthenticated');
            clearStoredUser();

            return;
          }

          /*
           * SIGNED_IN is intentionally handled by
           * signIn()/signUp().

           * This prevents two profile requests from
           * racing immediately after login.
           */
          if (event === 'SIGNED_IN') {
            return;
          }

          /*
           * Token refresh does not require another
           * profile request.
           */
          if (
            event === 'TOKEN_REFRESHED'
          ) {
            return;
          }

          /*
           * When account metadata changes, reload
           * the application profile.
           */
          if (
            event === 'USER_UPDATED'
          ) {
            setStatus('loading');

            void refreshUser(
              session.user
            ).catch((profileError) => {
              console.error(
                'Unable to refresh user profile:',
                profileError
              );

              authOperationRef.current += 1;

              setUser(null);
              setStatus(
                'unauthenticated'
              );
              clearStoredUser();
            });
          }
        }
      );

    return () => {
      active = false;

      authOperationRef.current += 1;

      subscription.unsubscribe();
    };
  }, [refreshUser]);

  /* ==========================================================
     SIGN UP
  ========================================================== */

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      role: UserRole
    ) => {
      setStatus('loading');
      setUser(null);
      clearStoredUser();

      /*
       * Admin accounts cannot be created through
       * public registration.
       */
      const safeRole: UserRole =
        role === 'admin'
          ? 'customer'
          : role;

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              display_name: name,
              role: safeRole,
            },
          },
        });

      if (error) {
        setStatus('unauthenticated');

        logSecurityEvent(
          'failed_login',
          `Registration failed for ${email}`,
          'medium',
          {
            reason: error.message,
          }
        );

        throw error;
      }

      if (data.user) {
        logSecurityEvent(
          'booking_created',
          `New ${safeRole} registered: ${email}`,
          'low',
          {
            userId: data.user.id,
          }
        );
      }

      /*
       * If Supabase immediately creates a session,
       * load the complete application profile.
       */
      if (data.session?.user) {
        try {
          const mapped =
            await refreshUser(
              data.session.user
            );

          if (!mapped) {
            throw new Error(
              'Unable to load your account profile. Please try again.'
            );
          }
        } catch (profileError) {
          console.error(
            'Unable to load new user profile:',
            profileError
          );

          setUser(null);
          setStatus('unauthenticated');
          clearStoredUser();

          throw profileError;
        }
      } else {
        /*
         * Email confirmation may be required.
         */
        setUser(null);
        setStatus('unauthenticated');
      }
    },
    [refreshUser]
  );

  /* ==========================================================
     SIGN IN
  ========================================================== */

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<User> => {
      setStatus('loading');
      setUser(null);
      clearStoredUser();

      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        setStatus('unauthenticated');

        logSecurityEvent(
          'failed_login',
          `Failed login attempt for ${email}`,
          'high',
          {
            reason: error.message,
          }
        );

        throw error;
      }

      if (!data.user) {
        setStatus('unauthenticated');

        throw new Error(
          'Unable to establish your session. Please try again.'
        );
      }

      try {
        /*
         * IMPORTANT:
         * refreshUser returns the complete application
         * user including the database role.
         */
        const mapped =
          await refreshUser(
            data.user
          );

        if (!mapped) {
          throw new Error(
            'Unable to load your account profile. Please try again.'
          );
        }

        logSecurityEvent(
          'booking_created',
          `User signed in: ${email}`,
          'low',
          {
            userId: data.user.id,
            role: mapped.role,
          }
        );

        /*
         * IMPORTANT:
         * Return the actual user immediately.

         * LoginPage can now safely do:
         *
         * const signedInUser = await signIn(...);
         *
         * and redirect using signedInUser.role.
         */
        return mapped;
      } catch (profileError) {
        console.error(
          'Login profile loading failed:',
          profileError
        );

        authOperationRef.current += 1;

        setUser(null);
        setStatus('unauthenticated');
        clearStoredUser();

        await supabase.auth.signOut();

        throw new Error(
          'Unable to load your account. Please try signing in again.'
        );
      }
    },
    [refreshUser]
  );

  /* ==========================================================
     SIGN OUT
  ========================================================== */

  const signOut = useCallback(
    async () => {
      authOperationRef.current += 1;

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setStatus('unauthenticated');
      clearStoredUser();

      logSecurityEvent(
        'booking_created',
        'User signed out',
        'low'
      );
    },
    []
  );

  /* ==========================================================
     UPDATE PROFILE
  ========================================================== */

  const updateProfile = useCallback(
    async (
      patch: Partial<
        Pick<
          User,
          'name' | 'phone' | 'avatarUrl'
        >
      >
    ) => {
      if (!user) {
        return;
      }

      const {
        error: authError,
      } =
        await supabase.auth.updateUser({
          data: {
            name:
              patch.name ??
              user.name,

            display_name:
              patch.name ??
              user.name,

            phone:
              patch.phone ??
              user.phone,

            avatar_url:
              patch.avatarUrl ??
              user.avatarUrl,
          },
        });

      if (authError) {
        throw authError;
      }

      const {
        error: profileError,
      } =
        await supabase
          .from('profiles')
          .update({
            full_name:
              patch.name ??
              user.name,
          })
          .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      const next: User = {
        ...user,
        ...patch,
      };

      setUser(next);
      persistUser(next);
    },
    [user]
  );

  /* ==========================================================
     ROLE CHECK
  ========================================================== */

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      return user
        ? roles.includes(user.role)
        : false;
    },
    [user]
  );

  /* ==========================================================
     CONTEXT VALUE
  ========================================================== */

  const value = useMemo(
    () => ({
      user,
      status,
      signIn,
      signUp,
      signOut,
      updateProfile,
      hasRole,
    }),
    [
      user,
      status,
      signIn,
      signUp,
      signOut,
      updateProfile,
      hasRole,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* ============================================================
   useAuth Hook
============================================================ */

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      `${APP_CONFIG.name}: useAuth must be used within AuthProvider`
    );
  }

  return ctx;
}

/* ============================================================
   Load User Profile
============================================================ */

async function loadUserProfileWithRetry(
  authUser: import('@supabase/supabase-js').User
): Promise<User> {
  let lastError: unknown = null;

  for (
    let attempt = 1;
    attempt <= PROFILE_RETRIES;
    attempt += 1
  ) {
    const {
      data: profile,
      error,
    } =
      await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

    if (!error) {
      /*
       * A profile should normally exist for every
       * authenticated application user.

       * If it doesn't, fall back to Supabase metadata
       * rather than crashing the application.
       */
      if (!profile) {
        return mapSupabaseUser(
          authUser
        );
      }

      /*
       * DATABASE PROFILE ROLE HAS PRIORITY.

       * This is important for admin accounts because
       * the role in public.profiles is authoritative
       * for application RBAC.
       */
      return {
        id: authUser.id,

        email:
          authUser.email ??
          profile.email ??
          '',

        name:
          profile.full_name ??
          authUser.user_metadata?.name ??
          authUser.email?.split('@')[0] ??
          'User',

        role:
          (profile.role as UserRole) ??
          (authUser.user_metadata?.role as UserRole) ??
          'customer',

        phone:
          authUser.user_metadata?.phone ??
          null,

        avatarUrl:
          authUser.user_metadata?.avatar_url ??
          null,

        createdAt:
          profile.created_at ??
          authUser.created_at,
      };
    }

    lastError = error;

    if (
      attempt <
      PROFILE_RETRIES
    ) {
      await wait(
        250 * attempt
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        'Unable to load user profile.'
      );
}

/* ============================================================
   Fallback User Mapping
============================================================ */

function mapSupabaseUser(
  u: import('@supabase/supabase-js').User
): User {
  const meta =
    u.user_metadata ?? {};

  return {
    id: u.id,

    email:
      u.email ?? '',

    name:
      meta.name ??
      meta.display_name ??
      u.email?.split('@')[0] ??
      'User',

    role:
      (meta.role as UserRole) ??
      'customer',

    phone:
      meta.phone ??
      null,

    avatarUrl:
      meta.avatar_url ??
      null,

    createdAt:
      u.created_at,
  };
}