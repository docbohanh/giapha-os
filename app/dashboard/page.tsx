import { DashboardProvider } from "@/components/DashboardContext";
import DashboardViews from "@/components/DashboardViews";
import MemberDetailModal from "@/components/MemberDetailModal";
import ViewToggle from "@/components/ViewToggle";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ view?: string; rootId?: string }>;
}

export default async function FamilyTreePage({ searchParams }: PageProps) {
  const { rootId } = await searchParams;

  // If view is list, we only need persons, not relationships.
  // We fetch persons for all views to pass down as a prop if we want, or let components fetch.
  // Actually, to make transitions fast and avoid duplicate fetching across components,
  // we will fetch data here and pass it down as props.
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: personsData } = await supabase
    .from("persons")
    .select("*")
    .order("birth_year", { ascending: true, nullsFirst: false });

  const { data: relsData } = await supabase.from("relationships").select("*");

  const persons = personsData || [];
  const relationships = relsData || [];

  // Prepare map and roots for tree views
  const personsMap = new Map();
  persons.forEach((p) => personsMap.set(p.id, p));

  const childIds = new Set(
    relationships
      .filter(
        (r) => r.type === "biological_child" || r.type === "adopted_child",
      )
      .map((r) => r.person_b),
  );

  let finalRootId = rootId;

  // Fallback 1: cookie set by admin via "Đặt làm gốc cây" button
  if (!finalRootId) {
    const cookieRootId = cookieStore.get("defaultRootId")?.value;
    if (cookieRootId && personsMap.has(cookieRootId)) {
      finalRootId = cookieRootId;
    }
  }

  // Fallback 2: hardcoded default root, then first person with no parent
  if (!finalRootId || !personsMap.has(finalRootId)) {
    const hardcodedDefault = "14d16c52-78dd-4cee-b5a1-f14d0cf426e3";
    if (personsMap.has(hardcodedDefault)) {
      finalRootId = hardcodedDefault;
    } else {
      const rootsFallback = persons.filter((p) => !childIds.has(p.id));
      if (rootsFallback.length > 0) {
        finalRootId = rootsFallback[0].id;
      } else if (persons.length > 0) {
        finalRootId = persons[0].id;
      }
    }
  }

  return (
    <DashboardProvider>
      <ViewToggle />
      <DashboardViews persons={persons} relationships={relationships} />

      <MemberDetailModal />
    </DashboardProvider>
  );
}
