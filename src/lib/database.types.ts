[?25l[?2004h
                                                                                              
  >  1. djfptkcnbanbagrgntuz [name: Platform, org: knzefoxbtkdkqvgpzmpj, region: eu-central-1]
                                                                                              
                                                                                              
    ↑/k up • ↓/j down • / filter • q quit • ? more                                            
                                                                                              [D[6A [J[D[2K[?2004l[?25h[?1002l[?1003l[?1006lexport type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          added_at: string | null
          added_by: string | null
          email: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          email: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          email?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: boolean
          superadmin_email: string
        }
        Insert: {
          id?: boolean
          superadmin_email: string
        }
        Update: {
          id?: boolean
          superadmin_email?: string
        }
        Relationships: []
      }
      organisation_members: {
        Row: {
          created_at: string | null
          organisation_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          organisation_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          organisation_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_members_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          website: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          website?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          kind: string
          nationality: string | null
          organisation_id: string | null
          organisation_name: string | null
          surname: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          kind?: string
          nationality?: string | null
          organisation_id?: string | null
          organisation_name?: string | null
          surname?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          kind?: string
          nationality?: string | null
          organisation_id?: string | null
          organisation_name?: string | null
          surname?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          approval_status: Database["public"]["Enums"]["project_approval_status"]
          approved_at: string | null
          approved_by: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          donations_received: number | null
          end_date: string | null
          funding_needed: number | null
          id: string
          ifrc_global_challenges: string[] | null
          intervention_type: string | null
          lat: number | null
          lead_org_id: string | null
          links: Json | null
          lives_improved: number | null
          lng: number | null
          partner_org_ids: string[] | null
          region: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          review_status: string
          sdgs: string[] | null
          start_date: string | null
          status: string
          target_demographics: string[] | null
          thematic_area: string | null
          title: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["project_approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          donations_received?: number | null
          end_date?: string | null
          funding_needed?: number | null
          id?: string
          ifrc_global_challenges?: string[] | null
          intervention_type?: string | null
          lat?: number | null
          lead_org_id?: string | null
          links?: Json | null
          lives_improved?: number | null
          lng?: number | null
          partner_org_ids?: string[] | null
          region?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          review_status?: string
          sdgs?: string[] | null
          start_date?: string | null
          status?: string
          target_demographics?: string[] | null
          thematic_area?: string | null
          title: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["project_approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          donations_received?: number | null
          end_date?: string | null
          funding_needed?: number | null
          id?: string
          ifrc_global_challenges?: string[] | null
          intervention_type?: string | null
          lat?: number | null
          lead_org_id?: string | null
          links?: Json | null
          lives_improved?: number | null
          lng?: number | null
          partner_org_ids?: string[] | null
          region?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          review_status?: string
          sdgs?: string[] | null
          start_date?: string | null
          status?: string
          target_demographics?: string[] | null
          thematic_area?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_lead_org_id_fkey"
            columns: ["lead_org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      watchdog_cases: {
        Row: {
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          ifrc_global_challenges: string[] | null
          lat: number | null
          links: Json | null
          lng: number | null
          location: string | null
          region: string | null
          review_status: string
          sdgs: string[] | null
          target_demographics: string[] | null
          title: string
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          ifrc_global_challenges?: string[] | null
          lat?: number | null
          links?: Json | null
          lng?: number | null
          location?: string | null
          region?: string | null
          review_status?: string
          sdgs?: string[] | null
          target_demographics?: string[] | null
          title: string
        }
        Update: {
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          ifrc_global_challenges?: string[] | null
          lat?: number | null
          links?: Json | null
          lng?: number | null
          location?: string | null
          region?: string | null
          review_status?: string
          sdgs?: string[] | null
          target_demographics?: string[] | null
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      rejected_projects: {
        Row: {
          approval_status:
            | Database["public"]["Enums"]["project_approval_status"]
            | null
          approved_at: string | null
          approved_by: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          donations_received: number | null
          end_date: string | null
          funding_needed: number | null
          id: string | null
          ifrc_global_challenges: string[] | null
          intervention_type: string | null
          lat: number | null
          lead_org_id: string | null
          links: Json | null
          lives_improved: number | null
          lng: number | null
          partner_org_ids: string[] | null
          region: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          review_status: string | null
          sdgs: string[] | null
          start_date: string | null
          status: string | null
          target_demographics: string[] | null
          thematic_area: string | null
          title: string | null
        }
        Insert: {
          approval_status?:
            | Database["public"]["Enums"]["project_approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          donations_received?: number | null
          end_date?: string | null
          funding_needed?: number | null
          id?: string | null
          ifrc_global_challenges?: string[] | null
          intervention_type?: string | null
          lat?: number | null
          lead_org_id?: string | null
          links?: Json | null
          lives_improved?: number | null
          lng?: number | null
          partner_org_ids?: string[] | null
          region?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          review_status?: string | null
          sdgs?: string[] | null
          start_date?: string | null
          status?: string | null
          target_demographics?: string[] | null
          thematic_area?: string | null
          title?: string | null
        }
        Update: {
          approval_status?:
            | Database["public"]["Enums"]["project_approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          donations_received?: number | null
          end_date?: string | null
          funding_needed?: number | null
          id?: string | null
          ifrc_global_challenges?: string[] | null
          intervention_type?: string | null
          lat?: number | null
          lead_org_id?: string | null
          links?: Json | null
          lives_improved?: number | null
          lng?: number | null
          partner_org_ids?: string[] | null
          region?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          review_status?: string | null
          sdgs?: string[] | null
          start_date?: string | null
          status?: string | null
          target_demographics?: string[] | null
          thematic_area?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_lead_org_id_fkey"
            columns: ["lead_org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { uid: string }
        Returns: boolean
      }
      is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      project_approval_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      project_approval_status: ["pending", "approved", "rejected"],
    },
  },
} as const
