"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import PendingInbox from "@/components/PendingInbox";
import ActiveBoard from "@/components/ActiveBoard";
import DoneArchive from "@/components/DoneArchive";
import BottomNav from "@/components/BottomNav";
import { useTasks } from "@/hooks/useTasks";

export type TabKey = "pending" | "active" | "done";

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const { member, household } = useAuth();
  const { tasks, loading, updateTask } = useTasks();

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const activeTasks = tasks.filter((t) => t.status === "active");
  const doneTasks = tasks.filter((t) => t.status === "done");

  return (
    <div className="min-h-dvh flex flex-col bg-stone-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-stone-100">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <span className="text-lg">🏠</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-800">בית</h1>
              {household && <p className="text-xs text-stone-400" dir="auto">{household.name}</p>}
            </div>
          </div>
          {member && (
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm">
              {member.display_name?.charAt(0) ?? "?"}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === "pending" && <PendingInbox tasks={pendingTasks} onApprove={(id) => updateTask(id, { status: "active" })} onReject={(id) => updateTask(id, { status: "rejected" })} onUpdate={updateTask} />}
            {activeTab === "active" && <ActiveBoard tasks={activeTasks} currentMemberId={member?.id} onDone={(id) => updateTask(id, { status: "done", completed_at: new Date().toISOString() })} onUpdate={updateTask} />}
            {activeTab === "done" && <DoneArchive tasks={doneTasks} />}
          </>
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} pendingCount={pendingTasks.length} />
    </div>
  );
}
