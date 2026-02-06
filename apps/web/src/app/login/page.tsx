"use client";

import { useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";

type AuthMode = "magic-link" | "invite-code";

export default function LoginPage() {
  const { supabase } = useSupabase();
  const [mode, setMode] = useState<AuthMode>("magic-link");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/tasks` },
    });
    if (authError) setError("שגיאה בשליחת הקישור. נסו שוב.");
    else setMessage("קישור כניסה נשלח למייל שלך!");
    setLoading(false);
  };

  const handleInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    const { data, error: rpcError } = await supabase.rpc("redeem_invite_code", { code: inviteCode });
    if (rpcError || !data) setError("קוד הזמנה לא תקין. נסו שוב.");
    else { setMessage("הצטרפת למשק הבית בהצלחה!"); window.location.href = "/tasks"; }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-to-b from-amber-50 to-stone-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200/50 mb-4">
            <span className="text-4xl">🏠</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-800">בית</h1>
          <p className="text-stone-500 mt-2">ניהול משק בית חכם לזוגות</p>
        </div>

        <div className="flex rounded-xl bg-stone-100 p-1 mb-6">
          <button onClick={() => setMode("magic-link")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === "magic-link" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>קישור קסם</button>
          <button onClick={() => setMode("invite-code")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === "invite-code" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>קוד הזמנה</button>
        </div>

        {mode === "magic-link" && (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1.5">כתובת אימייל</label>
              <input id="email" type="email" dir="auto" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 text-white font-semibold shadow-md shadow-amber-200/50 hover:shadow-lg transition-all disabled:opacity-50">{loading ? "שולח..." : "שלח קישור כניסה"}</button>
          </form>
        )}

        {mode === "invite-code" && (
          <form onSubmit={handleInviteCode} className="space-y-4">
            <div>
              <label htmlFor="invite-code" className="block text-sm font-medium text-stone-700 mb-1.5">הכנס קוד הזמנה</label>
              <input id="invite-code" type="text" dir="auto" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="XXXX-XXXX" required className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 text-center text-lg tracking-widest placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 text-white font-semibold shadow-md shadow-amber-200/50 hover:shadow-lg transition-all disabled:opacity-50">{loading ? "בודק..." : "הצטרף למשק בית"}</button>
          </form>
        )}

        {message && <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm text-center">{message}</div>}
        {error && <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm text-center">{error}</div>}
      </div>
    </div>
  );
}
