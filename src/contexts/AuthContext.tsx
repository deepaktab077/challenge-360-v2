import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { fetchMyProfile, fetchAllProfiles } from '../services/dataService';

interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  allProfiles: UserProfile[];
  refreshProfiles: () => Promise<void>;
  /** The user id whose data should currently be shown/edited (self, or another
   * user the admin has chosen to view). */
  actingUserId: string | null;
  actingProfile: UserProfile | null;
  setActingUserId: (id: string | null) => void;
  /** True when the person is viewing someone else's data without edit
   * permission (i.e. not admin, and not viewing their own profile). */
  isViewingReadOnly: boolean;
  refreshMyProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    teamId: string | null
   ) => Promise<{ error: string | null }>;
  isPasswordRecovery: boolean;
  clearPasswordRecovery: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingUserId, setActingUserIdState] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(
    typeof window !== 'undefined' && window.location.hash.includes('type=recovery')
  );

  const loadProfile = useCallback(async (userId: string) => {
    const p = await fetchMyProfile(userId);
    setProfile(p);
    // Everyone can read everyone's profiles (name/team/role) — RLS already
    // allows this — needed so any user can see who's who on the leaderboard
    // and view (read-only) another participant's scorecard.
    const all = await fetchAllProfiles();
    setAllProfiles(all);
    setActingUserIdState((prev) => prev || userId);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
        setAllProfiles([]);
        setActingUserIdState(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const refreshProfiles = useCallback(async () => {
    const all = await fetchAllProfiles();
    setAllProfiles(all);
  }, []);

  /** Refetches the signed-in user's own profile — call this after anything
   * that changes it (team assignment, name edit) so UI gated on `profile`
   * (like the "pick your team" welcome modal) updates immediately instead
   * of only after a manual page refresh. */
  const refreshMyProfile = useCallback(async () => {
    if (!session?.user) return;
    const p = await fetchMyProfile(session.user.id);
    setProfile(p);
    setAllProfiles((prev) => (p ? prev.map((existing) => (existing.id === p.id ? p : existing)) : prev));
  }, [session]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, teamId: string | null) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, team_id: teamId || '' },
        },
      });
      if (error) {
        // Never impose a client-side signup cooldown. If Supabase returns a
        // 429/rate-limit response, surface the server-side error instead of
        // starting a local countdown that can get out of sync with Supabase.
        const status = (error as { status?: number }).status;
        if (status === 429 || /rate limit|too many requests|too many signup/i.test(error.message)) {
          return {
            error: 'Supabase has temporarily rate-limited signup requests. No signup countdown is enforced by this app. Check Supabase Authentication → Rate Limits and make sure Confirm email is OFF for password-based signup.',
          };
        }
        return { error: error.message };
      }
      if (!data.session) {
        return {
          error: 'Signup succeeded but no session was created. Disable "Confirm email" in Supabase Authentication → Providers → Email to allow immediate login.',
        };
      }
      return { error: null };
    },
    []
  );

  const clearPasswordRecovery = useCallback(() => {
    setIsPasswordRecovery(false);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const actingProfile = allProfiles.find((p) => p.id === actingUserId) || profile;
  const isViewingReadOnly = Boolean(
    actingUserId && profile && actingUserId !== profile.id && profile.role !== 'admin'
  );

  const value: AuthContextValue = {
    session,
    profile,
    isAdmin: profile?.role === 'admin',
    loading,
    allProfiles,
    refreshProfiles,
    actingUserId,
    actingProfile,
    setActingUserId: setActingUserIdState,
    isViewingReadOnly,
    refreshMyProfile,
    signIn,
    signUp,
    isPasswordRecovery,
    clearPasswordRecovery,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
