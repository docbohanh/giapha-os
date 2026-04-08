"use client";

import { Person, Relationship } from "@/types";
import { ArrowRight, Crosshair, ListTree, Network, ZoomIn, ZoomOut } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import FamilyTree from "./FamilyTree";
import LoginModal from "./LoginModal";
import MindmapTree from "./MindmapTree";
import VisibilityToggles from "./VisibilityToggles";

interface GuestTreeSectionProps {
    persons: Person[];
    relationships: Relationship[];
    isLoggedIn?: boolean;
    userRootId?: string;
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
    userRootId,
}: GuestTreeSectionProps) {
    const [view, setView] = useState<"tree" | "mindmap">("tree");
    const [scale, setScale] = useState(1);
    const [loginOpen, setLoginOpen] = useState(false);

    const handleCenter = useCallback(() => {
        const el = document.getElementById("tree-scroll-container");
        if (!el) return;
        const inner = el.querySelector("#export-container");
        if (inner) {
            const innerRect = inner.getBoundingClientRect();
            const containerRect = el.getBoundingClientRect();
            el.scrollLeft +=
                innerRect.left +
                innerRect.width / 2 -
                (containerRect.left + containerRect.width / 2);
        } else {
            el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
        }
        el.scrollTop = 0;
    }, []);
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

        const userRoot = userRootId ? persons.find((p) => p.id === userRootId) : null;
        const defaultRoot = persons.find((p) => p.is_default_root_node === true);
        const rootPersons = persons.filter((p) => !childIds.has(p.id));
        const firstMaleRoot = rootPersons.find((p) => p.gender === "male");

        const finalRoots = userRoot
            ? [userRoot]
            : defaultRoot
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

            {/* Tab toggle & Visibility toggles — centered */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                <div className="flex bg-stone-200/50 p-1 rounded-full border border-stone-200/60 backdrop-blur-sm gap-0.5">
                    {tabs.map((tab) => {
                        const isActive = view === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setView(tab.id)}
                                className={`relative px-3 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 flex items-center gap-1.5 cursor-pointer ${isActive ? "text-stone-900" : "text-stone-500 hover:text-stone-700"
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
                <button
                    onClick={handleCenter}
                    className="flex items-center justify-center size-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-stone-200/60 text-stone-600 hover:bg-white hover:text-stone-900 hover:shadow-md transition-all"
                    title="Căn giữa"
                >
                    <Crosshair className="size-4" />
                </button>
                {/* <div className="flex items-center bg-white/80 backdrop-blur-md shadow-sm border border-stone-200/60 rounded-full p-1 gap-0.5">
                    <button
                        onClick={zoomOut}
                        disabled={scale <= MIN_SCALE}
                        className="px-3 py-1.5 hover:bg-stone-100/50 text-stone-600 rounded-full transition-colors disabled:opacity-50 cursor-pointer flex items-center"
                        title="Thu nhỏ"
                    >
                        <ZoomOut className="size-3.5" />
                    </button>
                    <button
                        onClick={resetZoom}
                        className="px-2 py-1.5 hover:bg-stone-100/50 text-stone-600 rounded-full transition-colors text-[11px] sm:text-xs font-medium min-w-[46px] text-center border-x border-stone-200/50 cursor-pointer"
                        title="Đặt lại"
                    >
                        {Math.round(scale * 100)}%
                    </button>
                    <button
                        onClick={zoomIn}
                        disabled={scale >= MAX_SCALE}
                        className="px-3 py-1.5 hover:bg-stone-100/50 text-stone-600 rounded-full transition-colors disabled:opacity-50 cursor-pointer flex items-center"
                        title="Phóng to"
                    >
                        <ZoomIn className="size-3.5" />
                    </button>
                </div> */}

                <VisibilityToggles />
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


                <div id="guest-scroll-container" className="guest-scroll overflow-auto min-h-[480px] max-h-[1280px] overscroll-contain">
                    {view === "tree" ? (
                        <div style={{ transform: `scale(${scale})`, transformOrigin: "top center", transition: "transform 0.1s" }}>
                            <FamilyTree
                                personsMap={personsMap}
                                relationships={relationships}
                                roots={roots}
                            />
                        </div>
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
                <div className="flex flex-col items-center gap-3 mt-4">
                    <p className="text-center text-xs text-stone-400 italic">
                        Đăng nhập thành viên để xem chi tiết và chỉnh sửa thông tin
                    </p>
                    <button
                        onClick={() => setLoginOpen(true)}
                        className="group inline-flex items-center justify-center gap-1 px-2 py-2 sm:px-6 sm:py-3 text-base sm:text-lg font-bold text-white bg-stone-900 border border-stone-800 hover:bg-stone-800 hover:border-stone-700 rounded-2xl shadow-xl shadow-stone-900/10 hover:shadow-2xl hover:shadow-stone-900/20 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto overflow-hidden relative"
                    >
                        <span className="relative z-5 flex items-center gap-3">
                            Đăng nhập
                            <ArrowRight className="size-5 group-hover:translate-x-1.5 transition-transform" />
                        </span>
                    </button>
                </div>
            )}

            <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        </div>
    );
}
