"use client";

import { useState } from "react";
import type { Task } from "@/types/database";
import TaskCard from "./TaskCard";
import EditTaskModal from "./EditTaskModal";

type OwnerFilter = "mine" | "theirs" | "all";

interface ActiveBoardProps {
  tasks: Task[];
  currentMemberId?: string;
  onDone: (id: string) => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
}

export default function ActiveBoard({ tasks, currentMemberId, onDone, onUpdate }: ActiveBoardProps) {
  const [filter, setFilter] = useState<OwnerFilter>("all");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = tasks
    .filter((t) => filter === "mine" ? t.owner_id === currentMemberId : filter === "theirs" ? t.owner_id !== currentMemberId : true)
    .sort((a, b) => (!a.due_date ? 1 : !b.due_date ? -1 : new Date(a.due_date).getTime() - new Date(b.due_date).getTime()));

  const filters: { key: OwnerFilter; label: string }[] = [{ key: "all", label: "הכל" }, { key: "mine", label: "שלי" }, { key: "theirs", label: "שלה/שלו" }];

  return (
    <div className="px-4 pt-4">
      <div className="flex gap-2 mb-4">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.key ? "bg-amber-500 text-white shadow-sm shadow-amber-200" : "bg-white text-stone-600 border border-stone-200"}`}>{f.label}</button>
        ))}
      </div>
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-stone-400">
          <span className="text-5xl mb-3">📋</span>
          <p className="text-lg font-medium">אין משימות פעילות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2">
              <button
                onClick={() => onDone(task.id)}
                className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-stone-300 hover:border-green-400 hover:bg-green-50 flex items-center justify-center transition-colors active:bg-green-100"
                title="סיום משימה"
              >
                <span className="text-green-500 text-sm opacity-0 hover:opacity-100">✓</span>
              </button>
              <div className="flex-1 min-w-0" onClick={() => setEditingTask(task)}>
                <TaskCard task={task} variant="active" />
              </div>
            </div>
          ))}
        </div>
      )}
      {editingTask && <EditTaskModal task={editingTask} onSave={(data) => { onUpdate(editingTask.id, data); setEditingTask(null); }} onClose={() => setEditingTask(null)} />}
    </div>
  );
}
