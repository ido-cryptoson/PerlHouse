"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Task } from "@/types/database";
import TaskCard from "./TaskCard";
import EditTaskModal from "./EditTaskModal";

interface PendingInboxProps {
  tasks: Task[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
}

function SwipeableCard({
  task,
  onApprove,
  onReject,
  onTap,
}: {
  task: Task;
  onApprove: () => void;
  onReject: () => void;
  onTap: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const [offsetX, setOffsetX] = useState(0);

  // Stable refs for callbacks — avoids re-registering listeners on every render
  const onApproveRef = useRef(onApprove);
  const onRejectRef = useRef(onReject);
  onApproveRef.current = onApprove;
  onRejectRef.current = onReject;

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      currentX.current = 0;
      swiping.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      const delta = e.touches[0].clientX - startX.current;
      currentX.current = delta;
      if (Math.abs(delta) > 10) {
        swiping.current = true;
        e.preventDefault();
      }
      setOffsetX(delta);
    };

    const onTouchEnd = () => {
      const delta = currentX.current;
      if (delta > 100) {
        onApproveRef.current();
      } else if (delta < -100) {
        onRejectRef.current();
      }
      setOffsetX(0);
      currentX.current = 0;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const handleClick = () => {
    if (swiping.current) return;
    onTap();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 flex">
        <div className={`flex-1 flex items-center justify-start ps-5 rounded-2xl transition-colors ${offsetX > 50 ? "bg-green-400" : "bg-green-100"}`}>
          <span className="text-2xl">✅</span>
        </div>
        <div className={`flex-1 flex items-center justify-end pe-5 rounded-2xl transition-colors ${offsetX < -50 ? "bg-red-400" : "bg-red-100"}`}>
          <span className="text-2xl">❌</span>
        </div>
      </div>
      <div
        ref={cardRef}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: offsetX === 0 ? "transform 0.3s ease-out" : "none",
          touchAction: "pan-y",
        }}
        onClick={handleClick}
        className="relative cursor-pointer"
      >
        <TaskCard task={task} variant="pending" />
        <div className="absolute top-2 left-2 flex gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
          <button onClick={onApprove} className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-300 flex items-center justify-center transition-colors" title="אישור">✅</button>
          <button onClick={onReject} className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-300 flex items-center justify-center transition-colors" title="דחייה">❌</button>
        </div>
      </div>
    </div>
  );
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
          task={task}
          onApprove={() => onApprove(task.id)}
          onReject={() => onReject(task.id)}
          onTap={() => setEditingTask(task)}
        />
      ))}
      {editingTask && <EditTaskModal task={editingTask} onSave={(data) => { onUpdate(editingTask.id, data); setEditingTask(null); }} onClose={() => setEditingTask(null)} />}
    </div>
  );
}
