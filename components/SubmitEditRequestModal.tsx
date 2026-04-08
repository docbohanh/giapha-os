"use client";

import { submitEditRequest } from "@/app/actions/member";
import { Person } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, Search, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface SubmitEditRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    persons: Pick<Person, "id" | "full_name">[];
    preselectedPersonId?: string;
}

export default function SubmitEditRequestModal({
    isOpen,
    onClose,
    persons,
    preselectedPersonId,
}: SubmitEditRequestModalProps) {
    const [selectedPersonId, setSelectedPersonId] = useState(preselectedPersonId ?? "");
    const [search, setSearch] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedPerson = persons.find((p) => p.id === selectedPersonId);

    const filtered = useMemo(() => {
        if (!search.trim()) return persons;
        return persons.filter((p) =>
            p.full_name.toLowerCase().includes(search.toLowerCase())
        );
    }, [persons, search]);

    useEffect(() => {
        if (isOpen) {
            setSelectedPersonId(preselectedPersonId ?? "");
            setSearch("");
            setContent("");
            setError(null);
            setSuccess(false);
        }
    }, [isOpen, preselectedPersonId]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = async () => {
        if (!selectedPersonId) {
            setError("Vui lòng chọn thành viên.");
            return;
        }
        if (!content.trim()) {
            setError("Vui lòng nhập nội dung yêu cầu.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await submitEditRequest(selectedPersonId, content);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1800);
        } catch (err) {
            setError((err as Error).message || "Đã xảy ra lỗi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm"
                >
                    <div className="absolute inset-0" onClick={onClose} />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-stone-200 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/60">
                            <div>
                                <h2 className="text-lg font-bold text-stone-900">Yêu cầu chỉnh sửa</h2>
                                <p className="text-xs text-stone-500 mt-0.5">Mô tả thông tin bạn muốn cập nhật</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-200 text-stone-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            {success ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center gap-3 py-8 text-center"
                                >
                                    <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                                    <p className="text-lg font-semibold text-stone-800">Gửi thành công!</p>
                                    <p className="text-sm text-stone-500">Yêu cầu của bạn đã được ghi nhận.</p>
                                </motion.div>
                            ) : (
                                <>
                                    {/* Person selector */}
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                                            Thành viên <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative" ref={dropdownRef}>
                                            <button
                                                type="button"
                                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-left hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
                                            >
                                                <span className={selectedPerson ? "text-stone-900 font-medium" : "text-stone-400"}>
                                                    {selectedPerson?.full_name ?? "Chọn thành viên..."}
                                                </span>
                                                <Search className="w-4 h-4 text-stone-400 shrink-0" />
                                            </button>

                                            {dropdownOpen && (
                                                <div className="absolute z-10 mt-1.5 w-full bg-white rounded-xl border border-stone-200 shadow-xl overflow-hidden">
                                                    <div className="p-2 border-b border-stone-100">
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            placeholder="Tìm tên..."
                                                            value={search}
                                                            onChange={(e) => setSearch(e.target.value)}
                                                            className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400"
                                                        />
                                                    </div>
                                                    <ul className="max-h-48 overflow-y-auto">
                                                        {filtered.length === 0 ? (
                                                            <li className="px-4 py-3 text-sm text-stone-400 text-center">
                                                                Không tìm thấy
                                                            </li>
                                                        ) : (
                                                            filtered.map((p) => (
                                                                <li
                                                                    key={p.id}
                                                                    onClick={() => {
                                                                        setSelectedPersonId(p.id);
                                                                        setDropdownOpen(false);
                                                                        setSearch("");
                                                                    }}
                                                                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-amber-50 hover:text-amber-800 transition-colors ${p.id === selectedPersonId
                                                                            ? "bg-amber-50 text-amber-800 font-semibold"
                                                                            : "text-stone-700"
                                                                        }`}
                                                                >
                                                                    {p.full_name}
                                                                </li>
                                                            ))
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                                            Nội dung yêu cầu <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={5}
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder="Mô tả thông tin bạn muốn chỉnh sửa (ví dụ: sửa ngày sinh, thêm số điện thoại...)"
                                            className="w-full text-sm text-stone-700 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                                        />
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 pt-1">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            disabled={loading}
                                            className="px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors"
                                        >
                                            Huỷ
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl border border-amber-600 shadow-sm transition-all disabled:opacity-60 disabled:cursor-wait"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                            {loading ? "Đang gửi..." : "Gửi yêu cầu"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
