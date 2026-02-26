import { EditRequest } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";

const STATUS_CONFIG = {
    pending: {
        label: "Chờ duyệt",
        className: "bg-amber-100 text-amber-800 border-amber-200",
    },
    approved: {
        label: "Đã duyệt",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    rejected: {
        label: "Từ chối",
        className: "bg-red-100 text-red-800 border-red-200",
    },
};

export default async function MyRequestsPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", user.id)
        .single();

    if (!profile?.is_active) redirect("/dashboard");

    const { data: rawRequests } = await supabase
        .from("edit_requests")
        .select("*, persons(full_name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    const requests = (rawRequests ?? []) as EditRequest[];

    return (
        <div className="flex-1 w-full pb-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-stone-900">
                            Yêu cầu của tôi
                        </h1>
                        <p className="text-sm text-stone-500 mt-0.5">
                            Danh sách các yêu cầu chỉnh sửa bạn đã gửi
                        </p>
                    </div>
                </div>

                {/* List */}
                {requests.length === 0 ? (
                    <div className="text-center py-20 text-stone-400 text-sm font-medium bg-white/60 rounded-2xl border border-stone-200/60">
                        Bạn chưa gửi yêu cầu nào.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map((req) => {
                            const statusCfg =
                                STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG] ??
                                STATUS_CONFIG.pending;
                            return (
                                <div
                                    key={req.id}
                                    className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 shadow-sm px-5 py-4 space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-stone-900 text-sm">
                                                    {req.persons?.full_name ?? "—"}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusCfg.className}`}
                                                >
                                                    {statusCfg.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-400">
                                                {new Date(req.created_at).toLocaleDateString("vi-VN", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed bg-stone-50 rounded-xl px-4 py-3 border border-stone-100">
                                        {req.content}
                                    </p>
                                    {req.admin_note && (
                                        <div className="flex items-start gap-2 text-sm text-stone-500 bg-stone-50 rounded-xl px-4 py-3 border border-stone-100">
                                            <span className="font-semibold text-stone-600 shrink-0">
                                                Phản hồi:
                                            </span>
                                            <span className="italic">{req.admin_note}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
