"use client";

import { updatePassword, updateProfile } from "@/app/actions/auth";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Loader2, Save, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const supabase = createClient();

    useEffect(() => {
        async function getUser() {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setUser(user);
            setDisplayName(
                user?.user_metadata?.display_name ||
                user?.user_metadata?.full_name ||
                user?.user_metadata?.name ||
                ""
            );
            setLoading(false);
        }
        getUser();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.set("displayName", displayName);
            const result = await updateProfile(formData);
            if (result.error) {
                setMessage({ type: "error", text: result.error });
            } else {
                setMessage({ type: "success", text: "Cập nhật tên hiển thị thành công." });
            }
        } catch (error: any) {
            setMessage({ type: "error", text: "Đã có lỗi kết nối. Vui lòng thử lại." });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordLoading(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget as HTMLFormElement);
        try {
            const result = await updatePassword(formData);
            if (result.error) {
                setMessage({ type: "error", text: result.error });
            } else {
                setMessage({ type: "success", text: "Đổi mật khẩu thành công." });
                (e.currentTarget as HTMLFormElement).reset();
            }
        } catch (error: any) {
            setMessage({ type: "error", text: "Đã có lỗi kết nối. Vui lòng thử lại." });
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* <div className="mb-8">
                <h1 className="text-3xl font-bold text-stone-900">Thông tin cá nhân</h1>
                <p className="text-stone-500 mt-2">
                    Quản lý thông tin tài khoản và bảo mật của bạn.
                </p>
            </div> */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-50 rounded-xl">
                    <UserIcon className="w-5 h-5 text-amber-600" />
                </div>
                <h1 className="text-2xl font-bold text-stone-900">Thông tin cá nhân</h1>
            </div>

            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`mb-6 p-4 rounded-xl border ${message.type === "success"
                            ? "bg-teal-50 border-teal-100 text-teal-700"
                            : "bg-rose-50 border-rose-100 text-rose-700"
                            } font-medium text-sm flex items-center justify-between`}
                    >
                        <span>{message.text}</span>
                        <button
                            onClick={() => setMessage(null)}
                            className="text-stone-400 hover:text-stone-600"
                        >
                            &times;
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                {/* Profile Section */}
                <section className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">


                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-stone-600 mb-1.5 ml-1">
                                Email
                            </label>
                            <input
                                type="email"
                                disabled
                                value={user?.email || ""}
                                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 cursor-not-allowed"
                            />
                            {/* <p className="mt-1.5 text-[12px] text-stone-400 italic">
                                Email không thể thay đổi.
                            </p> */}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-stone-600 mb-1.5 ml-1">
                                Tên hiển thị
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Ví dụ: Nguyễn Văn A"
                                className="w-full px-4 py-3 rounded-xl bg-white border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={profileLoading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-all disabled:opacity-50"
                        >
                            {profileLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Lưu thay đổi
                        </button>
                    </form>
                </section>

                {/* Change Password Section */}
                {/* <section className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-rose-50 rounded-xl">
                            <KeyRound className="w-5 h-5 text-rose-600" />
                        </div>
                        <h2 className="text-xl font-bold text-stone-900">Đổi mật khẩu</h2>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-stone-600 mb-1.5 ml-1">
                                Mật khẩu mới
                            </label>
                            <input
                                name="password"
                                type="password"
                                required
                                placeholder="Nhập mật khẩu mới"
                                className="w-full px-4 py-3 rounded-xl bg-white border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-stone-600 mb-1.5 ml-1">
                                Xác nhận mật khẩu mới
                            </label>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                placeholder="Nhập lại mật khẩu mới"
                                className="w-full px-4 py-3 rounded-xl bg-white border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all"
                            />
                        </div>

                        <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                            <p className="text-[12px] text-stone-500 leading-relaxed font-medium">
                                Mật khẩu phải có ít nhất 8 ký tự, bao gồm:
                                <span className="block mt-1">• Chữ hoa và chữ thường</span>
                                <span className="block">• Ít nhất một chữ số</span>
                                <span className="block">• Ít nhất một ký tự đặc biệt (ví dụ: @, $, !, %)</span>
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={passwordLoading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-all disabled:opacity-50"
                        >
                            {passwordLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <KeyRound className="w-4 h-4" />
                            )}
                            Đổi mật khẩu
                        </button>
                    </form>
                </section> */}
            </div>
        </div>
    );
}
