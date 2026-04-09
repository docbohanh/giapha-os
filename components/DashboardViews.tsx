"use client";

import { useDashboard } from "@/components/DashboardContext";
import DashboardMemberList from "@/components/DashboardMemberList";
import ExportButton from "@/components/ExportButton";
import FamilyTree from "@/components/FamilyTree";
import MindmapTree from "@/components/MindmapTree";
import RootSelector from "@/components/RootSelector";
import { Person, Relationship } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, Filter, Image as ImageIcon, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface DashboardViewsProps {
  persons: Person[];
  relationships: Relationship[];
  canEdit?: boolean;
}

export default function DashboardViews({
  persons,
  relationships,
  canEdit,
}: DashboardViewsProps) {
  const {
    view: currentView,
    rootId,
    setTreeStats,
    showAvatar,
    setShowAvatar,
    hideSpouses,
    setHideSpouses,
    hideFemales,
    setHideFemales,
    hideMales,
    setHideMales,
    treeScale,
    setTreeScale,
  } = useDashboard();

  const [showFilters, setShowFilters] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);

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
  }, []);

  const MIN_SCALE = 0.3;
  const MAX_SCALE = 2;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  useEffect(() => {
    setTreeStats({ totalMembers: stats.total, generations: stats.generations });
  }, [stats.total, stats.generations, setTreeStats]);

  const isTreeView = currentView === "tree" || currentView === "mindmap";

  const handleExportExcel = (
    pMap: Map<string, Person>,
    rels: Relationship[],
    rootList: Person[],
  ) => {
    const formatDate = (day: number | null, month: number | null, year: number | null): string => {
      if (year && month && day) return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
      if (year && month) return `${String(month).padStart(2, "0")}/${year}`;
      if (year) return String(year);
      return "";
    };

    // Intermediate record before we know max gen
    interface PersonRow {
      id: string;
      parentId: string | null;
      gen: number;
      name: string;
      gender: string;
      ngaySinh: string;
      ngayMat: string;
      daMat: string;
      voChong: string;
      ghiChu: string;
      ngheNghiep: string;
      noiO: string;
      sdt: string;
    }

    const personRows: PersonRow[] = [];

    const traverse = (personId: string, parentId: string | null) => {
      const person = pMap.get(personId);
      if (!person) return;

      const spouseNames = rels
        .filter((r) => r.type === "marriage" && (r.person_a === personId || r.person_b === personId))
        .map((r) => {
          const sid = r.person_a === personId ? r.person_b : r.person_a;
          return pMap.get(sid)?.full_name.toUpperCase() ?? "";
        })
        .filter(Boolean)
        .join(", ");

      personRows.push({
        id: person.id,
        parentId,
        gen: person.generation ?? 0,
        name: person.full_name.toUpperCase(),
        gender: person.gender === "male" ? "Nam" : person.gender === "female" ? "Nữ" : "Khác",
        ngaySinh: formatDate(person.birth_day, person.birth_month, person.birth_year),
        ngayMat: formatDate(person.death_day, person.death_month, person.death_year),
        daMat: person.is_deceased ? "Đã mất" : "",
        voChong: spouseNames,
        ghiChu: person.note ?? "",
        ngheNghiep: person.occupation ?? "",
        noiO: person.current_residence ?? "",
        sdt: person.phone_number ?? "",
      });

      const children = rels
        .filter((r) => (r.type === "biological_child" || r.type === "adopted_child") && r.person_a === personId)
        .map((r) => pMap.get(r.person_b))
        .filter(Boolean) as Person[];

      children.forEach((c) => traverse(c.id, personId));
    };

    rootList.forEach((root) => traverse(root.id, null));

    const minGen = personRows.reduce((m, r) => Math.min(m, r.gen), Infinity);
    const maxGen = personRows.reduce((m, r) => Math.max(m, r.gen), 0);
    const genCols = Array.from({ length: maxGen - minGen + 1 }, (_, i) => `Đời ${minGen + i}`);

    const rows = personRows.map((r) => {
      const row: Record<string, string | number | null> = {
        "ID": r.id,
        "Parent ID": r.parentId ?? "",
      };
      genCols.forEach((col, i) => {
        row[col] = r.gen === minGen + i ? r.name : "";
      });
      row["Giới tính"] = r.gender;
      row["Ngày sinh"] = r.ngaySinh;
      row["Ngày mất"] = r.ngayMat;
      row["Trạng thái"] = r.daMat;
      row["Vợ/Chồng"] = r.voChong;
      row["Ghi chú"] = r.ghiChu;
      row["Nghề nghiệp"] = r.ngheNghiep;
      row["Nơi ở hiện tại"] = r.noiO;
      row["Số điện thoại"] = r.sdt;
      return row;
    });

    import("xlsx").then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(rows);

      const allKeys = Object.keys(rows[0] ?? {});
      const hiddenCols = new Set(["ID", "Parent ID"]);

      // Auto column width, hidden cols set to 0
      ws["!cols"] = allKeys.map((key) =>
        hiddenCols.has(key)
          ? { wch: 0, hidden: true }
          : { wch: Math.max(key.length, ...rows.map((r) => String(r[key] ?? "").length)) + 2 }
      );

      // Black borders on all cells
      const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
      const blackBorder = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      };
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[addr]) ws[addr] = { t: "z", v: "" };
          ws[addr].s = { border: blackBorder };
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Gia Phả");
      XLSX.writeFile(wb, `giapha-${new Date().toISOString().split("T")[0]}.xlsx`, { bookType: "xlsx", cellStyles: true });
    });
  };

  const handleExportJSON = (
    pMap: Map<string, Person>,
    rels: Relationship[],
    rootList: Person[],
  ) => {
    const formatDate = (day: number | null, month: number | null, year: number | null): string => {
      if (year && month && day) return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
      if (year && month) return `${String(month).padStart(2, "0")}/${year}`;
      if (year) return String(year);
      return "";
    };

    const buildNode = (personId: string, gen: number): object => {
      const person = pMap.get(personId);
      if (!person) return {};

      const spouseNames = rels
        .filter((r) => r.type === "marriage" && (r.person_a === personId || r.person_b === personId))
        .map((r) => {
          const sid = r.person_a === personId ? r.person_b : r.person_a;
          return pMap.get(sid)?.full_name.toUpperCase() ?? "";
        })
        .filter(Boolean)
        .join(", ");

      const children = rels
        .filter((r) => (r.type === "biological_child" || r.type === "adopted_child") && r.person_a === personId)
        .map((r) => pMap.get(r.person_b))
        .filter(Boolean) as Person[];

      const node: Record<string, unknown> = {
        gen,
        ho_ten: person.full_name.toUpperCase(),
        gioi_tinh: person.gender === "male" ? "Nam" : person.gender === "female" ? "Nữ" : "Khác",
        ngay_sinh: formatDate(person.birth_day, person.birth_month, person.birth_year),
      };

      const ngayMat = formatDate(person.death_day, person.death_month, person.death_year);
      if (ngayMat) node.ngay_mat = ngayMat;
      if (person.note) node.ghi_chu = person.note;
      if (spouseNames) node.vo = spouseNames;
      if (children.length > 0) node.children = children.map((c) => buildNode(c.id, gen + 1));

      return node;
    };

    const data = rootList.length === 1
      ? buildNode(rootList[0].id, 1)
      : rootList.map((r) => buildNode(r.id, 1));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `giapha-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <main ref={containerRef} className="flex-1 overflow-auto bg-stone-50/50 flex flex-col">
        {isTreeView && persons.length > 0 && activeRootId && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 w-full flex flex-wrap items-center justify-center gap-3 relative z-20">
            {/* Root Selector */}
            <RootSelector persons={persons} currentRootId={activeRootId} />

            {/* Zoom Controls */}
            <div className="flex items-center bg-white/80 backdrop-blur-md shadow-sm border border-stone-200/60 rounded-full overflow-hidden h-10">
              <button
                onClick={() => setTreeScale(Math.max(MIN_SCALE, +(treeScale - 0.1).toFixed(2)))}
                className="px-3 h-full hover:bg-stone-100/50 text-stone-600 transition-colors disabled:opacity-50 cursor-pointer"
                title="Thu nhỏ"
                disabled={treeScale <= MIN_SCALE}
              >
                <ZoomOut className="size-4" />
              </button>
              <button
                onClick={() => setTreeScale(1)}
                className="px-2 h-full hover:bg-stone-100/50 text-stone-600 transition-colors text-xs font-medium min-w-[50px] text-center border-x border-stone-200/50 cursor-pointer"
                title="Đặt lại"
              >
                {Math.round(treeScale * 100)}%
              </button>
              <button
                onClick={() => setTreeScale(Math.min(MAX_SCALE, +(treeScale + 0.1).toFixed(2)))}
                className="px-3 h-full hover:bg-stone-100/50 text-stone-600 transition-colors disabled:opacity-50 cursor-pointer"
                title="Phóng to"
                disabled={treeScale >= MAX_SCALE}
              >
                <ZoomIn className="size-4" />
              </button>
            </div>

            {/* Center Button */}
            <button
              onClick={handleCenter}
              className="flex items-center justify-center size-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-stone-200/60 text-stone-600 hover:bg-white hover:text-stone-900 hover:shadow-md transition-all"
              title="Căn giữa"
            >
              <Crosshair className="size-4" />
            </button>

            {/* Filter Dropdown */}
            <div className="relative" ref={filtersRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 h-10 rounded-full font-semibold text-sm shadow-sm border transition-all duration-300 ${showFilters
                    ? "bg-amber-100/90 text-amber-800 border-amber-200"
                    : "bg-white/80 text-stone-600 border-stone-200/60 hover:bg-white hover:text-stone-900 hover:shadow-md backdrop-blur-md"
                  }`}
              >
                <Filter className="size-4" />
                <span className="hidden sm:inline">Lọc hiển thị</span>
              </button>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white/95 backdrop-blur-xl shadow-xl border border-stone-200/60 rounded-2xl p-4 flex flex-col gap-3 z-50"
                  >
                    <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                      HIỂN THỊ
                    </div>
                    <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer hover:text-stone-900 transition-colors select-none">
                      <input
                        type="checkbox"
                        checked={!showAvatar}
                        onChange={(e) => setShowAvatar(!e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer size-4"
                      />
                      <ImageIcon className="size-4 text-stone-400" /> Ẩn ảnh đại diện
                    </label>

                    <div className="h-px w-full bg-stone-100 my-1" />
                    <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                      LỌC DỮ LIỆU
                    </div>
                    <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer hover:text-stone-900 transition-colors select-none">
                      <input
                        type="checkbox"
                        checked={hideSpouses}
                        onChange={(e) => setHideSpouses(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer size-4"
                      />
                      Ẩn dâu/rể
                    </label>
                    <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer hover:text-stone-900 transition-colors select-none">
                      <input
                        type="checkbox"
                        checked={hideMales}
                        onChange={(e) => setHideMales(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer size-4"
                      />
                      Ẩn nam
                    </label>
                    <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer hover:text-stone-900 transition-colors select-none">
                      <input
                        type="checkbox"
                        checked={hideFemales}
                        onChange={(e) => setHideFemales(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer size-4"
                      />
                      Ẩn nữ
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export Button — chỉ hiện khi canEdit */}
            {canEdit && <ExportButton onExportJSON={() => handleExportJSON(personsMap, relationships, roots)} onExportExcel={() => handleExportExcel(personsMap, relationships, roots)} />}
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
              isAdmin={!!canEdit}
            />
          )}
        </div>
      </main>
    </>
  );
}
