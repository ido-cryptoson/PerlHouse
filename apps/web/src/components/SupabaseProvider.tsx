"use client";

import { createContext, useContext, useState } from "react";
import { createClient } from "@/lib/supabase";

type SupabaseContext = { supabase: ReturnType<typeof createClient> };
const Context = createContext<SupabaseContext | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  return <Context.Provider value={{ supabase }}>{children}</Context.Provider>;
}

export function useSupabase() {
  const context = useContext(Context);
  if (!context) throw new Error("useSupabase must be used inside SupabaseProvider");
  return context;
}
