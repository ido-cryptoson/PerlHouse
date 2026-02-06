export interface Household {
  id: string;
  name: string;
  invite_code: string | null;
  created_at: string;
}

export interface Member {
  id: string;
  user_id: string;
  household_id: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

export interface Task {
  id: string;
  household_id: string;
  title: string;
  icon: string | null;
  category: string | null;
  status: "pending" | "active" | "done" | "rejected";
  owner_id: string | null;
  due_date: string | null;
  due_time: string | null;
  completed_at: string | null;
  source_type: string | null;
  source_preview: string | null;
  ai_suggestion: string | null;
  ai_confidence: number;
  needs_calendar_event: boolean;
  reply_suggestion: string | null;
  created_at: string;
  updated_at: string;
  owner_display_name?: string | null;
  owner_avatar_url?: string | null;
}

export interface Database {
  public: {
    Tables: {
      households: { Row: Household; Insert: Omit<Household, "id" | "created_at">; Update: Partial<Omit<Household, "id">>; };
      members: { Row: Member; Insert: Omit<Member, "id" | "created_at">; Update: Partial<Omit<Member, "id">>; };
      tasks: { Row: Task; Insert: Omit<Task, "id" | "created_at" | "updated_at" | "owner_display_name" | "owner_avatar_url">; Update: Partial<Omit<Task, "id" | "owner_display_name" | "owner_avatar_url">>; };
    };
    Views: Record<string, never>;
    Functions: { redeem_invite_code: { Args: { code: string }; Returns: boolean }; };
    Enums: Record<string, never>;
  };
}
