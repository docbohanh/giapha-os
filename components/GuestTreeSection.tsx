"use client";

import { Person, Relationship } from "@/types";
import { ListTree, Network } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import FamilyTree from "./FamilyTree";
import MindmapTree from "./MindmapTree";

interface GuestTreeSectionProps {
    persons: Person[];
    relationships: Relationship[];
}

/**
 * Read-only family tree preview for guests (no DashboardProvider).
 * - MindmapTree/FamilyTree fallback to no-op DashboardContext → click on nodes does nothing.
 * - Scrollbar hidden by default, fades in on hover / scroll.
 */
export default function GuestTreeSection({
    persons,
    relationships,
}: GuestTreeSectionProps) {
    const [view, setView] = useState<"tree" | "mindmap">("tree");

    const { personsMap, roots } = useMemo(() => {
        const pMap = new Map<string, Person>();
        persons.forEach((p) => pMap.set(p.id, p));

        const childIds = new Set(
            relationships
                .filter(
                    (r) => r.type === "biological_child" || r.type === "adopted_child",
                )
                .map((r) => r.person_b),
        );

        const rootPersons = persons.filter((p) => !childIds.has(p.id));
        const finalRoots =
            rootPersons.length > 0
                ? [rootPersons[0]]
                : persons.length > 0
                    ? [persons[0]]
                    : [];

        return { personsMap: pMap, roots: finalRoots };
    }, [persons, relationships]);

    if (persons.length === 0) return null;

    const tabs = [
        { id: "tree" as const, label: "Sơ đồ cây", icon: <Network className="size-3.5" /> },
        { id: "mindmap" as const, label: "Mindmap", icon: <ListTree className="size-3.5" /> },
    ];

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Scrollbar style — hidden by default, visible on hover */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .guest-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .guest-scroll::-webkit-scrollbar-track { background: transparent; }
        .guest-scroll::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 9999px;
          transition: background 0.3s;
        }
        .guest-scroll:hover::-webkit-scrollbar-thumb,
        .guest-scroll:focus-within::-webkit-scrollbar-thumb,
        .guest-scroll.is-scrolling::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.18);
        }
        .guest-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .guest-scroll:hover { scrollbar-color: rgba(0,0,0,0.18) transparent; }
      `}} />

            {/* Tab toggle — centered */}
            <div className="flex justify-center mb-3">
                <div className="flex bg-stone-200/50 p-1 rounded-full border border-stone-200/60 backdrop-blur-sm gap-0.5">
                    {tabs.map((tab) => {
                        const isActive = view === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setView(tab.id)}
                                className={`relative px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 flex items-center gap-1.5 cursor-pointer ${isActive ? "text-stone-900" : "text-stone-500 hover:text-stone-700"
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="guestTab"
                                        className="absolute inset-0 bg-white rounded-full shadow-sm border border-stone-200/60 z-[-1]"
                                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                    />
                                )}
                                <span className={isActive ? "text-amber-700" : "text-stone-400"}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tree container */}
            <div className="relative rounded-2xl border border-stone-200/60 bg-white/60 backdrop-blur-md overflow-hidden">
                <div className="guest-scroll overflow-auto max-h-[480px] overscroll-contain">
                    {view === "tree" ? (
                        <FamilyTree
                            personsMap={personsMap}
                            relationships={relationships}
                            roots={roots}
                        />
                    ) : (
                        <MindmapTree
                            personsMap={personsMap}
                            relationships={relationships}
                            roots={roots}
                        />
                    )}
                </div>

                {/* Bottom fade overlay */}
                <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-white/90 to-transparent pointer-events-none" />
            </div>

            <p className="text-center text-xs text-stone-400 mt-2 italic">
                Đăng nhập để xem chi tiết và chỉnh sửa thông tin
            </p>
        </div>
    );
}
