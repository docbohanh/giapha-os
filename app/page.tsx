import { getPublicFamilyData } from "@/app/actions/publicData";
import Footer from "@/components/Footer";
import LandingHero from "@/components/LandingHero";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import config from "./config";
import { Suspense } from "react";

export default async function HomePage() {
  const { persons, relationships } = await getPublicFamilyData();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // Fetch user root node if logged in
  let userRootId: string | undefined;
  if (user) {
    const { data: userRootData } = await supabase
      .from("user_root_node")
      .select("root_node_id")
      .eq("user_id", user.id)
      .single();
    if (userRootData) {
      userRootId = userRootData.root_node_id;
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col selection:bg-amber-200 selection:text-amber-900 relative overflow-hidden">
      {/* Decorative background grid and blurs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-30%,#fef3c7,transparent)] pointer-events-none"></div>

      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden pointer-events-none flex justify-center">
        <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-amber-300/20 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-rose-200/20 rounded-full blur-[120px] mix-blend-multiply" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 md:py-32 relative z-10 w-full">
        <Suspense fallback={<div className="h-[600px] w-full flex items-center justify-center text-stone-400">Đang tải sơ đồ...</div>}>
          <LandingHero
            siteName={config.siteName}
            persons={persons}
            relationships={relationships}
            isLoggedIn={isLoggedIn}
            userRootId={userRootId}
          />
        </Suspense>
      </main>

      <Footer className="bg-transparent relative z-10 border-none" />
    </div>
  );
}
