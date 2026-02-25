"use server";

import { Person, Relationship } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export interface PublicFamilyData {
    persons: Person[];
    relationships: Relationship[];
}

/**
 * Fetch public family tree data without auth check.
 * Access is governed purely by Supabase RLS policies.
 * If RLS restricts anon access, returns empty arrays (no crash).
 */
export async function getPublicFamilyData(): Promise<PublicFamilyData> {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: persons } = await supabase
            .from("persons")
            .select(
                "id, full_name, gender, birth_year, birth_month, birth_day, death_year, death_month, death_day, is_deceased, is_in_law, avatar_url",
            )
            .order("birth_year", { ascending: true, nullsFirst: false });

        const { data: relationships } = await supabase
            .from("relationships")
            .select("*");

        return {
            persons: (persons as Person[]) || [],
            relationships: (relationships as Relationship[]) || [],
        };
    } catch {
        return { persons: [], relationships: [] };
    }
}
