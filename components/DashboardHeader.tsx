import Image from "next/image";
import config from "@/app/config";
import HeaderMenu from "@/components/HeaderMenu";
import Link from "next/link";
import React from "react";

interface DashboardHeaderProps {
  isAdmin: boolean;
  userEmail?: string;
  displayName?: string;
  avatarUrl?: string | null;
  pendingRequestCount?: number;
  children?: React.ReactNode;
}

export default function DashboardHeader({
  isAdmin,
  userEmail,
  displayName,
  avatarUrl,
  pendingRequestCount = 0,
  children,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Home icon — back to landing page */}
          <Link href="/" title="Trang chủ" className="shrink-0 transition-transform duration-200 hover:scale-110 active:scale-95">
            <Image src="/icon.png" alt="Home" width={32} height={32} className="rounded-[6px]" />
          </Link>

          <Link
            href="/dashboard"
            className="group flex items-center gap-2 cursor-pointer"
          >
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-800 group-hover:text-amber-700 transition-colors">
              {config.siteName}
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {children}
          <HeaderMenu
            isAdmin={isAdmin}
            userEmail={userEmail}
            displayName={displayName}
            avatarUrl={avatarUrl}
            pendingRequestCount={pendingRequestCount}
          />
        </div>
      </div>
    </header>
  );
}
