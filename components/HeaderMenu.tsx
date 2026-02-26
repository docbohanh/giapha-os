"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ClipboardCheck, ClipboardList, Database, Settings, UserCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import LogoutButton from "./LogoutButton";

interface HeaderMenuProps {
  isAdmin: boolean;
  userEmail?: string;
  pendingRequestCount?: number;
}

export default function HeaderMenu({ isAdmin, userEmail, pendingRequestCount = 0 }: HeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full hover:bg-stone-100 transition-all duration-200 cursor-pointer border border-transparent hover:border-stone-200"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-200 to-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-sm ring-1 ring-amber-300/50">
            {userEmail ? (
              userEmail.charAt(0).toUpperCase()
            ) : (
              <UserCircle className="w-5 h-5" />
            )}
          </div>
          {isAdmin && pendingRequestCount > 0 && (
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[8px] font-bold border-2 border-white shadow-sm ring-1 ring-amber-600/20">
              {pendingRequestCount > 9 ? "9+" : pendingRequestCount}
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-stone-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200/60 py-2 z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-0.5">
                Tài khoản
              </p>
              <p className="text-sm font-medium text-stone-900 truncate">
                {userEmail}
              </p>
            </div>

            <div className="py-1">
              {isAdmin && (
                <>
                  <Link
                    href="/dashboard/users"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-stone-700 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    Quản lý Người dùng
                  </Link>
                  <Link
                    href="/dashboard/data"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-stone-700 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    <Database className="w-4 h-4" />
                    Sao lưu & Phục hồi
                  </Link>
                  <Link
                    href="/dashboard/admin/requests"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-stone-700 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Duyệt yêu cầu
                    {pendingRequestCount > 0 && (
                      <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center leading-none">
                        {pendingRequestCount > 99 ? "99+" : pendingRequestCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
              {!isAdmin && (
                <Link
                  href="/dashboard/requests"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-stone-700 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                >
                  <ClipboardList className="w-4 h-4" />
                  Yêu cầu chỉnh sửa
                </Link>
              )}
              <LogoutButton />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
