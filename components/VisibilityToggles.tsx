"use client";

import { Eye, EyeOff, Heart, HeartOff, UserMinus, Users } from "lucide-react";
import { useDashboard } from "./DashboardContext";
import { motion } from "framer-motion";

export default function VisibilityToggles() {
  const {
    showAvatar, setShowAvatar,
    hideSpouses, setHideSpouses,
    hideFemales, setHideFemales
  } = useDashboard();

  const toggles = [
    {
      id: "avatar",
      active: showAvatar,
      label: showAvatar ? "Hiện ảnh" : "Ẩn ảnh",
      icon: showAvatar ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />,
      onClick: () => setShowAvatar(!showAvatar),
      title: showAvatar ? "Ẩn ảnh đại diện" : "Hiện ảnh đại diện"
    },
    {
      id: "spouses",
      active: !hideSpouses,
      label: hideSpouses ? "Ẩn hôn thê" : "Hiện hôn thê",
      icon: hideSpouses ? <HeartOff className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />,
      onClick: () => setHideSpouses(!hideSpouses),
      title: hideSpouses ? "Hiện vợ/chồng" : "Ẩn vợ/chồng"
    },
    {
      id: "females",
      active: !hideFemales,
      label: hideFemales ? "Ẩn nữ" : "Hiện nữ",
      icon: hideFemales ? <UserMinus className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />,
      onClick: () => setHideFemales(!hideFemales),
      title: hideFemales ? "Hiện nữ giới" : "Ẩn nữ giới"
    }
  ];

  return (
    <div className="flex bg-stone-200/50 p-1 rounded-full border border-stone-200/60 backdrop-blur-sm gap-0.5">
      {toggles.map((toggle) => (
        <button
          key={toggle.id}
          onClick={toggle.onClick}
          className={`relative px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-full transition-all duration-200 flex items-center gap-1.5 cursor-pointer overflow-hidden ${toggle.active ? "text-stone-900" : "text-stone-500 hover:text-stone-700"
            }`}
          title={toggle.title}
        >
          {toggle.active && (
            <motion.div
              layoutId={`visTab-${toggle.id}`}
              className="absolute inset-0 bg-white rounded-full shadow-xs border border-stone-200/40 z-[-1]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className={toggle.active ? "text-amber-700" : "text-stone-400"}>
            {toggle.icon}
          </span>
          <span className="hidden xs:inline-block whitespace-nowrap">{toggle.label}</span>
        </button>
      ))}
    </div>
  );
}
