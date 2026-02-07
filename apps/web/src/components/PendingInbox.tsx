"use client";

import { useState } from "react";
import type { Task } from "@/types/database";
import TaskCard from "./TaskCard";
import EditTaskModal from "./EditTaskModal";
import SwipeableCard from "./SwipeableCard";

interface PendingInboxProps {
  tasks: Task[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
}

export default function PendingInbox({ tasks, onApprove, onReject, onUpdate }: PendingInboxProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-stone-400">
        <span className="text-5xl mb-3">✨</span>
        <p className="text-lg font-medium">אין משימות ממתינות</p>
        <p className="text-sm">כל המשימות טופלו!</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-stone-500">ממתינות לאישור</h2>
        <span className="text-xs text-stone-400">החלק ימינה לאישור, שמאלה לדחייה</span>
      </div>
      {tasks.map((task) => (
        <SwipeableCard
          key={task.id}
          leftIcon="✅"
          rightIcon="❌"
          leftColor="bg-green-100"
          leftActiveColor="bg-green-400"
          rightColor="bg-red-100"
          rightActiveColor="bg-red-400"
          onSwipeRight={() => onApprove(task.id)}
          onSwipeLeft={() => onReject(task.id)}
          onTap={() => setEditingTask(task)}
        >
          <TaskCard task={task} variant="pending" />
          <div className="absolute top-2 left-2 flex gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onApprove(task.id)} className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-300 flex items-center justify-center transition-colors" title="אישור">✅</button>
            <button onClick={() => onReject(task.id)} className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-300 flex items-center justify-center transition-colors" title="דחייה">❌</button>
          </div>
        </SwipeableCard>
      ))}
      {editingTask && <EditTaskModal task={editingTask} onSave={(data) => { onUpdate(editingTask.id, data); setEditingTask(null); }} onClose={() => setEditingTask(null)} />}
    </div>
  );
}
