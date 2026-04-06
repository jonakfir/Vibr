export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          skills: string[] | null;
          experience_level: string | null;
          interests: string[] | null;
          resume_url: string | null;
          linkedin_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          skills?: string[] | null;
          experience_level?: string | null;
          interests?: string[] | null;
          resume_url?: string | null;
          linkedin_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          skills?: string[] | null;
          experience_level?: string | null;
          interests?: string[] | null;
          resume_url?: string | null;
          linkedin_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      sessions: {
        Row: {
          id: string;
          user_id: string | null;
          step: number;
          profile_data: Json | null;
          ideas: Json | null;
          selected_idea: Json | null;
          prompt: string | null;
          marketers: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          step?: number;
          profile_data?: Json | null;
          ideas?: Json | null;
          selected_idea?: Json | null;
          prompt?: string | null;
          marketers?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          step?: number;
          profile_data?: Json | null;
          ideas?: Json | null;
          selected_idea?: Json | null;
          prompt?: string | null;
          marketers?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      saved_prompts: {
        Row: {
          id: string;
          user_id: string | null;
          idea_name: string | null;
          prompt: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          idea_name?: string | null;
          prompt?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          idea_name?: string | null;
          prompt?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_prompts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      saved_names: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          names: Json | null;
          selected_name: string | null;
          domain: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          names?: Json | null;
          selected_name?: string | null;
          domain?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          names?: Json | null;
          selected_name?: string | null;
          domain?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_names_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_names_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      outreach_log: {
        Row: {
          id: string;
          user_id: string | null;
          marketer_name: string | null;
          marketer_email: string | null;
          email_subject: string | null;
          email_body: string | null;
          sent_at: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          marketer_name?: string | null;
          marketer_email?: string | null;
          email_subject?: string | null;
          email_body?: string | null;
          sent_at?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          marketer_name?: string | null;
          marketer_email?: string | null;
          email_subject?: string | null;
          email_body?: string | null;
          sent_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outreach_log_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
