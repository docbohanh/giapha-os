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
    isLoggedIn?: boolean;
}

/**
 * Read-only family tree preview for guests (no DashboardProvider).
 * - MindmapTree/FamilyTree fallback to no-op DashboardContext → click on nodes does nothing.
 * - Scrollbar hidden by default, fades in on hover / scroll.
 */
export default function GuestTreeSection({
    persons,
    relationships,
    isLoggedIn,
}: GuestTreeSectionProps) {
    const [view, setView] = useState<"tree" | "mindmap">("tree");
    const [scale, setScale] = useState(1);
    const MIN_SCALE = 0.3;
    const MAX_SCALE = 2;
    const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, +(s + 0.1).toFixed(2)));
    const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, +(s - 0.1).toFixed(2)));
    const resetZoom = () => setScale(1);

    const { personsMap, roots, stats } = useMemo(() => {
        const pMap = new Map<string, Person>();
        persons.forEach((p) => pMap.set(p.id, p));

        const childIds = new Set(
            relationships
                .filter(
                    (r) => r.type === "biological_child" || r.type === "adopted_child",
                )
                .map((r) => r.person_b),
        );

        const defaultRoot = persons.find((p) => p.is_default_root_node === true);
        const rootPersons = persons.filter((p) => !childIds.has(p.id));
        const firstMaleRoot = rootPersons.find((p) => p.gender === "male");
        const finalRoots = defaultRoot
            ? [defaultRoot]
            : firstMaleRoot
                ? [firstMaleRoot]
                : rootPersons.length > 0
                    ? [rootPersons[0]]
                    : persons.length > 0
                        ? [persons[0]]
                        : [];

        // Tính số đời: BFS từ TẤT CẢ root node trong DB (không phụ thuộc default root)
        const childrenMap = new Map<string, string[]>();
        relationships
            .filter((r) => r.type === "biological_child" || r.type === "adopted_child")
            .forEach((r) => {
                if (!childrenMap.has(r.person_a)) childrenMap.set(r.person_a, []);
                childrenMap.get(r.person_a)!.push(r.person_b);
            });

        // Tất cả người không có cha/mẹ trong DB = root thực sự
        const allChildIds = new Set(
            relationships
                .filter((r) => r.type === "biological_child" || r.type === "adopted_child")
                .map((r) => r.person_b),
        );
        const allRootIds = persons.filter((p) => !allChildIds.has(p.id)).map((p) => p.id);

        let maxGen = 0;
        if (allRootIds.length > 0) {
            const queue: Array<{ id: string; gen: number }> = allRootIds.map((id) => ({ id, gen: 1 }));
            const visited = new Set<string>();
            while (queue.length > 0) {
                const { id, gen } = queue.shift()!;
                if (visited.has(id)) continue;
                visited.add(id);
                if (gen > maxGen) maxGen = gen;
                (childrenMap.get(id) ?? []).forEach((cid) => queue.push({ id: cid, gen: gen + 1 }));
            }
        }

        return { personsMap: pMap, roots: finalRoots, stats: { total: persons.length, generations: maxGen } };
    }, [persons, relationships]);

    if (persons.length === 0) return null;

    const tabs = [
        { id: "tree" as const, label: "Sơ đồ cây", icon: <Network className="size-3.5" /> },
        { id: "mindmap" as const, label: "Mindmap", icon: <ListTree className="size-3.5" /> },
    ];

    return (
        <div className="w-full">
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

            {/* Stats bar */}
            <div className="flex justify-center items-center gap-3 mb-3 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                    <span className="font-semibold text-stone-700">{stats.total.toLocaleString()}</span>
                    thành viên
                </span>
                <span className="w-px h-3 bg-stone-300" />
                <span className="flex items-center gap-1">
                    <span className="font-semibold text-stone-700">{stats.generations}</span>
                    đời
                </span>
            </div>

            {/* Tree container */}
            <div className="relative rounded-2xl border border-stone-200/60 bg-white/60 backdrop-blur-md overflow-hidden">
                {/* Zoom controls — fixed at top-right, above scroll */}
                {view === "tree" && (
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-stone-200 rounded-xl shadow-sm px-2 py-1">
                        <button
                            onClick={zoomOut}
                            className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors text-base font-bold leading-none cursor-pointer"
                            title="Thu nhỏ"
                        >−</button>
                        <button
                            onClick={resetZoom}
                            className="px-1.5 h-6 flex items-center justify-center text-xs font-semibold text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer min-w-[40px]"
                            title="Đặt lại"
                        >{Math.round(scale * 100)}%</button>
                        <button
                            onClick={zoomIn}
                            className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors text-base font-bold leading-none cursor-pointer"
                            title="Phóng to"
                        >+</button>
                    </div>
                )}

                <div className="guest-scroll overflow-auto min-h-[480px] max-h-[960px] overscroll-contain">
                    {view === "tree" ? (
                        <FamilyTree
                            personsMap={personsMap}
                            relationships={relationships}
                            roots={roots}
                            externalScale={scale}
                            onZoomIn={zoomIn}
                            onZoomOut={zoomOut}
                            onResetZoom={resetZoom}
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

            {!isLoggedIn && (
                <p className="text-center text-xs text-stone-400 mt-2 italic">
                    Đăng nhập để xem chi tiết và chỉnh sửa thông tin
                </p>
            )}
        </div>
    );
}
