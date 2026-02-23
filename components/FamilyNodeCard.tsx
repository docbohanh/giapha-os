"use client";

import { Person } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import DefaultAvatar from "./DefaultAvatar";

interface FamilyNodeCardProps {
  person: Person;
  role?: string; // e.g., "Chồng", "Vợ"
  note?: string | null;
  isMainNode?: boolean; // Determines specific border/shadow styling
  onClickCard?: () => void;
  onClickName?: (e: React.MouseEvent) => void;
  isExpandable?: boolean;
  isExpanded?: boolean;
}

export default function FamilyNodeCard({
  person,
  isMainNode = false,
  onClickCard,
  onClickName,
  isExpandable = false,
  isExpanded = false,
}: FamilyNodeCardProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const isDeceased = person.is_deceased;

  const content = (
    <div
      onClick={onClickCard}
      className={`group py-2 px-1 w-20 sm:w-24 md:w-28 flex flex-col items-center justify-start transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer relative bg-transparent rounded-xl
        ${isMainNode && isDeceased ? "grayscale opacity-80" : ""}
      `}
    >
      {/* Expand/Collapse Indicator */}
      {isExpandable && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-stone-200 rounded-full w-6 h-6 flex items-center justify-center shadow-sm z-10 text-stone-500 hover:text-stone-800 font-bold text-sm transition-colors">
          {isExpanded ? "-" : "+"}
        </div>
      )}
      {/* 1. Avatar */}
      <div
        className={`h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full flex items-center justify-center text-[10px] sm:text-xs md:text-sm text-white overflow-hidden mb-1.5 sm:mb-2 shrink-0 shadow-md ring-2 ring-white transition-transform group-hover:scale-105
            ${
              person.gender === "male"
                ? "bg-sky-700"
                : person.gender === "female"
                  ? "bg-rose-700"
                  : "bg-stone-500"
            }`}
      >
        {person.avatar_url ? (
          <Image
            unoptimized
            src={person.avatar_url}
            alt={person.full_name}
            className="w-full h-full object-cover"
            width={56}
            height={56}
          />
        ) : (
          <DefaultAvatar gender={person.gender} />
        )}
      </div>

      {/* 2. Gender Icon + Name */}
      <div className="flex flex-col items-center justify-center gap-1 w-full px-0.5 sm:px-1">
        <span
          className={`text-[11px] sm:text-xs md:text-sm font-semibold text-center leading-tight line-clamp-2 max-w-[150px] transition-colors ${onClickName ? "text-stone-900 group-hover:text-amber-700 hover:underline" : "text-stone-900"}`}
          title={person.full_name}
          onClick={(e) => {
            if (onClickName) {
              e.stopPropagation();
              e.preventDefault();
              onClickName(e);
            }
          }}
        >
          {person.full_name}
        </span>
      </div>

      {/* 3. Role */}
      {/* {role && (
        <span className="mt-1 px-2.5 py-0.5 bg-stone-100/80 border border-stone-200 text-stone-500 font-medium tracking-wide w-auto text-center leading-tight rounded-full text-[10px] shadow-sm">
          {role} {note && `(${note})`}
        </span>
      )} */}
    </div>
  );

  if (onClickCard || onClickName) {
    return content;
  }

  const newParams = new URLSearchParams(searchParams.toString());
  newParams.set("memberModalId", person.id);

  return (
    <Link href={`${pathname}?${newParams.toString()}`} scroll={false}>
      {content}
    </Link>
  );
}
