"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import PendingInbox from "@/components/PendingInbox";
import ActiveBoard from "@/components/ActiveBoard";
import DoneArchive from "@/components/DoneArchive";
import BottomNav from "@/components/BottomNav";
import { useTasks } from "@/hooks/useTasks";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import WeatherTab from "@/components/WeatherTab";

export type TabKey = "pending" | "active" | "done" | "weather";

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const { member, household, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const { tasks, loading, updateTask, deleteTask, refetch } = useTasks();
  usePushNotifications();

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const activeTasks = tasks.filter((t) => t.status === "active");
  const doneTasks = tasks.filter((t) => t.status === "done");

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const touchStartY = useRef(0);
  const pulling = useRef(false);
  const PULL_THRESHOLD = 80;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0) {
        touchStartY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current) return;
      const dy = e.touches[0].clientY - touchStartY.current;
      if (dy > 0 && el.scrollTop <= 0) {
        setPullDistance(Math.min(dy * 0.5, 120));
      } else {
        pulling.current = false;
        setPullDistance(0);
      }
    };

    const onTouchEnd = () => {
      if (pulling.current && pullDistanceRef.current >= PULL_THRESHOLD) {
        handleRefresh();
      }
      pulling.current = false;
      setPullDistance(0);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleRefresh]);

  // Keep ref in sync for touchEnd closure
  const pullDistanceRef = useRef(pullDistance);
  pullDistanceRef.current = pullDistance;

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
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm"
              >
                {member.name?.charAt(0) ?? "?"}
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute left-0 top-11 z-50 bg-white rounded-xl shadow-lg border border-stone-100 py-1 min-w-[140px]">
                    <div className="px-4 py-2 text-xs text-stone-400 border-b border-stone-100 truncate">
                      {member.name}
                    </div>
                    <button
                      onClick={signOut}
                      className="w-full text-right px-4 py-2.5 text-sm text-red-600 hover:bg-stone-50 active:bg-stone-100"
                    >
                      התנתק
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <main ref={mainRef} className="flex-1 overflow-y-auto pb-24">
        {/* Pull-to-refresh indicator */}
        <div
          className="flex justify-center overflow-hidden transition-all duration-200"
          style={{ height: refreshing ? 48 : pullDistance > 0 ? pullDistance : 0 }}
        >
          <div className="flex items-center gap-2 py-2 text-stone-400">
            <div
              className={`w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full ${refreshing ? "animate-spin" : ""}`}
              style={!refreshing ? { transform: `rotate(${pullDistance * 3}deg)` } : undefined}
            />
            <span className="text-xs">
              {refreshing ? "מרענן..." : pullDistance >= PULL_THRESHOLD ? "שחרר לרענון" : "משוך למטה לרענון"}
            </span>
          </div>
        </div>

        {loading && !refreshing ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === "pending" && <PendingInbox tasks={pendingTasks} onApprove={(id) => updateTask(id, { status: "active" })} onReject={(id) => updateTask(id, { status: "rejected" })} onUpdate={updateTask} />}
            {activeTab === "active" && <ActiveBoard tasks={activeTasks} currentMemberId={member?.id} onDone={(id) => updateTask(id, { status: "done", completed_at: new Date().toISOString() })} onUpdate={updateTask} />}
            {activeTab === "done" && <DoneArchive tasks={doneTasks} onUndo={(id) => updateTask(id, { status: "active", completed_at: null })} onDelete={(id) => deleteTask(id)} />}
            {activeTab === "weather" && <WeatherTab />}
          </>
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} pendingCount={pendingTasks.length} />
    </div>
  );
}
