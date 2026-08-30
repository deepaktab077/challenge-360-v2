import { supabase } from '../lib/supabaseClient';

async function authedFetch(path: string, body: object): Promise<{ ok: boolean; data: any }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export async function adminCreateUser(params: {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'user';
}): Promise<{ success: boolean; message: string; userId?: string }> {
  const { ok, data } = await authedFetch('/api/admin/create-user', params);
  return {
    success: ok,
    message: ok ? 'User created' : data?.error || 'Failed to create user',
    userId: data?.userId,
  };
}

export async function adminDeleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  const { ok, data } = await authedFetch('/api/admin/delete-user', { userId });
  return { success: ok, message: ok ? 'User deleted' : data?.error || 'Failed to delete user' };
}

export async function adminResetPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const { ok, data } = await authedFetch('/api/admin/reset-password', { userId, newPassword });
  return { success: ok, message: ok ? 'Password updated' : data?.error || 'Failed to update password' };
}
