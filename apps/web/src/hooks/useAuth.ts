"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import type { User } from "@supabase/supabase-js";
import type { Member, Household } from "@/types/database";

export function useAuth() {
  const { supabase } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [household, setHousehold] = useState<(Household & { members: Member[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { setLoading(false); return; }
      setUser(u);
      const { data: m } = await supabase.from("members").select("*").eq("user_id", u.id).single();
      if (m) {
        setMember(m);
        const { data: h } = await supabase.from("households").select("*, members(*)").eq("id", m.household_id).single();
        if (h) setHousehold(h as any);
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

  return { user, member, household, loading };
}
