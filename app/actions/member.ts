"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function deleteMemberProfile(memberId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Verify Authentication & Authorization
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Vui lòng đăng nhập.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Từ chối truy cập. Chỉ admin mới có quyền xoá hồ sơ.");
  }

  // 2. Check for existing relationships
  const { data: relationships, error: relationshipError } = await supabase
    .from("relationships")
    .select("id")
    .or(`person_a.eq.${memberId},person_b.eq.${memberId}`)
    .limit(1);

  if (relationshipError) {
    console.error("Error checking relationships:", relationshipError);
    throw new Error("Lỗi kiểm tra mối quan hệ gia đình.");
  }

  if (relationships && relationships.length > 0) {
    throw new Error(
      "Không thể xoá. Vui lòng xoá hết các mối quan hệ gia đình của người này trước.",
    );
  }

  // 3. Delete the member
  const { error: deleteError } = await supabase
    .from("persons")
    .delete()
    .eq("id", memberId);

  if (deleteError) {
    console.error("Error deleting person:", deleteError);
    throw new Error("Đã xảy ra lỗi khi xoá hồ sơ.");
  }

  // 4. Revalidate and redirect
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  redirect("/dashboard");
}

export async function setDefaultRootNode(memberId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Vui lòng đăng nhập.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Chỉ admin mới có quyền thực hiện thao tác này.");
  }

  // Reset tất cả về null
  const { error: resetError } = await supabase
    .from("persons")
    .update({ is_default_root_node: null })
    .not("id", "is", null);

  if (resetError) throw new Error("Lỗi khi reset gốc cây.");

  // Set người được chọn
  const { error: setError } = await supabase
    .from("persons")
    .update({ is_default_root_node: true })
    .eq("id", memberId);

  if (setError) throw new Error("Lỗi khi đặt gốc cây.");

  revalidatePath("/dashboard");
  revalidatePath("/");
}

export async function setUserRootNode(memberId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Vui lòng đăng nhập.");

  const { error } = await supabase
    .from("user_root_node")
    .upsert({
      user_id: user.id,
      root_node_id: memberId,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id"
    });

  if (error) {
    console.error("Error setting user root node:", error);
    throw new Error("Lỗi khi đặt gốc cây cá nhân.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/");
}

export async function updateMemberNote(memberId: string, note: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Vui lòng đăng nhập.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active) {
    throw new Error("Tài khoản chưa được kích hoạt.");
  }

  const { error } = await supabase
    .from("persons")
    .update({ note: note.trim() || null })
    .eq("id", memberId);

  if (error) throw new Error("Lỗi khi cập nhật ghi chú: " + error.message);

  revalidatePath(`/dashboard/members/${memberId}`);
  revalidatePath("/dashboard");
}

export async function submitEditRequest(personId: string, content: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Vui lòng đăng nhập.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active) {
    throw new Error("Tài khoản chưa được kích hoạt.");
  }

  const { error } = await supabase.from("edit_requests").insert({
    person_id: personId,
    user_id: user.id,
    content: content.trim(),
    status: "pending",
  });

  if (error) throw new Error("Lỗi khi gửi yêu cầu: " + error.message);

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/admin/requests");
}

export async function approveEditRequest(requestId: string, adminNote?: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Vui lòng đăng nhập.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Chỉ admin mới có quyền duyệt yêu cầu.");
  }

  const { error } = await supabase
    .from("edit_requests")
    .update({
      status: "approved",
      admin_note: adminNote?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) throw new Error("Lỗi khi duyệt yêu cầu: " + error.message);

  revalidatePath("/dashboard/admin/requests");
  revalidatePath("/dashboard/requests");
}

export async function rejectEditRequest(requestId: string, adminNote?: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Vui lòng đăng nhập.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Chỉ admin mới có quyền từ chối yêu cầu.");
  }

  const { error } = await supabase
    .from("edit_requests")
    .update({
      status: "rejected",
      admin_note: adminNote?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) throw new Error("Lỗi khi từ chối yêu cầu: " + error.message);

  revalidatePath("/dashboard/admin/requests");
  revalidatePath("/dashboard/requests");
}

