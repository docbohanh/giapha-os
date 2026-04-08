"use client";

import { Person, Relationship } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { toJpeg, toPng } from "html-to-image";
import jsPDF from "jspdf";
import {
  AlertCircle,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

interface ExportButtonProps {
  persons?: Person[];
  relationships?: Relationship[];
  roots?: Person[];
}

// Build parent→children map and walk the tree to produce indented rows
function buildMindmapRows(
  persons: Person[],
  relationships: Relationship[],
  rootPersons?: Person[],
): string[][] {
  const childrenMap = new Map<string, string[]>();
  const childIds = new Set<string>();

  relationships.forEach((r) => {
    if (r.type === "biological_child" || r.type === "adopted_child") {
      if (!childrenMap.has(r.person_a)) childrenMap.set(r.person_a, []);
      childrenMap.get(r.person_a)!.push(r.person_b);
      childIds.add(r.person_b);
    }
  });

  const personsMap = new Map(persons.map((p) => [p.id, p]));
  const spousesMap = new Map<string, string[]>();
  relationships.forEach((r) => {
    if (r.type === "marriage") {
      if (!spousesMap.has(r.person_a)) spousesMap.set(r.person_a, []);
      spousesMap.get(r.person_a)!.push(r.person_b);
    }
  });

  // Sort children by birth_order then birth_year
  childrenMap.forEach((children) => {
    children.sort((a, b) => {
      const pa = personsMap.get(a);
      const pb = personsMap.get(b);
      const orderA = pa?.birth_order ?? Infinity;
      const orderB = pb?.birth_order ?? Infinity;
      if (orderA !== orderB) return orderA - orderB;
      return (pa?.birth_year ?? Infinity) - (pb?.birth_year ?? Infinity);
    });
  });

  // Use provided roots (selected root) or fall back to auto-detecting
  const roots = rootPersons && rootPersons.length > 0
    ? rootPersons
    : persons
        .filter((p) => !childIds.has(p.id))
        .sort((a, b) => (a.generation ?? 99) - (b.generation ?? 99) || (a.birth_year ?? 0) - (b.birth_year ?? 0));

  const rows: string[][] = [];
  const MAX_DEPTH = 20;

  const label = (p: Person) => {
    let s = p.full_name;
    if (p.birth_year || p.death_year) {
      const born = p.birth_year ?? "?";
      const died = p.death_year ?? (p.is_deceased ? "?" : "");
      s += died ? ` (${born}–${died})` : ` (${born})`;
    }
    return s;
  };

  const walk = (id: string, depth: number, visited: Set<string>) => {
    if (visited.has(id) || depth > MAX_DEPTH) return;
    visited.add(id);

    const person = personsMap.get(id);
    if (!person) return;

    const row = Array(MAX_DEPTH).fill("");
    row[depth] = label(person);

    // Spouse(s) appended as extra columns after max depth
    const spouseIds = spousesMap.get(id) ?? [];
    const spouseLabels = spouseIds
      .map((sid) => personsMap.get(sid))
      .filter(Boolean)
      .map((sp) => `⚭ ${label(sp!)}`)
      .join(" / ");
    row[MAX_DEPTH] = spouseLabels;

    rows.push(row);

    const children = childrenMap.get(id) ?? [];
    children.forEach((cid) => walk(cid, depth + 1, new Set(visited)));
  };

  roots.forEach((r) => walk(r.id, 0, new Set()));
  return rows;
}

export default function ExportButton({ persons, relationships, roots }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (format: "png" | "pdf") => {
    try {
      setIsExporting(true);
      setShowMenu(false);
      setError(null);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const element = document.getElementById("export-container");
      if (!element) throw new Error("Không tìm thấy vùng dữ liệu để xuất.");

      element.classList.add("exporting");

      const exportOptions = {
        cacheBust: true,
        backgroundColor: "#f5f5f4",
        pixelRatio: 2,
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          width: `${element.scrollWidth}px`,
          height: `${element.scrollHeight}px`,
        },
      };

      if (format === "png") {
        const url = await toPng(element, exportOptions);
        const a = document.createElement("a");
        a.href = url;
        a.download = `giapha-sodo-${new Date().toISOString().split("T")[0]}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (format === "pdf") {
        const imgData = await toJpeg(element, { ...exportOptions, quality: 0.95 });
        const width = element.scrollWidth;
        const height = element.scrollHeight;
        const pdf = new jsPDF({
          orientation: width > height ? "landscape" : "portrait",
          unit: "px",
          format: [width, height],
        });
        pdf.addImage(imgData, "JPEG", 0, 0, width, height);
        pdf.save(`giapha-sodo-${new Date().toISOString().split("T")[0]}.pdf`);
      }
    } catch (err) {
      console.error("Export error:", err);
      setError("Đã xảy ra lỗi khi xuất file. Vui lòng thử lại.");
      setTimeout(() => setError(null), 5000);
    } finally {
      const element = document.getElementById("export-container");
      if (element) element.classList.remove("exporting");
      setIsExporting(false);
    }
  };

  const handleExportSpreadsheet = (format: "csv" | "xlsx") => {
    try {
      if (!persons?.length || !relationships) {
        setError("Không có dữ liệu để xuất.");
        setTimeout(() => setError(null), 4000);
        return;
      }

      setIsExporting(true);
      setShowMenu(false);

      const rows = buildMindmapRows(persons, relationships, roots);
      const MAX_DEPTH = 20;

      // Header row
      const depthHeaders = Array.from({ length: MAX_DEPTH }, (_, i) =>
        i === 0 ? "Thủy tổ / Gốc" : `Đời con ${i}`,
      );
      const header = [...depthHeaders, "Vợ / Chồng"];
      const data = [header, ...rows];

      const ws = XLSX.utils.aoa_to_sheet(data);

      // Auto column width
      ws["!cols"] = [
        { wch: 28 }, // depth 0
        ...Array(MAX_DEPTH - 1).fill({ wch: 26 }),
        { wch: 32 }, // spouse
      ];

      // Add border to all cells that have data
      if (format === "xlsx") {
        const border: XLSX.CellObject["s"] = {
          border: {
            top:    { style: "thin", color: { rgb: "D6D3D1" } },
            bottom: { style: "thin", color: { rgb: "D6D3D1" } },
            left:   { style: "thin", color: { rgb: "D6D3D1" } },
            right:  { style: "thin", color: { rgb: "D6D3D1" } },
          },
        };
        const range = XLSX.utils.decode_range(ws["!ref"]!);
        for (let R = range.s.r; R <= range.e.r; R++) {
          for (let C = range.s.c; C <= range.e.c; C++) {
            const addr = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[addr]) continue;
            ws[addr].s = { ...border };
          }
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Gia Phả");

      const date = new Date().toISOString().split("T")[0];
      if (format === "xlsx") {
        XLSX.writeFile(wb, `giapha-mindmap-${date}.xlsx`, { cellStyles: true });
      } else {
        XLSX.writeFile(wb, `giapha-mindmap-${date}.csv`, { bookType: "csv" });
      }
    } catch (err) {
      console.error("Spreadsheet export error:", err);
      setError("Đã xảy ra lỗi khi xuất bảng tính.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const hasData = persons && persons.length > 0;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="btn"
      >
        {isExporting ? (
          <Loader2 className="size-4 shrink-0 animate-spin" />
        ) : (
          <Download className="size-4 shrink-0" />
        )}
        <span className="hidden sm:inline tracking-wide min-w-max">
          {isExporting ? "Đang xuất..." : "Xuất file"}
        </span>
      </button>

      <AnimatePresence>
        {showMenu && !isExporting && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full right-0 sm:right-auto sm:left-0 mt-2 w-52 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-stone-200/60 py-2 z-50 overflow-hidden"
          >
            <p className="px-4 pt-1 pb-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Hình ảnh / Tài liệu
            </p>
            <button
              onClick={() => handleExport("png")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-stone-700 hover:text-amber-700 hover:bg-amber-50 transition-colors text-left"
            >
              <FileImage className="size-4" />
              Ảnh (PNG)
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-stone-700 hover:text-amber-700 hover:bg-amber-50 transition-colors text-left"
            >
              <FileText className="size-4" />
              PDF
            </button>

            {hasData && (
              <>
                <div className="h-px bg-stone-100 mx-3 my-1.5" />
                <p className="px-4 pt-1 pb-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  Bảng tính (dạng mindmap)
                </p>
                <button
                  onClick={() => handleExportSpreadsheet("xlsx")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-stone-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
                >
                  <FileSpreadsheet className="size-4" />
                  Excel (XLSX)
                </button>
                <button
                  onClick={() => handleExportSpreadsheet("csv")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-stone-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
                >
                  <FileSpreadsheet className="size-4" />
                  CSV
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full right-0 mt-2 w-64 p-3 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50 flex flex-col gap-1"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <span className="text-sm font-medium text-red-800 leading-snug">
                  {error}
                </span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
