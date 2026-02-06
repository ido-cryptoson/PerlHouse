"use client";

import { useState, useRef } from "react";
import type { Task } from "@/types/database";
import TaskCard from "./TaskCard";
import EditTaskModal from "./EditTaskModal";

interface PendingInboxProps {
  tasks: Task[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
}

export default function PendingInbox({ tasks, onApprove, onReject, onUpdate }: PendingInboxProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [swipeStates, setSwipeStates] = useState<Record<string, number>>({});
  const touchStartX = useRef<Record<string, number>>({});

  const handleTouchStart = (taskId: string, e: React.TouchEvent) => { touchStartX.current[taskId] = e.touches[0].clientX; };
  const handleTouchMove = (taskId: string, e: React.TouchEvent) => {
    const startX = touchStartX.current[taskId];
    if (startX === undefined) return;
    setSwipeStates((prev) => ({ ...prev, [taskId]: e.touches[0].clientX - startX }));
  };
  const handleTouchEnd = (taskId: string) => {
    const delta = swipeStates[taskId] ?? 0;
    if (delta > 100) onApprove(taskId);
    else if (delta < -100) onReject(taskId);
    setSwipeStates((prev) => ({ ...prev, [taskId]: 0 }));
    delete touchStartX.current[taskId];
  };

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
      {tasks.map((task) => {
        const swipeX = swipeStates[task.id] ?? 0;
        return (
          <div key={task.id} className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 flex">
              <div className={`flex-1 flex items-center justify-start ps-5 rounded-2xl transition-colors ${swipeX > 50 ? "bg-green-400" : "bg-green-100"}`}><span className="text-2xl">✅</span></div>
              <div className={`flex-1 flex items-center justify-end pe-5 rounded-2xl transition-colors ${swipeX < -50 ? "bg-red-400" : "bg-red-100"}`}><span className="text-2xl">❌</span></div>
            </div>
            <div style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? "transform 0.3s ease-out" : "none" }} onTouchStart={(e) => handleTouchStart(task.id, e)} onTouchMove={(e) => handleTouchMove(task.id, e)} onTouchEnd={() => handleTouchEnd(task.id)} onClick={() => setEditingTask(task)} className="relative cursor-pointer">
              <TaskCard task={task} variant="pending" />
              <div className="absolute top-2 left-2 flex gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => onApprove(task.id)} className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-300 flex items-center justify-center transition-colors" title="אישור">✅</button>
                <button onClick={() => onReject(task.id)} className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-300 flex items-center justify-center transition-colors" title="דחייה">❌</button>
              </div>
            </div>
          </div>
        );
      })}
      {editingTask && <EditTaskModal task={editingTask} onSave={(data) => { onUpdate(editingTask.id, data); setEditingTask(null); }} onClose={() => setEditingTask(null)} />}
    </div>
  );
}
