"use client";

import { approveEditRequest, deleteEditRequest, rejectEditRequest } from "@/app/actions/member";
import { EditRequest } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

interface AdminRequestListProps {
    initialRequests: EditRequest[];
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
    pending: {
        label: "Chờ duyệt",
        className: "bg-amber-100 text-amber-800 border-amber-200",
    },
    approved: {
        label: "Đã duyệt",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    rejected: {
        label: "Từ chối",
        className: "bg-red-100 text-red-800 border-red-200",
    },
};

export default function AdminRequestList({
    initialRequests,
}: AdminRequestListProps) {
    const [requests, setRequests] = useState<EditRequest[]>(initialRequests);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [noteInputId, setNoteInputId] = useState<string | null>(null);
    const [noteText, setNoteText] = useState("");
    const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);

    const filtered = useMemo(() => {
        return requests.filter((r) => {
            const matchSearch =
                search.trim() === "" ||
                (r.persons?.full_name ?? "")
                    .toLowerCase()
                    .includes(search.toLowerCase()) ||
                (r.user_email ?? "").toLowerCase().includes(search.toLowerCase());
            const matchStatus =
                filterStatus === "all" || r.status === filterStatus;
            return matchSearch && matchStatus;
        });
    }, [requests, search, filterStatus]);

    // Approve ngay, không cần ghi chú
    const handleApprove = async (requestId: string) => {
        setLoadingId(requestId);
        try {
            await approveEditRequest(requestId);
            setRequests((prev) =>
                prev.map((r) =>
                    r.id === requestId
                        ? { ...r, status: "approved", admin_note: null }
                        : r
                )
            );
        } catch (err) {
            alert((err as Error).message || "Đã xảy ra lỗi.");
        } finally {
            setLoadingId(null);
        }
    };

    // Mở panel nhập ghi chú để từ chối
    const openRejectPanel = (id: string) => {
        setNoteInputId(id);
        setPendingAction("reject");
        setNoteText("");
    };

    const handleReject = async (requestId: string) => {
        setLoadingId(requestId);
        try {
            await rejectEditRequest(requestId, noteText);
            setRequests((prev) =>
                prev.map((r) =>
                    r.id === requestId
                        ? { ...r, status: "rejected", admin_note: noteText || null }
                        : r
                )
            );
        } catch (err) {
            alert((err as Error).message || "Đã xảy ra lỗi.");
        } finally {
            setLoadingId(null);
            setNoteInputId(null);
            setPendingAction(null);
        }
    };

    const handleDelete = async (requestId: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xoá yêu cầu này? Thao tác này không thể hoàn tác.")) {
            return;
        }

        setLoadingId(requestId);
        try {
            await deleteEditRequest(requestId);
            setRequests((prev) => prev.filter((r) => r.id !== requestId));
        } catch (err) {
            alert((err as Error).message || "Đã xảy ra lỗi khi xoá.");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên thành viên hoặc email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent shadow-sm"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm text-stone-700 font-medium"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Từ chối</option>
                </select>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="text-center py-16 text-stone-400 text-sm font-medium">
                        Không có yêu cầu nào.
                    </div>
                ) : (
                    filtered.map((req) => {
                        const statusStyle = STATUS_LABEL[req.status] ?? STATUS_LABEL.pending;
                        const isExpanded = expandedId === req.id;
                        const isConfirming = noteInputId === req.id;

                        return (
                            <motion.div
                                key={req.id}
                                layout
                                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden"
                            >
                                {/* Row */}
                                <div className="px-5 py-4 flex items-start gap-4">
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-stone-900 text-sm">
                                                {req.persons?.full_name ?? "—"}
                                            </span>
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusStyle.className}`}
                                            >
                                                {statusStyle.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-stone-500">
                                            Gửi bởi:{" "}
                                            <span className="font-medium text-stone-600">
                                                {req.user_email ?? "—"}
                                            </span>{" "}
                                            · {new Date(req.created_at).toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {req.status === "pending" && (
                                            <>
                                                <button
                                                    disabled={loadingId === req.id}
                                                    onClick={() => handleApprove(req.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                                >
                                                    {loadingId === req.id ? (
                                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <Check className="w-3.5 h-3.5" />
                                                    )}
                                                    Duyệt
                                                </button>
                                                <button
                                                    disabled={loadingId === req.id}
                                                    onClick={() => openRejectPanel(req.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors shadow-sm disabled:opacity-50"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    Từ chối
                                                </button>
                                            </>
                                        )}
                                        <button
                                            disabled={loadingId === req.id}
                                            onClick={() => handleDelete(req.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                            title="Xoá yêu cầu"
                                        >
                                            {loadingId === req.id && pendingAction === null ? (
                                                <span className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() =>
                                                setExpandedId(isExpanded ? null : req.id)
                                            }
                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
                                        >
                                            {isExpanded ? (
                                                <ChevronUp className="w-4 h-4" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            key="expanded"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden border-t border-stone-100"
                                        >
                                            <div className="px-5 py-4 space-y-3">
                                                <div>
                                                    <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                                                        Nội dung yêu cầu
                                                    </p>
                                                    <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed bg-stone-50 rounded-xl px-4 py-3 border border-stone-100">
                                                        {req.content}
                                                    </p>
                                                </div>
                                                {req.admin_note && (
                                                    <div>
                                                        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                                                            Ghi chú admin
                                                        </p>
                                                        <p className="text-sm text-stone-600 italic bg-stone-50 rounded-xl px-4 py-3 border border-stone-100">
                                                            {req.admin_note}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Reject note + confirm panel — chỉ hiện khi từ chối */}
                                    {isConfirming && (
                                        <motion.div
                                            key="confirming"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden border-t border-stone-100"
                                        >
                                            <div className="px-5 py-4 space-y-3 bg-stone-50/60">
                                                <p className="text-sm font-semibold text-stone-700">
                                                    ❌ Xác nhận từ chối yêu cầu này?
                                                </p>
                                                <textarea
                                                    rows={2}
                                                    value={noteText}
                                                    onChange={(e) => setNoteText(e.target.value)}
                                                    placeholder="Ghi chú cho người dùng (không bắt buộc)..."
                                                    className="w-full text-sm bg-white border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                                                />
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setNoteInputId(null);
                                                            setPendingAction(null);
                                                        }}
                                                        className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-lg border border-stone-200 transition-colors"
                                                    >
                                                        Huỷ
                                                    </button>
                                                    <button
                                                        disabled={loadingId === req.id}
                                                        onClick={() => handleReject(req.id)}
                                                        className="px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors disabled:opacity-60 bg-red-600 hover:bg-red-700"
                                                    >
                                                        {loadingId === req.id
                                                            ? "Đang xử lý..."
                                                            : "Xác nhận từ chối"}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div>

            <p className="text-xs text-stone-400 text-center pt-2">
                {filtered.length} / {requests.length} yêu cầu
            </p>
        </div>
    );
}
