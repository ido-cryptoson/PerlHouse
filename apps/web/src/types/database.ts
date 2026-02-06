export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      households: {
        Row: {
          created_at: string | null
          id: string
          invite_code: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invite_code?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invite_code?: string | null
          name?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          google_refresh_token: string | null
          household_id: string
          id: string
          name: string
          phone: string | null
          push_subscription: Json | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          google_refresh_token?: string | null
          household_id?: string
          id?: string
          name: string
          phone?: string | null
          push_subscription?: Json | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          google_refresh_token?: string | null
          household_id?: string
          id?: string
          name?: string
          phone?: string | null
          push_subscription?: Json | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          ai_confidence: number | null
          approved_at: string | null
          calendar_event_id: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          household_id: string
          icon: string | null
          id: string
          needs_calendar_event: boolean | null
          owner_id: string | null
          reply_suggestion: string | null
          source_raw: string | null
          source_type: string
          status: "pending" | "active" | "done" | "rejected"
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_confidence?: number | null
          approved_at?: string | null
          calendar_event_id?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          household_id: string
          icon?: string | null
          id?: string
          needs_calendar_event?: boolean | null
          owner_id?: string | null
          reply_suggestion?: string | null
          source_raw?: string | null
          source_type?: string
          status?: "pending" | "active" | "done" | "rejected"
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_confidence?: number | null
          approved_at?: string | null
          calendar_event_id?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          household_id?: string
          icon?: string | null
          id?: string
          needs_calendar_event?: boolean | null
          owner_id?: string | null
          reply_suggestion?: string | null
          source_raw?: string | null
          source_type?: string
          status?: "pending" | "active" | "done" | "rejected"
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      redeem_invite_code: { Args: { code: string }; Returns: boolean }
    }
    Enums: {
      source_type:
        | "whatsapp_text"
        | "whatsapp_image"
        | "whatsapp_voice"
        | "gmail"
        | "manual"
      task_category:
        | "בית"
        | "ילדים"
        | "כספים"
        | "בריאות"
        | "קניות"
        | "רכב"
        | "כללי"
      task_status: "pending" | "active" | "done" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// App-level interfaces (with computed fields from joins)
export interface Household {
  id: string;
  name: string;
  invite_code: string | null;
  created_at: string | null;
}

export interface Member {
  id: string;
  user_id: string | null;
  household_id: string;
  name: string;
  avatar_url: string | null;
  role: string | null;
  push_subscription: Json | null;
  created_at: string | null;
}

export interface Task {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  status: "pending" | "active" | "done" | "rejected";
  owner_id: string | null;
  due_date: string | null;
  due_time: string | null;
  completed_at: string | null;
  source_type: string | null;
  source_raw: string | null;
  ai_confidence: number | null;
  needs_calendar_event: boolean | null;
  reply_suggestion: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Computed from join
  owner_name?: string | null;
  owner_avatar_url?: string | null;
}
