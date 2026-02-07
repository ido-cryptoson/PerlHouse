"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { useAuth } from "@/hooks/useAuth";
import type { Task } from "@/types/database";

export function useTasks() {
  const { supabase } = useSupabase();
  const { member } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const householdId = member?.household_id;

  const fetchTasks = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    const { data, error: e } = await supabase.from("tasks").select("*, owner:members!tasks_owner_id_fkey(id, name, avatar_url)").eq("household_id", householdId).neq("status", "rejected").order("created_at", { ascending: false });
    if (e) setError(e.message);
    else setTasks((data ?? []).map((r: any) => ({ ...r, owner_name: r.owner?.name ?? null, owner_avatar_url: r.owner?.avatar_url ?? null })));
    setLoading(false);
  }, [supabase, householdId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (!householdId) return;
    const channel = supabase.channel(`tasks:${householdId}`).on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `household_id=eq.${householdId}` }, (payload) => {
      if (payload.eventType === "INSERT") setTasks((p) => [payload.new as Task, ...p]);
      else if (payload.eventType === "UPDATE") { const u = payload.new as Task; setTasks((p) => p.map((t) => t.id === u.id ? { ...t, ...u } : t)); }
      else if (payload.eventType === "DELETE") setTasks((p) => p.filter((t) => t.id !== (payload.old as any).id));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, householdId]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const { owner_name, owner_avatar_url, ...dbUpdates } = updates;
    console.log('[useTasks] updateTask called:', id, dbUpdates);
    const { data, error: e, count } = await supabase.from("tasks").update({ ...dbUpdates, updated_at: new Date().toISOString() } as any).eq("id", id).select();
    console.log('[useTasks] updateTask result:', { data, error: e, count });
    if (e) { console.error('[useTasks] updateTask error:', e); setError(e.message); }
  }, [supabase]);

  const deleteTask = useCallback(async (id: string) => {
    const { error: e } = await supabase.from("tasks").delete().eq("id" as any, id);
    if (e) setError(e.message);
  }, [supabase]);

  return { tasks, loading, error, updateTask, deleteTask, refetch: fetchTasks };
}
