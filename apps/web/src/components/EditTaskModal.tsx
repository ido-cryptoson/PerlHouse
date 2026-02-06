"use client";

import { useState, useEffect } from "react";
import type { Task } from "@/types/database";
import { useAuth } from "@/hooks/useAuth";

const CATEGORIES = [
  { value: "בית", label: "בית", icon: "🏠" }, { value: "ילדים", label: "ילדים", icon: "👶" },
  { value: "כספים", label: "כספים", icon: "💰" }, { value: "בריאות", label: "בריאות", icon: "🏥" },
  { value: "קניות", label: "קניות", icon: "🛒" }, { value: "רכב", label: "רכב", icon: "🚗" },
  { value: "כללי", label: "כללי", icon: "📌" },
];

const ICONS = ["📌", "🧹", "🍳", "🛒", "🔧", "💰", "👶", "🐾", "🌱", "👕", "📦", "🏥", "📞", "🚗", "🏠", "💊", "📅", "🎂", "✈️", "🎓"];

export default function EditTaskModal({ task, onSave, onClose }: { task: Task; onSave: (data: Partial<Task>) => void; onClose: () => void }) {
  const { household } = useAuth();
  const [title, setTitle] = useState(task.title);
  const [ownerId, setOwnerId] = useState(task.owner_id ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [dueTime, setDueTime] = useState(task.due_time ?? "");
  const [category, setCategory] = useState(task.category ?? "כללי");
  const [icon, setIcon] = useState(task.icon ?? "📌");
  const [showIcons, setShowIcons] = useState(false);

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const members = household?.members ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[90dvh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-3xl z-10 pt-3 pb-2"><div className="w-10 h-1 bg-stone-300 rounded-full mx-auto" /></div>
        <div className="px-6 pb-8">
          <h2 className="text-lg font-bold text-stone-800 mb-5">עריכת משימה</h2>
          <div className="flex items-start gap-3 mb-5">
            <button onClick={() => setShowIcons(!showIcons)} className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-50 border-2 border-dashed border-amber-200 flex items-center justify-center text-2xl hover:bg-amber-100">{icon}</button>
            <div className="flex-1">
              <label className="block text-sm font-medium text-stone-600 mb-1">כותרת</label>
              <input dir="auto" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          </div>
          {showIcons && (
            <div className="mb-5 p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div className="grid grid-cols-10 gap-1">{ICONS.map((e) => (<button key={e} onClick={() => { setIcon(e); setShowIcons(false); }} className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-amber-100 ${icon === e ? "bg-amber-200 ring-2 ring-amber-400" : ""}`}>{e}</button>))}</div>
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-600 mb-1">אחראי/ת</label>
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">לא הוקצה</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><label className="block text-sm font-medium text-stone-600 mb-1">תאריך יעד</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-400" /></div>
            <div><label className="block text-sm font-medium text-stone-600 mb-1">שעה</label><input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-400" /></div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-600 mb-1">קטגוריה</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50">ביטול</button>
            <button onClick={() => onSave({ title, owner_id: ownerId || null, due_date: dueDate || null, due_time: dueTime || null, category, icon })} className="flex-1 py-3 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 text-white font-semibold shadow-md shadow-amber-200/50">שמירה</button>
          </div>
        </div>
      </div>
    </div>
  );
}
