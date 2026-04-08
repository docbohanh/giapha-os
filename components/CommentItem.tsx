"use client";

import { UserComment } from "@/types";
import { timeAgo } from "@/utils/dateHelpers";
import { MessageSquare, Trash2, Reply, MessageCircleReply } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { deleteMemberComment } from "@/app/actions/comment";
import CommentInput from "./CommentInput";

interface CommentItemProps {
    comment: UserComment;
    memberId: string;
    isAdmin: boolean;
    currentUserId?: string | null;
    onRefresh: () => void;
    isReply?: boolean;
}

export default function CommentItem({
    comment,
    memberId,
    isAdmin,
    currentUserId,
    onRefresh,
    isReply = false,
}: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [isDeleting, startTransition] = useTransition();

    const canDelete = isAdmin || currentUserId === comment.user_id;

    const handleDelete = async () => {
        if (!confirm("Bạn có chắc chắn muốn xoá bình luận này?")) return;

        startTransition(async () => {
            try {
                await deleteMemberComment(comment.id, memberId);
                onRefresh();
            } catch (error: any) {
                alert(error.message || "Không thể xoá bình luận");
            }
        });
    };

    return (
        <div className={`group animate-in fade-in slide-in-from-top-2 duration-300 ${isReply ? "scale-95 origin-left" : ""}`}>
            <div className="flex gap-3">
                {/* Avatar */}
                <div className={`${isReply ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs"} rounded-lg overflow-hidden shrink-0 border border-stone-200 bg-stone-100 flex items-center justify-center text-stone-400 font-bold shadow-xs relative`}>
                    {comment.profiles?.avatar_url && comment.profiles.avatar_url.startsWith('http') ? (
                        <Image
                            unoptimized
                            src={comment.profiles.avatar_url}
                            alt={comment.profiles.full_name || "User"}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        (comment.profiles?.full_name?.charAt(0) || "U").toUpperCase()
                    )}
                </div>

                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <h4 className={`font-bold text-stone-900 ${isReply ? "text-xs" : "text-sm"}`}>
                            {comment.profiles?.full_name || "Người dùng"}
                        </h4>
                        <span className="text-[10px] text-stone-400 font-medium">
                            {timeAgo(comment.created_at)}
                        </span>
                    </div>

                    <div className={`bg-white p-3 rounded-2xl border border-stone-200 shadow-xs ${isReply ? "rounded-tl-none py-2 px-3" : "rounded-tl-none"}`}>
                        <div className={`text-stone-700 whitespace-pre-wrap leading-relaxed ${isReply ? "text-xs" : "text-sm"}`}>
                            {/* Parse custom mention format if it exists */}
                            {comment.content.startsWith("_trả lời") ? (
                                <>
                                    <span className="text-amber-700 font-bold mr-1 italic">
                                        {comment.content.split(":_ ")[0].replace("_", "").replace("_", "")}:
                                    </span>
                                    {comment.content.split(":_ ")[1]}
                                </>
                            ) : (
                                comment.content
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-1 ml-1">
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-800 transition-colors uppercase tracking-wider"
                        >
                            <MessageCircleReply className="w-3.5 h-3.5" />
                            Trả lời
                        </button>
                        {canDelete && (
                            <button
                                disabled={isDeleting}
                                onClick={handleDelete}
                                className="flex items-center gap-1 text-[10px] font-bold text-stone-400 hover:text-red-500 transition-colors uppercase tracking-wider disabled:opacity-50"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Xoá
                            </button>
                        )}
                    </div>

                    {isReplying && (
                        <CommentInput
                            autoFocus
                            memberId={memberId}
                            parentId={isReply ? comment.parent_id : comment.id} // Ensure we target level-1 parent if we are already a reply
                            placeholder={`Trả lời ${comment.profiles?.full_name || "bình luận"}...`}
                            onSuccess={() => {
                                setIsReplying(false);
                                onRefresh();
                            }}
                            onCancel={() => setIsReplying(false)}
                        />
                    )}

                    {/* Nested Replies - Only render if not already a reply (limit to 2 levels) */}
                    {!isReply && comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 space-y-4 border-l-2 border-stone-100 pl-4">
                            {comment.replies.map((reply) => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    memberId={memberId}
                                    isAdmin={isAdmin}
                                    currentUserId={currentUserId}
                                    onRefresh={onRefresh}
                                    isReply={true}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
