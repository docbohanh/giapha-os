"use client";

import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Mail, Shield, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AuthMode = "login" | "signup" | "forgot_password";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>("login");

  const router = useRouter();
  const supabase = createClient();

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setMode("login");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError(null);
      setSuccessMessage(null);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const validatePassword = (pass: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pass);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
        } else {
          router.push("/");
          router.refresh();
          onClose();
        }
      } else if (mode === "signup") {
        if (password !== confirmPassword) {
          setError("Mật khẩu xác nhận không khớp.");
          setLoading(false);
          return;
        }
        if (!validatePassword(password)) {
          setError("Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) {
          setError(error.message);
        } else if (data.user?.identities && data.user.identities.length === 0) {
          setError("Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.");
        } else {
          setSuccessMessage("Đăng ký thành công! Tài khoản của bạn đang chờ Admin phê duyệt để kích hoạt.");
          setMode("login");
          setConfirmPassword("");
          setPassword("");
        }
      } else if (mode === "forgot_password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/profile`,
        });
        if (error) {
          setError(error.message);
        } else {
          setSuccessMessage("Yêu cầu đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email của bạn.");
          setMode("login");
        }
      }
    } catch (err) {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const currentTitle = mode === "login" ? "Đăng nhập" : mode === "signup" ? "Đăng ký" : "Quên mật khẩu";
  const currentDesc =
    mode === "login"
      ? "Đăng nhập để truy cập gia phả."
      : mode === "signup"
        ? "Tạo tài khoản thành viên mới."
        : "Nhập email để nhận liên kết đặt lại mật khẩu.";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            key={mode}
            className="relative max-w-md w-full bg-white/90 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/80 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-amber-100/50 to-transparent rounded-bl-[100px] pointer-events-none" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors z-10"
            >
              <X className="size-5" />
            </button>

            <div className="text-center mb-8 relative z-10">
              <div className="inline-flex items-center justify-center p-3.5 bg-white rounded-2xl mb-5 shadow-sm ring-1 ring-stone-100">
                <Shield className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-3xl font-sans font-bold text-stone-900 tracking-tight">{currentTitle}</h2>
              <p className="mt-3 text-sm text-stone-500 font-medium tracking-wide">{currentDesc}</p>
            </div>

            <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="relative">
                  <label htmlFor="modal-email" className="block text-[13px] font-semibold text-stone-600 mb-1.5 ml-1">
                    Email
                  </label>
                  <div className="relative flex items-center group">
                    <Mail className="absolute left-3.5 w-5 h-5 text-stone-400 group-focus-within:text-amber-500 transition-colors" />
                    <input
                      id="modal-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="bg-white/50 backdrop-blur-sm text-stone-900 placeholder-stone-400 block w-full rounded-xl border border-stone-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] focus:border-amber-400 focus:ring-amber-400 focus:bg-white pl-11 pr-4 py-3.5 transition-all duration-200 outline-none"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {mode !== "forgot_password" && (
                  <div className="relative">
                    <label htmlFor="modal-password" className="block text-[13px] font-semibold text-stone-600 mb-1.5 ml-1">
                      Mật khẩu
                    </label>
                    <div className="relative flex items-center group">
                      <KeyRound className="absolute left-3.5 w-5 h-5 text-stone-400 group-focus-within:text-amber-500 transition-colors" />
                      <input
                        id="modal-password"
                        name="password"
                        type="password"
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        required
                        className="bg-white/50 backdrop-blur-sm text-stone-900 placeholder-stone-400 block w-full rounded-xl border border-stone-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] focus:border-amber-400 focus:ring-amber-400 focus:bg-white pl-11 pr-4 py-3.5 transition-all duration-200 outline-none"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative overflow-hidden"
                    >
                      <label htmlFor="modal-confirm" className="block text-[13px] font-semibold text-stone-600 mb-1.5 ml-1">
                        Xác nhận mật khẩu
                      </label>
                      <div className="relative flex items-center group">
                        <KeyRound className="absolute left-3.5 w-5 h-5 text-stone-400 group-focus-within:text-amber-500 transition-colors" />
                        <input
                          id="modal-confirm"
                          name="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          required={mode === "signup"}
                          className="bg-white/50 backdrop-blur-sm text-stone-900 placeholder-stone-400 block w-full rounded-xl border border-stone-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] focus:border-amber-400 focus:ring-amber-400 focus:bg-white pl-11 pr-4 py-3.5 transition-all duration-200 outline-none"
                          placeholder="Nhập lại mật khẩu"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="text-red-700 text-[13px] text-center bg-red-50 p-3 rounded-xl border border-red-100/50 font-medium"
                  >
                    {error}
                  </motion.div>
                )}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="text-teal-700 text-[13px] text-center bg-teal-50 p-3 rounded-xl border border-teal-100/50 font-medium"
                  >
                    {successMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center items-center gap-2 py-4 px-4 text-[15px] font-bold rounded-xl text-white bg-stone-900 hover:bg-stone-800 border border-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 disabled:opacity-70 disabled:cursor-wait transition-all duration-300 shadow-xl shadow-stone-900/10 hover:shadow-2xl hover:shadow-stone-900/20 hover:-translate-y-0.5"
                >
                  {loading ? (
                    <span className="flex items-center gap-2.5">
                      <svg className="animate-spin -ml-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    <>
                      {mode === "login" ? "Đăng nhập" : mode === "signup" ? "Tạo tài khoản" : "Gửi yêu cầu"}
                      {mode === "signup" && <UserPlus className="w-4 h-4 ml-1" />}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setSuccessMessage(null); }}
                  className="w-full text-sm font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200/80 py-3.5 rounded-xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] focus:outline-none transition-all duration-200"
                >
                  {mode === "login" ? "Chưa có tài khoản? Đăng ký ngay" : mode === "signup" ? "Đã có tài khoản? Đăng nhập" : "Quay lại đăng nhập"}
                </button>

                <div className="relative flex items-center py-2 opacity-60">
                  <div className="grow border-t border-stone-200" />
                  <span className="shrink-0 mx-4 text-stone-400 text-[11px] uppercase tracking-wider font-bold">Hoặc đăng nhập với</span>
                  <div className="grow border-t border-stone-200" />
                </div>

                <button
                  type="button"
                  onClick={() => handleOAuthLogin("google")}
                  className="flex items-center justify-center gap-2.5 py-3 px-4 bg-white border border-stone-200 rounded-xl text-sm font-bold text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all duration-200 shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.14-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
