"use client";

import AvatarToggle from "@/components/AvatarToggle";
import { useDashboard } from "@/components/DashboardContext";
import DashboardMemberList from "@/components/DashboardMemberList";
import ExportButton from "@/components/ExportButton";
import FamilyTree from "@/components/FamilyTree";
import MindmapTree from "@/components/MindmapTree";
import RootSelector from "@/components/RootSelector";
import { Person, Relationship } from "@/types";
import { useEffect, useMemo } from "react";

interface DashboardViewsProps {
  persons: Person[];
  relationships: Relationship[];
}

export default function DashboardViews({
  persons,
  relationships,
}: DashboardViewsProps) {
  const { view: currentView, rootId, setTreeStats } = useDashboard();

  // Prepare map and roots for tree views
  const { personsMap, roots, defaultRootId, stats } = useMemo(() => {
    const pMap = new Map<string, Person>();
    persons.forEach((p) => pMap.set(p.id, p));

    const childIds = new Set(
      relationships
        .filter(
          (r) => r.type === "biological_child" || r.type === "adopted_child",
        )
        .map((r) => r.person_b),
    );

    let finalRootId = rootId;

    // If no rootId is provided, fallback to first male root, then first root, then first person
    if (!finalRootId || !pMap.has(finalRootId)) {
      const defaultRootPerson = persons.find((p) => p.is_default_root_node === true);
      if (defaultRootPerson) {
        finalRootId = defaultRootPerson.id;
      } else {
        const rootsFallback = persons.filter((p) => !childIds.has(p.id));
        const firstMaleRoot = rootsFallback.find((p) => p.gender === "male");
        if (firstMaleRoot) {
          finalRootId = firstMaleRoot.id;
        } else if (rootsFallback.length > 0) {
          finalRootId = rootsFallback[0].id;
        } else if (persons.length > 0) {
          finalRootId = persons[0].id;
        }
      }
    }

    let calculatedRoots: Person[] = [];
    if (finalRootId && pMap.has(finalRootId)) {
      calculatedRoots = [pMap.get(finalRootId)!];
    }

    // Tính số đời: BFS từ TẤT CẢ root node trong DB
    const childrenMap = new Map<string, string[]>();
    relationships
      .filter((r) => r.type === "biological_child" || r.type === "adopted_child")
      .forEach((r) => {
        if (!childrenMap.has(r.person_a)) childrenMap.set(r.person_a, []);
        childrenMap.get(r.person_a)!.push(r.person_b);
      });

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

    return {
      personsMap: pMap,
      roots: calculatedRoots,
      defaultRootId: finalRootId,
      stats: { total: persons.length, generations: maxGen },
    };
  }, [persons, relationships, rootId]);

  const activeRootId = rootId || defaultRootId;

  // Sync stats to context so ViewToggle can display them
  useEffect(() => {
    setTreeStats({ totalMembers: stats.total, generations: stats.generations });
  }, [stats.total, stats.generations, setTreeStats]);

  return (
    <>
      <main className="flex-1 overflow-auto bg-stone-50/50 flex flex-col">
        {currentView !== "list" && persons.length > 0 && activeRootId && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 w-full flex flex-wrap items-center justify-center gap-4 relative z-20">
            <RootSelector persons={persons} currentRootId={activeRootId} />
            <div className="flex items-center gap-2">
              <AvatarToggle />
              <ExportButton />
            </div>
          </div>
        )}

        {currentView === "list" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
            <DashboardMemberList initialPersons={persons} />
          </div>
        )}

        <div className="flex-1 w-full relative z-10">
          {currentView === "tree" && (
            <FamilyTree
              personsMap={personsMap}
              relationships={relationships}
              roots={roots}
            />
          )}
          {currentView === "mindmap" && (
            <MindmapTree
              personsMap={personsMap}
              relationships={relationships}
              roots={roots}
            />
          )}
        </div>
      </main>
    </>
  );
}
