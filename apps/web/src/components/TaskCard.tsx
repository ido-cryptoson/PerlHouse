"use client";

import type { Task } from "@/types/database";

interface TaskCardProps {
  task: Task;
  variant: "pending" | "active" | "done";
  onClick?: () => void;
}

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "באיחור";
  if (diffDays === 0) return "היום";
  if (diffDays === 1) return "מחר";
  if (diffDays < 7) return `בעוד ${diffDays} ימים`;
  return date.toLocaleDateString("he-IL", { day: "numeric", month: "short" });
}

export default function TaskCard({ task, variant, onClick }: TaskCardProps) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && variant !== "done";

  return (
    <div onClick={onClick} className={`rounded-2xl bg-white border transition-all ${variant === "done" ? "border-stone-100 py-3 px-4" : "border-stone-100 p-4 shadow-sm shadow-stone-100 active:scale-[0.98]"}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl ${variant === "done" ? "bg-stone-100" : "bg-amber-50"}`}>
          {task.icon ?? "📌"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 dir="auto" className={`font-semibold leading-tight ${variant === "done" ? "text-sm text-stone-500 line-through" : "text-base text-stone-800"}`} style={{ unicodeBidi: "plaintext" }}>
              {task.title}
            </h3>
            {task.owner_display_name && variant !== "done" && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-semibold">
                {task.owner_display_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {task.category && <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 text-xs text-stone-500">{task.category}</span>}
            {variant !== "done" && task.due_date && <span className={`text-xs font-medium ${isOverdue ? "text-red-500" : "text-stone-400"}`}>{formatDueDate(task.due_date)}</span>}
            {variant !== "done" && task.due_time && <span className="text-xs text-stone-400">{task.due_time}</span>}
          </div>
          {variant === "pending" && task.source_preview && (
            <p dir="auto" className="mt-2 text-xs text-stone-400 truncate" style={{ unicodeBidi: "plaintext" }}>{task.source_preview}</p>
          )}
          {variant === "pending" && task.ai_suggestion && (
            <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
              <span className="text-xs">💡</span>
              <span dir="auto" className="text-xs text-amber-700" style={{ unicodeBidi: "plaintext" }}>{task.ai_suggestion}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
