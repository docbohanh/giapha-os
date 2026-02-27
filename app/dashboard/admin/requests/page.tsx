import AdminRequestList from "@/components/AdminRequestList";
import { AdminUserData, EditRequest } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { ClipboardCheck } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminRequestsPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") redirect("/dashboard");

    // Fetch all requests with joined person name
    const { data: rawRequests } = await supabase
        .from("edit_requests")
        .select("*, persons(full_name)")
        .order("created_at", { ascending: false });

    // Lấy email user qua RPC get_admin_users
    const { data: allUsers } = await supabase.rpc("get_admin_users");
    const emailMap: Record<string, string> = {};
    ((allUsers as AdminUserData[]) ?? []).forEach((u) => {
        emailMap[u.id] = u.email;
    });

    const requests: EditRequest[] = ((rawRequests ?? []) as EditRequest[]).map(
        (r) => ({
            ...r,
            user_email: emailMap[r.user_id] ?? r.user_id.slice(0, 8) + "...",
        })
    );

    return (
        <div className="flex-1 w-full pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <ClipboardCheck className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-sans font-bold text-stone-900">
                            Danh sách yêu cầu
                        </h1>
                        <p className="text-sm text-stone-500 mt-0.5">
                            Duyệt hoặc từ chối các yêu cầu chỉnh sửa thông tin
                        </p>
                    </div>
                </div>

                <AdminRequestList initialRequests={requests} />
            </div>
        </div>
    );
}
