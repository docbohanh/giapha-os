"use client";

import { useEffect, useState, useTransition } from "react";
import { UserComment } from "@/types";
import { getMemberComments } from "@/app/actions/comment";
import { MessageSquare, Loader2, Info } from "lucide-react";
import CommentItem from "./CommentItem";
import CommentInput from "./CommentInput";

interface CommentSectionProps {
    memberId: string;
    isAdmin: boolean;
    currentUserId?: string | null;
}

export default function CommentSection({
    memberId,
    isAdmin,
    currentUserId,
}: CommentSectionProps) {
    const [comments, setComments] = useState<UserComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const fetchComments = async () => {
        try {
            const data = await getMemberComments(memberId);
            setComments(data);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [memberId]);

    return (
        <section className="mt-8">

            <div className="bg-stone-50/50 p-5 sm:p-6 rounded-2xl border border-stone-200/60 shadow-sm space-y-6">
                <h2 className="text-base sm:text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-600" />
                    Bình luận
                </h2>
                {/* Comment Input */}
                <div className="mb-8">
                    <CommentInput memberId={memberId} onSuccess={fetchComments} />
                </div>

                {/* Comment List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-8 text-stone-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : comments.length > 0 ? (
                    <div className="space-y-8">
                        {comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                memberId={memberId}
                                isAdmin={isAdmin}
                                currentUserId={currentUserId}
                                onRefresh={fetchComments}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-3 bg-white/50 rounded-xl border border-stone-200/40 border-dashed">
                        <MessageSquare className="w-8 h-8 text-stone-200" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-stone-400">
                                Chưa có bình luận nào.
                            </p>
                            <p className="text-[11px] text-stone-300">
                                Hãy là người đầu tiên để lại lời nhắn.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
