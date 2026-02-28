export type Gender = "male" | "female" | "other";
export type RelationshipType =
  | "marriage"
  | "biological_child"
  | "adopted_child";
export type UserRole = "admin" | "member";

export interface Profile {
  id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUserData {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Person {
  id: string;
  full_name: string;
  gender: Gender;
  birth_year: number | null;
  birth_month: number | null;
  birth_day: number | null;
  death_year: number | null;
  death_month: number | null;
  death_day: number | null;
  avatar_url: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;

  // Private fields (optional, as they might not be returned for members)
  phone_number?: string | null;
  occupation?: string | null;
  current_residence?: string | null;

  // New fields
  is_deceased: boolean;
  is_in_law: boolean;
  is_default_root_node?: boolean | null;
}

export interface Relationship {
  id: string;
  type: RelationshipType;
  person_a: string; // UUID
  person_b: string; // UUID
  note?: string | null;
  sort_order?: number | null;
  created_at: string;
}

// Helper types for UI
export interface PersonWithDetails extends Person {
  spouses?: Person[];
  children?: Person[];
  parents?: Person[];
}

export type EditRequestStatus = "pending" | "approved" | "rejected";

export interface EditRequest {
  id: string;
  person_id: string;
  user_id: string;
  content: string;
  status: EditRequestStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  persons?: { full_name: string } | null;
  user_email?: string | null;
}

export interface UserRootNode {
  user_id: string;
  root_node_id: string;
  created_at: string;
  updated_at: string;
}
