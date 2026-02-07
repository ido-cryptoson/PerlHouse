"use client";

import { useState, useMemo } from "react";
import type { Task } from "@/types/database";
import TaskCard from "./TaskCard";
import SwipeableCard from "./SwipeableCard";

function getHebrewWeekHeader(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diffDays < 7) return "השבוע";
  if (diffDays < 14) return "שבוע שעבר";
  if (diffDays < 21) return "לפני שבועיים";
  return new Date(dateStr).toLocaleDateString("he-IL", { month: "long", year: "numeric" });
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

interface DoneArchiveProps {
  tasks: Task[];
  onUndo: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function DoneArchive({ tasks, onUndo, onDelete }: DoneArchiveProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return tasks;
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, { label: string; tasks: Task[] }> = {};
    const sorted = [...filtered].sort((a, b) => new Date(b.completed_at ?? b.updated_at ?? b.created_at ?? 0).getTime() - new Date(a.completed_at ?? a.updated_at ?? a.created_at ?? 0).getTime());
    for (const task of sorted) {
      const dateStr = task.completed_at ?? task.updated_at ?? task.created_at ?? new Date().toISOString();
      const key = getWeekKey(dateStr);
      if (!groups[key]) groups[key] = { label: getHebrewWeekHeader(dateStr), tasks: [] };
      groups[key].tasks.push(task);
    }
    return Object.values(groups);
  }, [filtered]);

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 start-0 flex items-center ps-3.5 text-stone-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </span>
          <input type="text" dir="auto" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש משימות..." className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
      </div>
      <p className="text-xs text-stone-400 mb-3">החלק ימינה להחזרה, שמאלה למחיקה</p>
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-stone-400">
          <span className="text-5xl mb-3">🎉</span>
          <p className="text-lg font-medium">אין משימות שהושלמו</p>
        </div>
      ) : grouped.map((group, idx) => (
        <div key={idx} className="mb-6">
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2 ps-1">{group.label}</h3>
          <div className="space-y-2">
            {group.tasks.map((task) => (
              <SwipeableCard
                key={task.id}
                leftIcon="↩️"
                rightIcon="🗑️"
                leftColor="bg-amber-50"
                leftActiveColor="bg-amber-300"
                rightColor="bg-stone-100"
                rightActiveColor="bg-stone-400"
                onSwipeRight={() => onUndo(task.id)}
                onSwipeLeft={() => onDelete(task.id)}
              >
                <TaskCard task={task} variant="done" />
              </SwipeableCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
