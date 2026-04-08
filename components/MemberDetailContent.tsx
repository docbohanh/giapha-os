"use client";

import DefaultAvatar from "@/components/DefaultAvatar";
import RelationshipManager from "@/components/RelationshipManager";
import { Person } from "@/types";
import {
  calculateAge,
  formatDisplayDate,
  getLunarDateString,
} from "@/utils/dateHelpers";
import {
  setDefaultRootNode,
  setUserRootNode,
  updateMemberNote,
  updateDeathDate,
  updateBirthDate,
} from "@/app/actions/member";
import CommentSection from "@/components/CommentSection";
import SubmitEditRequestModal from "@/components/SubmitEditRequestModal";
import { AnimatePresence, motion, Variants } from "framer-motion";
import {
  Briefcase,
  Check,
  ClipboardEdit,
  ExternalLink,
  Info,
  Leaf,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Skull,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface MemberDetailContentProps {
  person: Person;
  privateData: Record<string, unknown> | null;
  isAdmin: boolean;
  isUser?: boolean;
  userSavedRootId?: string | null;
  onLinkClick?: () => void;
  onSave?: () => void;
}

export default function MemberDetailContent({
  person,
  privateData,
  isAdmin,
  isUser = false,
  userSavedRootId = null,
  onLinkClick,
  onSave,
}: MemberDetailContentProps) {
  const fullPerson = { ...person, ...privateData };
  const isDeceased = person.is_deceased;
  const pathname = usePathname();
  const router = useRouter();
  const isModalView = pathname !== `/dashboard/members/${person.id}`;
  const [isPending, startTransition] = useTransition();
  const isCurrentRoot = !!person.is_default_root_node;
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Death date quick edit
  const [deathEditOpen, setDeathEditOpen] = useState(false);
  const [isDeceasedToggle, setIsDeceasedToggle] = useState(person.is_deceased);
  const [deathDay, setDeathDay] = useState<string>(person.death_day?.toString() ?? "");
  const [deathMonth, setDeathMonth] = useState<string>(person.death_month?.toString() ?? "");
  const [deathYear, setDeathYear] = useState<string>(person.death_year?.toString() ?? "");
  const [deathSaving, setDeathSaving] = useState(false);
  const [deathError, setDeathError] = useState<string | null>(null);

  const openDeathEdit = () => {
    setIsDeceasedToggle(person.is_deceased);
    setDeathDay(person.death_day?.toString() ?? "");
    setDeathMonth(person.death_month?.toString() ?? "");
    setDeathYear(person.death_year?.toString() ?? "");
    setDeathError(null);
    setDeathEditOpen(true);
  };

  const saveDeathDate = async () => {
    setDeathSaving(true);
    setDeathError(null);
    try {
      const day = isDeceasedToggle && deathDay ? parseInt(deathDay) : null;
      const month = isDeceasedToggle && deathMonth ? parseInt(deathMonth) : null;
      const year = isDeceasedToggle && deathYear ? parseInt(deathYear) : null;
      await updateDeathDate(person.id, day, month, year, isDeceasedToggle);
      setDeathEditOpen(false);
      onSave?.();
      router.refresh();
    } catch (err: unknown) {
      setDeathError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setDeathSaving(false);
    }
  };

  // Birth date quick edit
  const [birthEditOpen, setBirthEditOpen] = useState(false);
  const [birthDay, setBirthDay] = useState<string>(person.birth_day?.toString() ?? "");
  const [birthMonth, setBirthMonth] = useState<string>(person.birth_month?.toString() ?? "");
  const [birthYear, setBirthYear] = useState<string>(person.birth_year?.toString() ?? "");
  const [birthSaving, setBirthSaving] = useState(false);
  const [birthError, setBirthError] = useState<string | null>(null);

  const openBirthEdit = () => {
    setBirthDay(person.birth_day?.toString() ?? "");
    setBirthMonth(person.birth_month?.toString() ?? "");
    setBirthYear(person.birth_year?.toString() ?? "");
    setBirthError(null);
    setBirthEditOpen(true);
  };

  const saveBirthDate = async () => {
    setBirthSaving(true);
    setBirthError(null);
    try {
      const day = birthDay ? parseInt(birthDay) : null;
      const month = birthMonth ? parseInt(birthMonth) : null;
      const year = birthYear ? parseInt(birthYear) : null;
      await updateBirthDate(person.id, day, month, year);
      setBirthEditOpen(false);
      onSave?.();
      router.refresh();
    } catch (err: unknown) {
      setBirthError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setBirthSaving(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="bg-stone-50/50"
      >
        {/* Header / Cover */}
        <div className="h-28 sm:h-36 bg-linear-to-r from-stone-200 via-stone-100 to-stone-200 relative shrink-0">
          {/* Decorative blur in cover */}
          <div
            className={`absolute right-0 -top-20 w-64 h-64 rounded-full blur-[60px] opacity-40 ${person.gender === "male" ? "bg-sky-300" : person.gender === "female" ? "bg-rose-300" : "bg-stone-300"}`}
          />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full blur-[60px] opacity-20 bg-amber-200" />

          <motion.div
            variants={itemVariants}
            className={`absolute -bottom-12 sm:-bottom-16 left-6 sm:left-8 h-24 w-24 sm:h-32 sm:w-32 rounded-[8px] border-4 sm:border-[6px] border-white flex items-center justify-center text-3xl sm:text-4xl font-bold text-white overflow-hidden shadow-xl shrink-0 z-10
           ${person.gender === "male"
                ? "bg-linear-to-br from-sky-400 to-sky-700"
                : person.gender === "female"
                  ? "bg-linear-to-br from-rose-400 to-rose-700"
                  : "bg-linear-to-br from-stone-400 to-stone-600"
              }`}
          >
            {person.avatar_url ? (
              <Image
                unoptimized
                src={person.avatar_url}
                alt={person.full_name}
                width={128}
                height={128}
                className="h-full w-full object-cover"
              />
            ) : (
              <DefaultAvatar gender={person.gender} isDeceased={isDeceased} />
            )}
          </motion.div>
        </div>

        <div className="pt-16 sm:pt-20 px-6 sm:px-8 pb-8 relative z-10">
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-sans font-bold text-stone-900 flex items-center gap-2 sm:gap-3 flex-wrap">
                {fullPerson.full_name}
                {isDeceased && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-[10px] sm:text-xs font-sans font-bold text-stone-500 border border-stone-200/80 bg-stone-100/50 rounded-md px-2 py-0.5 whitespace-nowrap uppercase tracking-wider shadow-xs">
                      Đã mất
                    </span>
                  </span>
                )}
                {person.is_in_law && (
                  <span
                    className={`text-[10px] sm:text-xs font-sans font-bold rounded-md px-2 py-0.5 whitespace-nowrap shadow-xs border uppercase tracking-wider ${person.gender === "female"
                      ? "text-rose-700 bg-rose-50/50 border-rose-200/60"
                      : person.gender === "male"
                        ? "text-sky-700 bg-sky-50/50 border-sky-200/60"
                        : "text-stone-700 bg-stone-50/50 border-stone-200/60"
                      }`}
                  >
                    {person.gender === "female"
                      ? "Dâu"
                      : person.gender === "male"
                        ? "Rể"
                        : "Khách"}
                  </span>
                )}
              </h1>

              <div className="flex flex-wrap gap-2 mt-3">
                {isAdmin && person.gender === "male" && (
                  <button
                    disabled={isPending || isCurrentRoot}
                    onClick={() => {
                      startTransition(async () => {
                        await setDefaultRootNode(person.id);
                        router.push(`/dashboard?rootId=${person.id}`);
                        onLinkClick?.();
                      });
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shadow-sm ${isCurrentRoot
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200/60 cursor-default"
                      : isPending
                        ? "text-amber-500 bg-amber-50 border-amber-200/60 cursor-wait"
                        : "text-amber-700 bg-emerald-50 border-emerald-200/60 hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer"
                      }`}
                    title="Đặt làm gốc mặc định cho TẤT CẢ mọi người"
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isCurrentRoot ? ("✅ ") : ("🌍 ")}
                    {isCurrentRoot ? " Đang là gốc mặc định" : isPending ? " Đang đặt..." : " Đặt làm gốc hệ thống"}
                  </button>
                )}

                {isUser && person.gender === "male" && (
                  <button
                    disabled={isPending || userSavedRootId === person.id}
                    onClick={() => {
                      startTransition(async () => {
                        await setUserRootNode(person.id);
                        router.push(`/dashboard?rootId=${person.id}`);
                        onLinkClick?.();
                      });
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shadow-sm ${userSavedRootId === person.id
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200/60 cursor-default"
                      : isPending
                        ? "text-amber-500 bg-amber-50 border-amber-200/60 cursor-wait"
                        : "text-amber-700 bg-amber-50 border-amber-200/60 hover:bg-amber-100 hover:border-amber-300 cursor-pointer"
                      }`}
                    title="Đặt làm gốc cây cho riêng bạn"
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : userSavedRootId === person.id ? ("✅ ") : ("🌳 ")}
                    {userSavedRootId === person.id ? " Đang là gốc của tôi" : isPending ? " Đang đặt..." : " Đặt làm gốc của tôi"}
                  </button>
                )}

                {isUser && !isAdmin && (
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 text-stone-700 bg-white hover:bg-stone-50 cursor-pointer transition-colors shadow-sm"
                  >
                    <ClipboardEdit className="w-3.5 h-3.5" />
                    Yêu cầu chỉnh sửa
                  </button>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {/* Birth Card */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-stone-200/60 shadow-sm transition-all hover:shadow-md hover:border-amber-200/60"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                    <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                      Sinh
                    </h3>
                    {isAdmin && isModalView && (
                      <button
                        onClick={openBirthEdit}
                        title="Sửa nhanh ngày sinh"
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200/80 text-stone-500 hover:text-stone-700 transition-colors cursor-pointer shadow-xs"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5 pl-4 border-l-2 border-stone-100">
                    <p className="text-stone-800 font-semibold text-sm sm:text-base">
                      {formatDisplayDate(
                        person.birth_year,
                        person.birth_month,
                        person.birth_day,
                      )}
                    </p>
                    {(person.birth_year ||
                      person.birth_month ||
                      person.birth_day) && (
                        <p className="text-sm font-medium text-stone-500 flex items-center gap-1.5">
                          <span className="text-[10px] border border-stone-200/60 bg-stone-50/80 rounded px-1.5 py-0.5">
                            Âm lịch
                          </span>
                          {getLunarDateString(
                            person.birth_year,
                            person.birth_month,
                            person.birth_day,
                          ) || "Chưa rõ"}
                        </p>
                      )}
                  </div>
                </motion.div>

                {/* Death Card */}
                {!isDeceased && isAdmin && (
                  <button
                    onClick={openDeathEdit}
                    title="Đánh dấu đã mất"
                    className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-sans font-semibold text-stone-400 border border-dashed border-stone-300 bg-transparent hover:bg-stone-100 hover:text-stone-600 rounded-xl px-2 py-1 transition-colors cursor-pointer"
                  >
                    <Skull className="w-3 h-3" />
                    Đã mất
                  </button>
                )}
                {isDeceased && (
                  <motion.div
                    variants={itemVariants}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-stone-200/60 shadow-sm transition-all hover:shadow-md hover:border-amber-200/60"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-stone-400 shadow-[0_0_8px_rgba(156,163,175,0.5)]"></span>
                      <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                        Mất
                      </h3>

                      {isAdmin && isModalView && (
                        <button
                          onClick={openDeathEdit}
                          title="Sửa nhanh ngày mất"
                          className="w-5 h-5 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200/80 text-stone-500 hover:text-stone-700 transition-colors cursor-pointer shadow-xs"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5 pl-4 border-l-2 border-stone-100">
                      <p className="text-stone-800 font-semibold text-sm sm:text-base">
                        {formatDisplayDate(
                          person.death_year,
                          person.death_month,
                          person.death_day,
                        )}
                      </p>
                      {(person.death_year ||
                        person.death_month ||
                        person.death_day) && (
                          <p className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                            <span className="text-[10px] border border-stone-200/60 bg-stone-50/80 rounded px-1.5 py-0.5">
                              Âm lịch
                            </span>
                            {getLunarDateString(
                              person.death_year,
                              person.death_month,
                              person.death_day,
                            ) || "Chưa rõ"}
                          </p>
                        )}
                    </div>
                  </motion.div>
                )}

                {/* Age Card */}
                {(() => {
                  const ageData = calculateAge(
                    person.birth_year,
                    person.death_year,
                  );
                  if (!ageData) return null;
                  return (
                    <motion.div
                      variants={itemVariants}
                      className="bg-linear-to-br from-amber-50 to-orange-50/40 rounded-2xl p-4 border border-amber-200/50 shadow-sm transition-all hover:shadow-md flex flex-col justify-center relative overflow-hidden"
                    >
                      <Leaf className="absolute -bottom-4 -right-4 w-20 h-20 text-amber-500/10 rotate-12" />
                      <div className="flex items-center gap-2 mb-1.5 relative z-10">
                        <span
                          className={`w-2 h-2 rounded-full ${ageData.isDeceased ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"}`}
                        ></span>
                        <p className="text-[11px] font-bold text-amber-800/60 uppercase tracking-widest">
                          {ageData.isDeceased
                            ? ageData.age >= 60
                              ? "Hưởng thọ"
                              : "Hưởng dương"
                            : "Tuổi"}
                        </p>
                      </div>
                      <div className="pl-4 relative z-10">
                        <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-linear-to-br from-amber-700 to-amber-900 tracking-tight">
                          {ageData.age}
                          <span className="text-xs sm:text-sm font-bold text-amber-700/60 ml-1.5 uppercase tracking-wider">
                            tuổi
                          </span>
                        </p>
                      </div>
                    </motion.div>
                  );
                })()}
              </div>
            </div>
          </motion.div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-8">
              <motion.section variants={itemVariants}>
                <h2 className="text-base sm:text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-amber-600" />
                  Ghi chú
                </h2>
                <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-6 rounded-2xl border border-stone-200/60 shadow-sm">
                  <p className="text-stone-600 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                    {person.note || (
                      <span className="text-stone-400 italic">Chưa có ghi chú.</span>
                    )}
                  </p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants}>
                <h2 className="text-base sm:text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  Gia đình
                </h2>
                <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-stone-200/60 shadow-sm relative z-0">
                  <RelationshipManager
                    personId={person.id}
                    isAdmin={isAdmin}
                    personGender={person.gender}
                  />
                </div>
              </motion.section>
            </div>

            {/* Sidebar / Private Info */}
            <div className="space-y-6">
              <motion.div variants={itemVariants}>
                {isAdmin ? (
                  <div className="bg-stone-50 p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-sm">
                    <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2 text-sm sm:text-base border-b border-stone-200/60 pb-3">
                      <span className="bg-amber-100/80 text-amber-700 p-1.5 rounded-lg border border-amber-200/50">
                        🔒
                      </span>
                      Thông tin liên hệ
                    </h3>
                    <dl className="space-y-4 text-sm sm:text-base">
                      <div>
                        <dt className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                          <Phone className="w-3.5 h-3.5" /> Số điện thoại
                        </dt>
                        <dd className="text-stone-900 font-medium bg-white px-3 py-2 rounded-lg border border-stone-200/60 shadow-xs">
                          {(fullPerson.phone_number as string) || (
                            <span className="text-stone-400 font-normal">
                              Chưa cập nhật
                            </span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                          <Briefcase className="w-3.5 h-3.5" /> Nghề nghiệp
                        </dt>
                        <dd className="text-stone-900 font-medium bg-white px-3 py-2 rounded-lg border border-stone-200/60 shadow-xs">
                          {(fullPerson.occupation as string) || (
                            <span className="text-stone-400 font-normal">
                              Chưa cập nhật
                            </span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                          <MapPin className="w-3.5 h-3.5" /> Nơi ở hiện tại
                        </dt>
                        <dd className="text-stone-900 font-medium bg-white px-3 py-2 rounded-lg border border-stone-200/60 shadow-xs">
                          {(fullPerson.current_residence as string) || (
                            <span className="text-stone-400 font-normal">
                              Chưa cập nhật
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ) : (
                  <div className="bg-stone-50/50 p-5 rounded-2xl border border-stone-200 border-dashed flex flex-col items-center justify-center text-center gap-2">
                    <span className="text-2xl opacity-50">🔒</span>
                    <p className="text-sm font-medium text-stone-500">
                      Thông tin liên hệ chỉ hiển thị với Quản trị viên.
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Link action (Only show in Modal view) */}
              {isModalView && (
                <motion.div variants={itemVariants} className="pt-2">
                  <Link
                    href={`/dashboard/members/${person.id}`}
                    onClick={onLinkClick}
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-amber-700 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors border border-amber-200/60 shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Mở trang chi tiết đầy đủ
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <CommentSection
        memberId={person.id}
        isAdmin={isAdmin}
      />

      <SubmitEditRequestModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        persons={[{ id: person.id, full_name: person.full_name }]}
        preselectedPersonId={person.id}
      />

      {/* Birth Date Quick Edit Popup */}
      {birthEditOpen && isModalView && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-stone-200 p-6">
            <button
              onClick={() => setBirthEditOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-5">
              <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200">
                <Leaf className="w-4 h-4 text-emerald-600" />
              </span>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Sửa nhanh ngày sinh</h3>
                <p className="text-xs text-stone-500">{person.full_name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Ngày sinh dương lịch (để trống nếu không rõ)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="Ngày"
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 font-semibold text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent shadow-xs"
                  />
                  <input
                    type="number"
                    min={1}
                    max={12}
                    placeholder="Tháng"
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 font-semibold text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent shadow-xs"
                  />
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    placeholder="Năm"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 font-semibold text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent shadow-xs"
                  />
                </div>
              </div>

              {birthError && (
                <p className="text-sm text-red-600 font-medium bg-red-50 rounded-xl px-3 py-2 border border-red-100">
                  {birthError}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setBirthEditOpen(false)}
                disabled={birthSaving}
                className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={saveBirthDate}
                disabled={birthSaving}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {birthSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                ) : (
                  <><Check className="w-4 h-4" /> Lưu</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Death Date Quick Edit Popup */}
      {deathEditOpen && isModalView && (

        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-stone-200 p-6">
            <button
              onClick={() => setDeathEditOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-5">
              <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-stone-100 border border-stone-200">
                <Skull className="w-4 h-4 text-stone-600" />
              </span>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Sửa nhanh ngày mất</h3>
                <p className="text-xs text-stone-500">{person.full_name}</p>
              </div>
            </div>

            <div className="bg-stone-50/50 p-4 rounded-2xl border border-stone-200/60 shadow-xs space-y-0">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={isDeceasedToggle}
                    onChange={(e) => {
                      setIsDeceasedToggle(e.target.checked);
                      if (!e.target.checked) {
                        setDeathDay("");
                        setDeathMonth("");
                        setDeathYear("");
                      }
                    }}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-stone-300 rounded peer-checked:bg-stone-600 peer-checked:border-stone-600 transition-colors flex items-center justify-center">
                    <motion.svg
                      initial={false}
                      animate={{
                        opacity: isDeceasedToggle ? 1 : 0,
                        scale: isDeceasedToggle ? 1 : 0.5,
                      }}
                      className="w-3 h-3 text-white pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={4}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  </div>
                </div>
                <span className="text-sm font-semibold text-stone-700 group-hover:text-stone-900 transition-colors">
                  Đã qua đời
                </span>
              </label>

              <AnimatePresence>
                {isDeceasedToggle && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                      Ngày mất (để trống nếu không rõ)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="Ngày"
                        value={deathDay}
                        onChange={(e) => setDeathDay(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-semibold text-sm text-center focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent shadow-xs"
                      />
                      <input
                        type="number"
                        min={1}
                        max={12}
                        placeholder="Tháng"
                        value={deathMonth}
                        onChange={(e) => setDeathMonth(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-semibold text-sm text-center focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent shadow-xs"
                      />
                      <input
                        type="number"
                        min={1900}
                        max={2100}
                        placeholder="Năm"
                        value={deathYear}
                        onChange={(e) => setDeathYear(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-semibold text-sm text-center focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent shadow-xs"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeathEditOpen(false)}
                disabled={deathSaving}
                className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={saveDeathDate}
                disabled={deathSaving}
                className="flex-1 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deathSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                ) : (
                  <><Check className="w-4 h-4" /> Lưu</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
