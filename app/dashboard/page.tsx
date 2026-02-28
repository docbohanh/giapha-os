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
    // 1. Kiểm tra gốc cây cá nhân
    const { data: userRootNode } = await supabase
      .from("user_root_node")
      .select("root_node_id")
      .eq("user_id", user.id)
      .single();

    if (userRootNode) {
      finalRootId = userRootNode.root_node_id;
    } else {
      // 2. Fallback: Gốc cây mặc định hệ thống
      const defaultRootPerson = persons.find((p) => p.is_default_root_node === true);
      if (defaultRootPerson) {
        finalRootId = defaultRootPerson.id;
      } else {
        // 3. Fallback cuối cùng: người nam đầu tiên không có cha
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
  }

  // Tính stats để truyền vào ViewToggle
  const childrenMap = new Map<string, string[]>();
  const allChildIds = new Set<string>();
  relationships
    .filter((r) => r.type === "biological_child" || r.type === "adopted_child")
    .forEach((r) => {
      allChildIds.add(r.person_b);
      if (!childrenMap.has(r.person_a)) childrenMap.set(r.person_a, []);
      childrenMap.get(r.person_a)!.push(r.person_b);
    });
  const allRootIds = persons.filter((p) => !allChildIds.has(p.id)).map((p) => p.id);
  let maxGen = 0;
  if (allRootIds.length > 0) {
    const queue: Array<{ id: string; gen: number }> = allRootIds.map((id) => ({ id, gen: 1 }));
    const visited = new Set<string>();
    while (queue.length > 0) {
      const { id, gen } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      if (gen > maxGen) maxGen = gen;
      (childrenMap.get(id) ?? []).forEach((cid) => queue.push({ id: cid, gen: gen + 1 }));
    }
  }

  return (
    <DashboardProvider>
      <ViewToggle totalMembers={persons.length} generations={maxGen} />
      <DashboardViews persons={persons} relationships={relationships} />

      <MemberDetailModal />
    </DashboardProvider>
  );
}
