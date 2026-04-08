"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import LoginModal from "./LoginModal";

export default function LoginPrompt({ message }: { message: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center justify-center h-full gap-3 py-6 w-full cursor-pointer group"
      >
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 text-stone-400 group-hover:text-stone-600 group-hover:border-stone-200 transition-colors">
          <Lock className="size-6" />
        </div>
        <p className="text-stone-500 group-hover:text-stone-700 text-center font-medium px-4 transition-colors">
          {message}
        </p>
      </button>
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
