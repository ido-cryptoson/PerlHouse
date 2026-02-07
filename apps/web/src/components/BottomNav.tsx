"use client";

import type { TabKey } from "@/app/tasks/page";

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: "pending", label: "ממתין", icon: "📥" },
  { key: "active", label: "פעיל", icon: "⚡" },
  { key: "done", label: "בוצע", icon: "✅" },
  { key: "weather", label: "מזג אוויר", icon: "🌤️" },
];

export default function BottomNav({ activeTab, onTabChange, pendingCount }: { activeTab: TabKey; onTabChange: (tab: TabKey) => void; pendingCount: number }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-lg border-t border-stone-100 safe-bottom">
      <div className="flex items-center justify-around px-4 py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => onTabChange(tab.key)} className={`relative flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl transition-all ${isActive ? "text-amber-600" : "text-stone-400"}`}>
              {isActive && <div className="absolute -top-2 inset-x-6 h-0.5 bg-amber-500 rounded-full" />}
              <div className="relative">
                <span className="text-xl">{tab.icon}</span>
                {tab.key === "pending" && pendingCount > 0 && (
                  <span className="absolute -top-1.5 -end-2.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">{pendingCount > 99 ? "99+" : pendingCount}</span>
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? "text-amber-600" : "text-stone-400"}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
