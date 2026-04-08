import FamilyStats from "@/components/FamilyStats";
import LineageManager from "@/components/LineageManager";
import { getProfile, getSupabase } from "@/utils/supabase/queries";

export const metadata = {
    title: "Thống kê gia phả",
};

export default async function StatsPage() {
    const supabase = await getSupabase();
    const profile = await getProfile();

    const { data: persons } = await supabase.from("persons").select("*");
    const { data: relationships } = await supabase
        .from("relationships")
        .select("*");

    return (
        <div className="flex-1 w-full relative flex flex-col pb-12">
            <div className="w-full relative z-20 py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <h1 className="title">Thống kê gia phả</h1>
                <p className="text-stone-500 mt-1 text-sm">
                    Tổng quan số liệu về các thành viên trong dòng họ
                </p>
            </div>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
                <FamilyStats
                    persons={persons ?? []}
                    relationships={relationships ?? []}
                />
            </main>

            {/* Lineage Manager – chỉ admin */}
            {(profile?.role === "admin" || profile?.role === "editor") && (
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-10">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-stone-800">Thứ tự gia phả</h2>
                        <p className="text-stone-500 mt-1 text-sm max-w-2xl">
                            Tự động tính toán và cập nhật{" "}
                            <strong className="text-stone-700">thế hệ</strong> (đời thứ mấy tính từ tổ) và{" "}
                            <strong className="text-stone-700">thứ tự sinh</strong> (con trưởng, con thứ…) cho tất cả thành viên. Xem preview trước khi áp dụng.
                        </p>
                    </div>

                    {/* Info cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div className="bg-white/80 rounded-2xl p-5 border border-stone-200/60 shadow-sm">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">🌳</span>
                                <div>
                                    <h3 className="font-bold text-stone-800 text-sm mb-1">
                                        Thế hệ (Generation)
                                    </h3>
                                    <p className="text-stone-500 text-xs leading-relaxed">
                                        Dùng thuật toán BFS từ các tổ tiên gốc (người chưa có thông
                                        tin bố/mẹ trong hệ thống). Tổ tiên = Đời 1, con = Đời 2, cháu
                                        = Đời 3... Con dâu/rể kế thừa đời của người bạn đời.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 rounded-2xl p-5 border border-stone-200/60 shadow-sm">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">👶</span>
                                <div>
                                    <h3 className="font-bold text-stone-800 text-sm mb-1">
                                        Thứ tự sinh (Birth Order)
                                    </h3>
                                    <p className="text-stone-500 text-xs leading-relaxed">
                                        Trong danh sách anh/chị/em cùng cha, sắp xếp theo năm sinh
                                        tăng dần và gán số thứ tự 1, 2, 3... Con dâu/rể không được
                                        tính thứ tự.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 rounded-2xl border border-stone-200/60 shadow-sm p-5 sm:p-8">
                        <LineageManager
                            persons={persons ?? []}
                            relationships={relationships ?? []}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}