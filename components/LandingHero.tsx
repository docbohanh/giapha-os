"use client";

import { motion, Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import GuestTreeSection from "./GuestTreeSection";
import { DashboardProvider } from "./DashboardContext";
import MemberDetailModal from "./MemberDetailModal";
import { usePathname } from "next/navigation";

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

function FamilyHistoryExcerpt() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="max-w-3xl mx-auto text-left space-y-4 text-sm sm:text-base text-stone-600 leading-relaxed bg-white/60 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-stone-200/60">
      <p className="font-semibold text-amber-800 italic">
        TRÍCH ĐOẠN GIA PHẢ HỌ LÃ HỮU
      </p>
      <p>
        Nguồn gốc họ Lã Hữu qua tìm hiểu văn bia, truyền khẩu và giấy tờ Gia Phả để lại thì khoảng cuối thế kỷ 16 thủy tổ họ Lã đã có mặt trên đất Yên Liêu, đến đời thứ 3 không ghi được hết. Theo gia phả để lại viễn tổ họ Lã là cụ Lã Hữu Giữa, sinh hạ được cụ Lã Hữu Điền. Cụ Lã Hữu Điền sinh được 2 nam (Lã Hữu Lý, Lã Hữu Khu) và 2 nữ.
      </p>

      {/* Expandable content */}
      {expanded && (
        <>
          <p>
            Sinh thời cụ Lã Hữu Lý được Triều đình nhà Lê thụ phong chức Thủ Hợp, cụ lấy bà Lã Thị Tại, con cụ Lã Hữu Kim làm Tri phủ Đồng Tiêu. Ông bà sinh hạ được 9 người con, kinh tế gia đình khá giả.
          </p>
          <p>
            Năm Mậu Tuất 1778 mất mùa, lại chiến tranh, dân tình thiếu thốn đói rét, một số người chết. Gia đình đã dành dụm cứu đói bà con trong thôn ấp, cùng lúc đó gia đình thường mua ván giúp đỡ những người chết không nơi nương tựa.
          </p>
          <p>
            Năm 1788 Vua Quang Trung tấn công ra Bắc, lúc đó một số người chịu ơn vua Lê tìm cách chống lại. Một người tên Sáu người Hà Dương, Hà Trung, Thanh Hóa có âm mưu chống lại nhà Tây Sơn và lẩn trốn ở nhà bố vợ quê ngoại làng Yên Liêu để ẩn dật. Sau này quân Tây Sơn bắt được ở sông Vân Sàng, đồng thời về làng bắt thêm 3 người nữa để tra xét.
          </p>
          <p>
            Cụ Lã Hữu Lý nguyên Thủ Hợp, ông Dương Thị Hoàn làm tri sự, ông Lã Đình Thức là lão thành, bị bắt đem đi tra khảo. Sau một thời gian hai ông được tha về rồi mất. Riêng cụ Lã Hữu Lý còn tại giam đến ngày 04/12/1789 (âm lịch). Cụ bị đánh đập và hy sinh trong nhà tù. Dân làng biết được tin này họp lại để nhớ ơn 3 cụ chịu đòn oan và đề nghị cấp trên minh xét.
          </p>
          <p>
            Cụ Lê Đình Thức và cụ Dương Thị Hoàn vì dân mà chịu đòn tan được dân làng trông coi vợ con một đời. Còn cụ Lã Hữu Lý được dân làng, cấp trên xét là người có đức, có nhân, giúp người đói khổ, chịu đòn oan lúc cần chiến sự. Cụ được phong hai chữ: <strong className="text-stone-800">"Hậu Thần"</strong>.
          </p>
          <p className="font-semibold text-amber-800 italic">
            Hậu Thần làng sống Tết chết Giỗ.
          </p>
          <div className="pt-4 border-t border-amber-200/60">
            <p className="text-center text-base sm:text-lg font-bold text-amber-800 leading-snug">
              ✦ Trải qua hơn 300 năm, Tổ tiên dòng họ Lã Hữu trồng đức trồng nhân, đời này qua đời khác uống nước nhớ nguồn! ✦
            </p>
          </div>
        </>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors"
      >
        {expanded ? "Thu gọn ↑" : "Xem thêm ↓"}
      </button>

      <div className="pt-3 border-t border-stone-200/60">
        <a
          href="/PhaDo_LaHuu_14.10.2017.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-amber-700 transition-colors group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 group-hover:text-amber-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          Phả đồ họ Lã Hữu (PDF · 14.10.2017)
        </a>
      </div>
    </div>
  );
}

interface LandingHeroProps {
  siteName: string;
  persons: import("@/types").Person[];
  relationships: import("@/types").Relationship[];
  isLoggedIn?: boolean;
  userRootId?: string;
}

export default function LandingHero({ siteName, persons, relationships, isLoggedIn, userRootId }: LandingHeroProps) {
  const content = (
    <motion.div
      className="max-w-7xl text-center space-y-12 w-full relative z-10"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <motion.div
        className="space-y-6 sm:space-y-8 flex flex-col items-center"
        variants={fadeIn}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative overflow-hidden rounded-2xl group w-full max-w-2xl"
        >
          <Image
            src="/lahuutoc_ok.png"
            alt="La Hữu Tộc"
            width={640}
            height={320}
            className="object-contain w-full h-auto"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
        </motion.div>

        <FamilyHistoryExcerpt />
      </motion.div>

      <motion.div
        className="pt-6 flex flex-col gap-6 items-center w-full px-4 sm:px-0 relative"
        variants={fadeIn}
      >
        {/* Guest read-only tree preview */}
        <GuestTreeSection
          persons={persons}
          relationships={relationships}
          isLoggedIn={isLoggedIn}
          userRootId={userRootId}
        />

        {/* Login CTA */}
        <div className="relative flex justify-center w-full mt-[56px]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-16 bg-amber-500/30 blur-2xl rounded-full z-0 hidden sm:block"></div>
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg font-bold text-white bg-stone-900 border border-stone-800 hover:bg-stone-800 hover:border-stone-700 rounded-2xl shadow-xl shadow-stone-900/10 hover:shadow-2xl hover:shadow-stone-900/20 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 cursor-pointer w-full sm:w-auto overflow-hidden relative"
          >
            <span className="relative z-10 flex items-center gap-3">
              {isLoggedIn ? "Xem chi tiết" : "Đăng nhập"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </span>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <DashboardProvider>
      {content}
      {isLoggedIn && <MemberDetailModal />}
    </DashboardProvider>
  );
}
