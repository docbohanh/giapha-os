"use client";

import { useEffect, useState, useTransition } from "react";
import { Send, Loader2 } from "lucide-react";
import { addMemberComment } from "@/app/actions/comment";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

interface CommentInputProps {
    memberId: string;
    parentId?: string | null;
    placeholder?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    autoFocus?: boolean;
}

export default function CommentInput({
    memberId,
    parentId = null,
    placeholder = "Viết bình luận...",
    onSuccess,
    onCancel,
    autoFocus = false,
}: CommentInputProps) {
    const [content, setContent] = useState("");
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [userInitial, setUserInitial] = useState("U");
    const [isPending, startTransition] = useTransition();

    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
                const name = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name || "U";
                setUserAvatar(avatar);
                setUserInitial(name.charAt(0).toUpperCase());
            }
        };
        getUser();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        startTransition(async () => {
            try {
                await addMemberComment(memberId, content, parentId);
                setContent("");
                // No alert for success to keep it smooth, or use a simple one if needed
                onSuccess?.();
            } catch (error: any) {
                alert(error.message || "Không thể gửi bình luận");
            }
        });
    };

    return (
        <div className="flex gap-3">
            {!parentId && (
                <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 border border-stone-200 bg-stone-100 flex items-center justify-center text-stone-400 font-bold shadow-xs">
                    {userAvatar ? (
                        <Image
                            unoptimized
                            src={userAvatar}
                            alt="User"
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        userInitial
                    )}
                </div>
            )}
            <form onSubmit={handleSubmit} className="relative flex-1">
                <textarea
                    autoFocus={autoFocus}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={placeholder}
                    disabled={isPending}
                    className="w-full min-h-[100px] p-4 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none shadow-xs"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isPending}
                            className="px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors"
                        >
                            Hủy
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isPending || !content.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        {isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Send className="w-3.5 h-3.5" />
                        )}
                        Gửi
                    </button>
                </div>
            </form>
        </div>
    );
}
