"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import type { User } from "@supabase/supabase-js";
import type { Member, Household } from "@/types/database";

export function useAuth() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [household, setHousehold] = useState<(Household & { members: Member[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      console.log('[useAuth] user:', u?.id, u?.email);
      if (!u) { setLoading(false); return; }
      setUser(u);
      const { data: m, error: mErr } = await supabase.from("members").select("*").eq("user_id", u.id).single();
      console.log('[useAuth] member:', m, 'error:', mErr);
      if (m) {
        setMember(m as Member);
        const { data: h, error: hErr } = await supabase.from("households").select("*, members(*)").eq("id", m.household_id).single();
        console.log('[useAuth] household:', h, 'error:', hErr);
        if (h) setHousehold(h as Household & { members: Member[] });
      }
      setLoading(false);
    };
    fetchProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
      if (!s?.user) { setMember(null); setHousehold(null); }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [supabase, router]);

  return { user, member, household, loading, signOut };
}
