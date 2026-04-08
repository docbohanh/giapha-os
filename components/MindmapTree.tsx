"use client";

import { Person, Relationship } from "@/types";
import { formatDisplayDate } from "@/utils/dateHelpers";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, MoreHorizontal, Share2, UserPlus, Users, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDashboard } from "./DashboardContext";
import DefaultAvatar from "./DefaultAvatar";

interface MindmapTreeProps {
  personsMap: Map<string, Person>;
  relationships: Relationship[];
  roots: Person[];
  isAdmin?: boolean;
}

interface QuickAction {
  personId: string;
  personName: string;
  personGender: string;
  mode: "child" | "spouse";
  spouses: { personId: string; name: string; note?: string | null }[];
}

export default function MindmapTree({
  personsMap,
  relationships,
  roots,
  isAdmin = false,
}: MindmapTreeProps) {
  const { showAvatar, setMemberModalId, hideSpouses, hideFemales, treeScale } = useDashboard();
  const supabase = createClient();
  const router = useRouter();

  const [quickAction, setQuickAction] = useState<QuickAction | null>(null);

  // Helper function to resolve tree connections for a person
  const getTreeData = (personId: string) => {
    const spousesList = relationships
      .filter(
        (r) =>
          r.type === "marriage" &&
          (r.person_a === personId || r.person_b === personId),
      )
      .map((r) => {
        const spouseId = r.person_a === personId ? r.person_b : r.person_a;
        return {
          person: personsMap.get(spouseId)!,
          note: r.note,
        };
      })
      .filter((s) => s.person)
      .filter((s) => {
        if (hideSpouses) return false;
        if (hideFemales && s.person.gender === "female") return false;
        return true;
      });

    const childRels = relationships.filter(
      (r) =>
        (r.type === "biological_child" || r.type === "adopted_child") &&
        r.person_a === personId,
    );

    const childrenList = childRels
      .map((r) => personsMap.get(r.person_b))
      .filter((p) => {
        if (!p) return false;
        if (hideFemales && p.gender === "female") return false;
        return true;
      }) as Person[];

    return {
      person: personsMap.get(personId)!,
      spouses: spousesList,
      children: childrenList,
    };
  };

  const MindmapNode = ({
    personId,
    level = 0,
    isLast = false,
  }: {
    personId: string;
    level?: number;
    isLast?: boolean;
  }) => {
    const data = getTreeData(personId);
    if (!data.person) return null;

    if (hideFemales && data.person.gender === "female") return null;

    const [isExpanded, setIsExpanded] = useState(level < 2);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!menuOpen) return;
      const handler = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setMenuOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [menuOpen]);

    const hasChildren = data.children.length > 0;

    return (
      <div className="relative pl-6 py-1.5">
        {/* Draw the connecting L-shape line from the parent to this node */}
        {level > 0 && (
          <>
            <div
              className="absolute border-l-[1.5px] border-stone-300"
              style={{
                left: "0",
                top: isLast ? "-16px" : "-16px",
                bottom: isLast ? "auto" : "-16px",
                height: isLast ? "40px" : "100%",
              }}
            ></div>
            <div
              className="absolute border-b-[1.5px] border-stone-300 rounded-bl-xl"
              style={{
                left: "0",
                top: "24px",
                width: "24px",
                height: "24px",
              }}
            ></div>
          </>
        )}

        <div className="flex items-center gap-2 group relative z-10">
          {/* Expand/Collapse Toggle or spacer */}
          <div className="w-5 h-5 flex items-center justify-center shrink-0 z-10 bg-transparent">
            {hasChildren ? (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-5 h-5 flex items-center justify-center bg-white hover:bg-amber-50 border border-stone-200 rounded shadow-sm text-stone-500 hover:text-amber-600 focus:outline-none transition-colors"
                aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
              >
                {isExpanded ? (
                  <ChevronDown strokeWidth={2.5} className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight strokeWidth={2.5} className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-stone-300 ring-2 ring-white"></div>
            )}
          </div>

          {(() => {
            return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`group/card relative flex flex-wrap items-center gap-2 bg-white/60 backdrop-blur-md rounded-2xl border border-stone-200/60 p-2 sm:p-2.5 shadow-sm hover:border-amber-300 hover:shadow-md hover:bg-white/90 transition-all duration-300 overflow-hidden cursor-pointer
                  ${data.person.is_deceased ? "opacity-80 grayscale-[0.3]" : ""}`}
                onClick={() => setMemberModalId(data.person.id)}
              >
                <div className="flex items-center gap-2.5 relative z-10 w-full">
                  <div className="flex flex-1 items-center gap-2.5 min-w-0">
                    {showAvatar && (
                      <div className="relative shrink-0">
                        <div
                          className={`w-10 h-10 rounded-[4px] overflow-hidden flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white transition-transform duration-300 group-hover/card:scale-105
                      ${data.person.gender === "male"
                              ? "bg-linear-to-br from-sky-400 to-sky-700"
                              : data.person.gender === "female"
                                ? "bg-linear-to-br from-rose-400 to-rose-700"
                                : "bg-linear-to-br from-stone-400 to-stone-600"
                            }`}
                        >
                          {data.person.avatar_url ? (
                            <Image
                              unoptimized
                              src={data.person.avatar_url}
                              alt={data.person.full_name}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <DefaultAvatar gender={data.person.gender} isDeceased={data.person.is_deceased} />
                          )}
                        </div>
                      </div>
                    )}
                    <div className={`flex flex-col ${showAvatar ? "min-w-0 flex-1" : ""}`}>
                      <span className={`font-bold text-[14px] text-stone-900 group-hover/card:text-amber-700 transition-colors leading-tight mb-0.5 ${showAvatar ? "truncate" : "break-words whitespace-normal"}`}>
                        {showAvatar
                          ? data.person.full_name.toUpperCase()
                          : data.person.full_name.split(" ").map((word, i) => (
                            <span key={i} className="block text-center">{word.toUpperCase()}</span>
                          ))}
                      </span>
                      <span className="text-[11px] text-stone-500 font-medium truncate flex items-center gap-1">
                        <svg
                          className="w-3 h-3 text-stone-400 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="truncate">
                          {formatDisplayDate(
                            data.person.birth_year,
                            data.person.birth_month,
                            data.person.birth_day,
                          )}
                          {data.person.is_deceased &&
                            ` → ${formatDisplayDate(data.person.death_year, data.person.death_month, data.person.death_day)}`}
                        </span>
                      </span>
                      {(data.person.is_deceased || data.person.is_in_law) && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5 shrink-0">
                          {data.person.is_in_law && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest shadow-xs border ${data.person.gender === "male"
                                ? "bg-sky-50 text-sky-700 border-sky-200/60"
                                : data.person.gender === "female"
                                  ? "bg-rose-50 text-rose-700 border-rose-200/60"
                                  : "bg-stone-50 text-stone-700 border-stone-200/60"
                                }`}
                            >
                              {data.person.gender === "male"
                                ? "Rể"
                                : data.person.gender === "female"
                                  ? "Dâu"
                                  : "Khách"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Spouses attached to node */}
                  {data.spouses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 ml-1 pl-2 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-px before:h-[70%] before:bg-stone-200/80">
                      {data.spouses.map((spouseData) => {
                        return (
                          <div
                            key={spouseData.person.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMemberModalId(spouseData.person.id);
                            }}
                            className={`flex flex-col items-center gap-1 bg-stone-50/50 hover:bg-white rounded-xl p-1.5 border border-stone-200/60 hover:border-amber-300 transition-all shadow-sm hover:shadow-md group/spouse cursor-pointer
                              ${spouseData.person.is_deceased ? "opacity-80 grayscale-[0.3]" : ""}`}
                            title={
                              spouseData.note ||
                              (spouseData.person.gender === "male"
                                ? "Chồng"
                                : "Vợ")
                            }
                          >
                            {showAvatar && (
                              <div
                                className={`w-8 h-8 rounded-[5px] overflow-hidden flex items-center justify-center text-white text-[10px] font-bold shadow-sm ring-2 ring-white transition-transform duration-300 group-hover/spouse:scale-105
                          ${spouseData.person.gender === "male"
                                    ? "bg-linear-to-br from-sky-400 to-sky-700"
                                    : spouseData.person.gender === "female"
                                      ? "bg-linear-to-br from-rose-400 to-rose-700"
                                      : "bg-linear-to-br from-stone-400 to-stone-600"
                                  }`}
                              >
                                {spouseData.person.avatar_url ? (
                                  <Image
                                    unoptimized
                                    src={spouseData.person.avatar_url}
                                    alt={spouseData.person.full_name}
                                    width={32}
                                    height={32}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <DefaultAvatar
                                    gender={spouseData.person.gender}
                                    isDeceased={spouseData.person.is_deceased}
                                  />
                                )}
                              </div>
                            )}
                            <span className="text-[10px] font-bold text-stone-600 truncate max-w-[50px] text-center">
                              {spouseData.person.full_name.split(" ").pop()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })()}

          {/* Admin Quick Action Menu */}
          {isAdmin && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/80 hover:bg-amber-50 border border-stone-200 text-stone-400 hover:text-amber-600 shadow-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Thao tác nhanh"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-stone-200 py-1 min-w-[150px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      setQuickAction({
                        personId: data.person.id,
                        personName: data.person.full_name,
                        personGender: data.person.gender,
                        mode: "child",
                        spouses: data.spouses.map((s) => ({
                          personId: s.person.id,
                          name: s.person.full_name,
                          note: s.note,
                        })),
                      });
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Thêm con
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      setQuickAction({
                        personId: data.person.id,
                        personName: data.person.full_name,
                        personGender: data.person.gender,
                        mode: "spouse",
                        spouses: [],
                      });
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Thêm vợ/chồng
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Children Container */}
        <AnimatePresence initial={false}>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="origin-top relative z-0 mt-[-16px] pt-[16px] overflow-hidden"
            >
              <div className="pb-1">
                {data.children.map((child, index) => (
                  <MindmapNode
                    key={child.id}
                    personId={child.id}
                    level={level + 1}
                    isLast={index === data.children.length - 1}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ── Quick Add Children Modal ─────────────────────────────────────────────
  const QuickAddChildModal = ({ action }: { action: QuickAction }) => {
    const [selectedSpouseId, setSelectedSpouseId] = useState("unknown");
    const [bulkChildren, setBulkChildren] = useState([
      { name: "", gender: "male" as "male" | "female" | "other", birthYear: "" },
    ]);
    const [processing, setProcessing] = useState(false);

    const handleSave = async () => {
      const valid = bulkChildren.filter((c) => c.name.trim() !== "");
      if (valid.length === 0) return;
      setProcessing(true);
      let successCount = 0;
      try {
        for (const child of valid) {
          const payload: { full_name: string; gender: string; birth_year?: number } = {
            full_name: child.name.trim(),
            gender: child.gender,
          };
          if (child.birthYear.trim()) {
            const y = parseInt(child.birthYear);
            if (!isNaN(y)) payload.birth_year = y;
          }
          const { data: newPerson, error } = await supabase
            .from("persons")
            .insert(payload)
            .select("id")
            .single();
          if (error || !newPerson) continue;

          await supabase.from("relationships").insert({
            person_a: action.personId,
            person_b: newPerson.id,
            type: "biological_child",
          });

          if (selectedSpouseId && selectedSpouseId !== "unknown") {
            await supabase.from("relationships").insert({
              person_a: selectedSpouseId,
              person_b: newPerson.id,
              type: "biological_child",
            });
          }
          successCount++;
        }
        if (successCount < valid.length) {
          alert(`Chỉ lưu thành công ${successCount}/${valid.length} người.`);
        }
        setQuickAction(null);
        router.refresh();
      } catch (err) {
        alert("Lỗi: " + (err as Error).message);
      } finally {
        setProcessing(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setQuickAction(null)} />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative bg-white rounded-2xl shadow-2xl border border-sky-100 w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-sky-100 bg-sky-50/60">
            <div>
              <h3 className="font-bold text-sky-900 text-base">Thêm Nhanh Nhiều Con</h3>
              <p className="text-xs text-sky-600 mt-0.5">Cha/Mẹ: <span className="font-semibold">{action.personName}</span></p>
            </div>
            <button onClick={() => setQuickAction(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sky-100 text-sky-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Spouse selector */}
            {action.spouses.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Chọn người mẹ/cha còn lại</label>
                <select
                  value={selectedSpouseId}
                  onChange={(e) => setSelectedSpouseId(e.target.value)}
                  className="w-full text-sm rounded-lg border-stone-300 border p-2 bg-white text-stone-900 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                >
                  <option value="unknown">Không rõ (hoặc chưa thêm)</option>
                  {action.spouses.map((s) => (
                    <option key={s.personId} value={s.personId}>
                      {s.name}{s.note ? ` (${s.note})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Children list */}
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-2">Danh sách các con</label>
              <div className="space-y-2">
                {bulkChildren.map((child, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <span className="text-stone-400 text-xs w-5 shrink-0">{index + 1}.</span>
                    <input
                      type="text"
                      placeholder="Họ và tên..."
                      value={child.name}
                      onChange={(e) => {
                        const next = [...bulkChildren];
                        next[index].name = e.target.value;
                        setBulkChildren(next);
                      }}
                      className="flex-1 text-sm rounded-md border-stone-300 border p-2 bg-white text-stone-900 shadow-sm focus:border-sky-500 focus:ring-sky-500 min-w-0"
                    />
                    <select
                      value={child.gender}
                      onChange={(e) => {
                        const next = [...bulkChildren];
                        next[index].gender = e.target.value as "male" | "female" | "other";
                        setBulkChildren(next);
                      }}
                      className="text-sm rounded-md border-stone-300 border p-2 bg-white text-stone-900 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Năm sinh"
                      value={child.birthYear}
                      onChange={(e) => {
                        const next = [...bulkChildren];
                        next[index].birthYear = e.target.value;
                        setBulkChildren(next);
                      }}
                      className="w-24 text-sm rounded-md border-stone-300 border p-2 bg-white text-stone-900 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                    />
                    <button
                      onClick={() => {
                        const next = bulkChildren.filter((_, i) => i !== index);
                        setBulkChildren(next.length === 0 ? [{ name: "", gender: "male", birthYear: "" }] : next);
                      }}
                      className="text-stone-400 hover:text-red-500 p-1 shrink-0 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setBulkChildren([...bulkChildren, { name: "", gender: "male", birthYear: "" }])}
                className="mt-2 text-sky-600 text-xs font-semibold hover:text-sky-800 transition-colors"
              >
                + Thêm dòng
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-5 py-4 border-t border-stone-100">
            <button
              onClick={handleSave}
              disabled={processing || bulkChildren.every((c) => c.name.trim() === "")}
              className="flex-1 bg-sky-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {processing ? "Đang lưu..." : "Lưu Tất Cả"}
            </button>
            <button
              onClick={() => setQuickAction(null)}
              className="px-4 py-2.5 bg-white border border-stone-300 text-stone-700 rounded-lg text-sm hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // ── Quick Add Spouse Modal ───────────────────────────────────────────────
  const QuickAddSpouseModal = ({ action }: { action: QuickAction }) => {
    const [name, setName] = useState("");
    const [birthYear, setBirthYear] = useState("");
    const [note, setNote] = useState("");
    const [processing, setProcessing] = useState(false);

    const defaultSpouseGender =
      action.personGender === "male" ? "female" : action.personGender === "female" ? "male" : "female";

    const handleSave = async () => {
      if (!name.trim()) { alert("Vui lòng nhập tên Vợ/Chồng."); return; }
      setProcessing(true);
      try {
        const payload: { full_name: string; gender: string; birth_year?: number } = {
          full_name: name.trim(),
          gender: defaultSpouseGender,
        };
        if (birthYear.trim()) {
          const y = parseInt(birthYear);
          if (!isNaN(y)) payload.birth_year = y;
        }

        const { data: newPerson, error: insertError } = await supabase
          .from("persons")
          .insert(payload)
          .select("id")
          .single();
        if (insertError || !newPerson) throw insertError;

        const { error: relError } = await supabase.from("relationships").insert({
          person_a: action.personId,
          person_b: newPerson.id,
          type: "marriage",
          note: note.trim() || null,
        });
        if (relError) throw relError;

        setQuickAction(null);
        router.refresh();
      } catch (err) {
        alert("Lỗi: " + (err as Error).message);
      } finally {
        setProcessing(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setQuickAction(null)} />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative bg-white rounded-2xl shadow-2xl border border-rose-100 w-full max-w-sm overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100 bg-rose-50/60">
            <div>
              <h3 className="font-bold text-rose-900 text-base">Thêm Nhanh Vợ/Chồng</h3>
              <p className="text-xs text-rose-600 mt-0.5">Cho: <span className="font-semibold">{action.personName}</span></p>
            </div>
            <button onClick={() => setQuickAction(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-100 text-rose-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-rose-700 mb-1">Họ và Tên *</label>
              <input
                type="text"
                placeholder="Nhập họ và tên..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full text-sm rounded-lg border-stone-300 border p-2.5 bg-white text-stone-900 shadow-sm focus:border-rose-500 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-rose-700 mb-1">Năm sinh (Tuỳ chọn)</label>
              <input
                type="number"
                placeholder="VD: 1980"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full text-sm rounded-lg border-stone-300 border p-2.5 bg-white text-stone-900 shadow-sm focus:border-rose-500 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-rose-700 mb-1">Ghi chú (Ví dụ: Vợ cả, Chồng thứ...)</label>
              <input
                type="text"
                placeholder="Tuỳ chọn..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-sm rounded-lg border-stone-300 border p-2.5 bg-white text-stone-900 shadow-sm focus:border-rose-500 focus:ring-rose-500"
              />
            </div>
            <p className="text-xs text-stone-400 italic">
              * Giới tính sẽ tự động gán là {defaultSpouseGender === "female" ? "Nữ" : "Nam"} (dựa theo giới tính người hiện tại).
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-5 py-4 border-t border-stone-100">
            <button
              onClick={handleSave}
              disabled={!name.trim() || processing}
              className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {processing ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              onClick={() => setQuickAction(null)}
              className="px-4 py-2.5 bg-white border border-stone-300 text-stone-700 rounded-lg text-sm hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  if (roots.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-100 mb-4">
          <Share2 className="w-8 h-8 text-stone-300" />
        </div>
        <p className="text-stone-500 font-medium tracking-wide">
          Gia phả trống
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full relative p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-140px)] flex justify-start lg:justify-center overflow-x-auto">
        {/* Root Container */}
        <div
          id="export-container"
          className="font-sans min-w-max pb-20 p-8"
          style={{ transform: `scale(${treeScale})`, transformOrigin: "top center", transition: "transform 0.1s" }}
        >
          {roots.map((root, index) => (
            <MindmapNode
              key={root.id}
              personId={root.id}
              level={0}
              isLast={index === roots.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Quick Action Modals */}
      <AnimatePresence>
        {quickAction?.mode === "child" && (
          <QuickAddChildModal key="child-modal" action={quickAction} />
        )}
        {quickAction?.mode === "spouse" && (
          <QuickAddSpouseModal key="spouse-modal" action={quickAction} />
        )}
      </AnimatePresence>
    </>
  );
}
