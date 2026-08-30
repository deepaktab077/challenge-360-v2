import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// This function runs server-side only. It uses the SERVICE ROLE key, which
// must NEVER be exposed to the browser — only set it here as a Vercel
// Environment Variable (not prefixed with VITE_).

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

async function requireAdmin(req: VercelRequest): Promise<{ ok: boolean; error?: string }> {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return { ok: false, error: 'Missing Authorization token' };

  const anonClient = createClient(supabaseUrl, anonKey);
  const { data: userData, error: userErr } = await anonClient.auth.getUser(token);
  if (userErr || !userData?.user) return { ok: false, error: 'Invalid session' };

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile, error: profileErr } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (profileErr || !profile || profile.role !== 'admin') {
    return { ok: false, error: 'Admin privileges required' };
  }
  return { ok: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    res.status(500).json({
      error:
        'Server missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_ANON_KEY environment variables.',
    });
    return;
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) {
    res.status(403).json({ error: auth.error });
    return;
  }

  const { email, password, fullName, role } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || email.split('@')[0], role: role === 'admin' ? 'admin' : 'user' },
  });

  if (error || !data?.user) {
    res.status(400).json({ error: error?.message || 'Failed to create user' });
    return;
  }

  // The DB trigger (handle_new_user) creates the profile row automatically.
  // If a non-default role was requested, make sure it's applied.
  if (role === 'admin') {
    await adminClient.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
  }

  res.status(200).json({ success: true, userId: data.user.id });
}
