import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Member, TaskInsert } from '../types';

let supabase: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return supabase;
}

export async function createTask(task: TaskInsert): Promise<{ id: string } | null> {
  const { data, error } = await db().from('tasks').insert(task).select('id').single();
  if (error) { console.error('[Supabase] Create task error:', error); throw error; }
  return data;
}

export async function getHouseholdMembers(householdId: string): Promise<Member[]> {
  const { data, error } = await db().from('members').select('*').eq('household_id', householdId);
  if (error) { console.error('[Supabase] Fetch members error:', error); throw error; }
  return (data as Member[]) ?? [];
}

export async function getMemberByPhone(phone: string): Promise<Member | null> {
  const normalized = phone.replace(/[\s\-+]/g, '');
  const { data, error } = await db().from('members').select('*').eq('phone', normalized).maybeSingle();
  if (error) { console.error('[Supabase] Fetch member error:', error); throw error; }
  return (data as Member) ?? null;
}

export async function updateTaskCalendarEventId(taskId: string, calendarEventId: string): Promise<void> {
  const { error } = await db().from('tasks').update({ calendar_event_id: calendarEventId }).eq('id', taskId);
  if (error) { console.error('[Supabase] Update calendar_event_id error:', error); throw error; }
}

// Warm up the Supabase connection on startup
export async function warmupSupabase(): Promise<void> {
  try {
    await db().from('households').select('id').limit(1);
    console.log('[Supabase] Connection warmed up');
  } catch (err) {
    console.error('[Supabase] Warmup failed:', err);
  }
}
