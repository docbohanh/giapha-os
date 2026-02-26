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

  // Xác định rootId mặc định
  let finalRootId = rootId;

  if (!finalRootId) {
    const defaultRootPerson = persons.find((p) => p.is_default_root_node === true);
    if (defaultRootPerson) {
      finalRootId = defaultRootPerson.id;
    } else {
      // Fallback: người nam đầu tiên không có cha
      const childIds = new Set(
        relationships
          .filter((r) => r.type === "biological_child" || r.type === "adopted_child")
          .map((r) => r.person_b),
      );
      const rootPersons = persons.filter((p) => !childIds.has(p.id));
      const firstMaleRoot = rootPersons.find((p) => p.gender === "male");
      finalRootId = firstMaleRoot?.id ?? rootPersons[0]?.id ?? persons[0]?.id;
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
