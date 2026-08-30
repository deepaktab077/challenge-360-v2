import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

async function requireAdmin(req: VercelRequest): Promise<{ ok: boolean; error?: string; callerId?: string }> {
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
  return { ok: true, callerId: userData.user.id };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    res.status(500).json({ error: 'Server missing Supabase environment variables.' });
    return;
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) {
    res.status(403).json({ error: auth.error });
    return;
  }

  const { userId } = req.body || {};
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  if (userId === auth.callerId) {
    res.status(400).json({ error: "You can't delete your own account." });
    return;
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(200).json({ success: true });
}
