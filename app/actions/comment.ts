"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { UserComment } from "@/types";

export async function getMemberComments(memberId: string): Promise<UserComment[]> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: dataWithProfile, error: joinError } = await supabase
        .from("user_comments")
        .select(`
            *,
            profiles!user_id (
                full_name,
                avatar_url
            )
        `)
        .eq("member_id", memberId)
        .order("created_at", { ascending: true });

    let finalData = dataWithProfile;

    if (joinError) {
        console.warn("Join with profiles failed, falling back to simple query:", joinError.message);
        // Fallback: fetch without profiles join if the join fails
        const { data: simpleData, error: simpleError } = await supabase
            .from("user_comments")
            .select("*")
            .eq("member_id", memberId)
            .order("created_at", { ascending: true });

        if (simpleError) {
            console.error("Error fetching comments (simple):", simpleError);
            return [];
        }
        finalData = simpleData;
    }

    if (!finalData) return [];

    const data = finalData;

    // Organize into a tree structure
    const commentMap = new Map<string, UserComment>();
    const rootComments: UserComment[] = [];

    // Initialize comments with empty replies array
    data.forEach((comment: any) => {
        // Supabase sometimes returns joined data as an array even for 1:1 if not clearly defined
        const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;

        if (!profile) {
            console.log(`Comment ${comment.id} has no profile data. user_id: ${comment.user_id}`);
        } else {
            console.log(`Comment ${comment.id} has profile:`, JSON.stringify(profile));
        }

        commentMap.set(comment.id, { ...comment, profiles: profile, replies: [] });
    });

    // Build the tree
    commentMap.forEach((comment) => {
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
            commentMap.get(comment.parent_id)!.replies!.push(comment);
        } else {
            rootComments.push(comment);
        }
    });

    return rootComments;
}

export async function addMemberComment(
    memberId: string,
    content: string,
    parentId: string | null = null,
) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Vui lòng đăng nhập để bình luận.");

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_active, full_name, avatar_url")
        .eq("id", user.id)
        .single();

    // Sync metadata from Google/Auth to profiles if missing
    const metaFullName = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name;
    const metaAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

    if (profile && (!profile.full_name || !profile.avatar_url)) {
        await supabase
            .from("profiles")
            .update({
                full_name: profile.full_name || metaFullName,
                avatar_url: profile.avatar_url || metaAvatarUrl,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);
    }

    let finalParentId = parentId;
    let modifiedContent = content.trim();

    if (parentId) {
        // Fetch the parent comment to check its depth
        const { data: parentComment } = await supabase
            .from("user_comments")
            .select("parent_id, user_id, profiles!user_id(full_name)")
            .eq("id", parentId)
            .single();

        if (parentComment && parentComment.parent_id) {
            // Already a Level 2 comment, so make this new comment also Level 2
            finalParentId = parentComment.parent_id;
            // Optionally add @mention style for clarity on who is being replied to
            const parentName = (parentComment.profiles as any)?.full_name || "người dùng";
            modifiedContent = `_trả lời ${parentName}:_ ${modifiedContent}`;
        }
    }

    const { error } = await supabase.from("user_comments").insert({
        member_id: memberId,
        user_id: user.id,
        content: modifiedContent,
        parent_id: finalParentId,
    });

    if (error) {
        console.error("Error adding comment:", error);
        throw new Error("Lỗi khi gửi bình luận: " + error.message);
    }

    revalidatePath(`/dashboard/members/${memberId}`);
    revalidatePath("/dashboard");
}

export async function deleteMemberComment(commentId: string, memberId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Vui lòng đăng nhập.");

    // Check if user is admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const isAdmin = profile?.role === "admin";

    // If not admin, the query will only delete if user_id matches (RLS will also handle this)
    let query = supabase.from("user_comments").delete().eq("id", commentId);

    if (!isAdmin) {
        query = query.eq("user_id", user.id);
    }

    const { error } = await query;

    if (error) {
        console.error("Error deleting comment:", error);
        throw new Error("Lỗi khi xoá bình luận: " + error.message);
    }

    revalidatePath(`/dashboard/members/${memberId}`);
    revalidatePath("/dashboard");
}
