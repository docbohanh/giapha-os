"use client";

import { motion } from "framer-motion";
import { List, ListTree, Network } from "lucide-react";
import { useDashboard } from "./DashboardContext";

export type ViewMode = "list" | "tree" | "mindmap";

interface ViewToggleProps {
  totalMembers?: number;
  generations?: number;
}

export default function ViewToggle({ totalMembers = 0, generations = 0 }: ViewToggleProps) {
  const { view: currentView, setView } = useDashboard();

  const tabs = [
    { id: "list", label: "List", icon: <List className="size-4" /> },
    { id: "tree", label: "Tree", icon: <Network className="size-4" /> },
    { id: "mindmap", label: "Mindmap", icon: <ListTree className="size-4" /> },
  ] as const;

  return (
    <>
      <div className="flex bg-stone-200/50 p-1.5 rounded-full shadow-inner w-fit mx-auto mt-4 mb-2 relative border border-stone-200/60 backdrop-blur-sm z-10">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as ViewMode)}
              className={`relative px-4 sm:px-6 py-1.5 sm:py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 ease-in-out cursor-pointer z-10 flex items-center gap-2 ${isActive
                ? "text-stone-900"
                : "text-stone-500 hover:text-stone-800"
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-full shadow-sm border border-stone-200/60 z-[-1]"
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                />
              )}
              <span
                className={`transition-colors duration-300 ${isActive ? "text-amber-700" : "text-stone-400"}`}
              >
                {tab.icon}
              </span>
              <span className="tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>
      {totalMembers > 0 && (
        <div className="flex justify-center items-center gap-3 mb-2 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <span className="font-semibold text-stone-700">{totalMembers.toLocaleString()}</span>
            thành viên
          </span>
          <span className="w-px h-3 bg-stone-300" />
          <span className="flex items-center gap-1">
            <span className="font-semibold text-stone-700">{generations}</span>
            đời
          </span>
        </div>
      )}
    </>
  );
}
