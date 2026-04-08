"use client";

import Link from "next/link";

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  bgColor: string;
  borderColor: string;
  hoverColor: string;
}

interface FeatureGridProps {
  features: Feature[];
  isLoggedIn: boolean;
  adminFeatures?: Feature[];
  isAdmin?: boolean;
}

export default function FeatureGrid({ features, isLoggedIn, adminFeatures, isAdmin }: FeatureGridProps) {
  const FeatureCard = ({ feat, hoverTextColor = "text-amber-700" }: { feat: Feature; hoverTextColor?: string }) => {
    const className = `group flex flex-col p-6 rounded-2xl bg-white border ${feat.borderColor} ${feat.hoverColor} transition-all duration-300 hover:-translate-y-1 shadow-sm cursor-pointer`;
    const inner = (
      <>
        <div className={`size-14 rounded-xl flex items-center justify-center mb-5 ${feat.bgColor} transition-colors duration-300 group-hover:bg-white border border-transparent group-hover:${feat.borderColor}`}>
          {feat.icon}
        </div>
        <h4 className={`text-lg font-bold text-stone-800 mb-2 group-hover:${hoverTextColor} transition-colors`}>
          {feat.title}
        </h4>
        <p className="text-sm text-stone-500 line-clamp-2">{feat.description}</p>
      </>
    );

    const href = !isLoggedIn ? "/login" : feat.href;

    return (
      <Link key={feat.href} href={href} className={className}>
        {inner}
      </Link>
    );
  };

  return (
    <div className="space-y-12">
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feat) => (
            <FeatureCard key={feat.href} feat={feat} />
          ))}
        </div>
      </section>

      {isAdmin && adminFeatures && adminFeatures.length > 0 && (
        <section>
          <h3 className="text-xl font-serif font-bold text-rose-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-px bg-rose-200 rounded-full"></span>
            Quản trị viên
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {adminFeatures.map((feat) => (
              <FeatureCard key={feat.href} feat={feat} hoverTextColor="text-rose-700" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
