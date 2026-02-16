export type Json =
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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
      entity_contributors: {
        Row: {
          added_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_public: boolean
          title_label: string | null
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          is_public?: boolean
          title_label?: string | null
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_public?: boolean
          title_label?: string | null
          user_id?: string
        }
        Relationships: []
      }
      follow_edges: {
        Row: {
          created_at: string
          follower_user_id: string
          id: string
          target_issue_id: string | null
          target_org_id: string | null
          target_person_id: string | null
          target_project_id: string | null
          target_type: string
        }
        Insert: {
          created_at?: string
          follower_user_id: string
          id?: string
          target_issue_id?: string | null
          target_org_id?: string | null
          target_person_id?: string | null
          target_project_id?: string | null
          target_type: string
        }
        Update: {
          created_at?: string
          follower_user_id?: string
          id?: string
          target_issue_id?: string | null
          target_org_id?: string | null
          target_person_id?: string | null
          target_project_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_edges_target_issue_id_fkey"
            columns: ["target_issue_id"]
            isOneToOne: false
            referencedRelation: "watchdog_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_edges_target_org_id_fkey"
            columns: ["target_org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_edges_target_org_id_fkey"
            columns: ["target_org_id"]
            isOneToOne: false
            referencedRelation: "organisations_directory_v1"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_edges_target_org_id_fkey"
            columns: ["target_org_id"]
            isOneToOne: false
            referencedRelation: "verified_organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_edges_target_person_id_fkey"
            columns: ["target_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_edges_target_project_id_fkey"
            columns: ["target_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_edges_target_project_id_fkey"
            columns: ["target_project_id"]
            isOneToOne: false
            referencedRelation: "rejected_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      grants: {
        Row: {
          amount_max: number | null
          amount_min: number | null
          application_url: string
          contact_email: string | null
          created_at: string
          created_by: string
          currency: string
          deadline: string | null
          decision_date: string | null
          description: string | null
          eligible_countries: string[] | null
          eligible_regions: string[] | null
          funder_name: string | null
          funder_website: string | null
          funding_type: string
          id: string
          is_published: boolean
          keywords: string[] | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          notes_internal: string | null
          open_date: string | null
          owner_id: string
          owner_type: string
          project_type: string
          remote_ok: boolean
          sdgs: number[] | null
          slug: string
          source: string | null
          start_date: string | null
          status: string
          summary: string | null
          themes: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          amount_max?: number | null
          amount_min?: number | null
          application_url: string
          contact_email?: string | null
          created_at?: string
          created_by: string
          currency?: string
          deadline?: string | null
          decision_date?: string | null
          description?: string | null
          eligible_countries?: string[] | null
          eligible_regions?: string[] | null
          funder_name?: string | null
          funder_website?: string | null
          funding_type: string
          id?: string
          is_published?: boolean
          keywords?: string[] | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          notes_internal?: string | null
          open_date?: string | null
          owner_id: string
          owner_type: string
          project_type: string
          remote_ok?: boolean
          sdgs?: number[] | null
          slug: string
          source?: string | null
          start_date?: string | null
          status?: string
          summary?: string | null
          themes?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          amount_max?: number | null
          amount_min?: number | null
          application_url?: string
          contact_email?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          deadline?: string | null
          decision_date?: string | null
          description?: string | null
          eligible_countries?: string[] | null
          eligible_regions?: string[] | null
          funder_name?: string | null
          funder_website?: string | null
          funding_type?: string
          id?: string
          is_published?: boolean
          keywords?: string[] | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          notes_internal?: string | null
          open_date?: string | null
          owner_id?: string
          owner_type?: string
          project_type?: string
          remote_ok?: boolean
          sdgs?: number[] | null
          slug?: string
          source?: string | null
          start_date?: string | null
          status?: string
          summary?: string | null
          themes?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ifrc_challenges: {
        Row: {
          code: string | null
          id: number
          name: string
        }
        Insert: {
          code?: string | null
          id?: number
          name: string
        }
        Update: {
          code?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          href: string | null
          id: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organisation_members: {
        Row: {
          can_create_funding: boolean
          can_create_projects: boolean
          created_at: string | null
          organisation_id: string
          role: string
          user_id: string
        }
        Insert: {
          can_create_funding?: boolean
          can_create_projects?: boolean
          created_at?: string | null
          organisation_id: string
          role: string
          user_id: string
        }
        Update: {
          can_create_funding?: boolean
          can_create_projects?: boolean
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
          {
            foreignKeyName: "organisation_members_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations_directory_v1"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_members_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "verified_organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_updates: {
        Row: {
          author_user_id: string
          body: string
          created_at: string
          id: string
          organisation_id: string
          published_at: string
          title: string
          visibility: string
        }
        Insert: {
          author_user_id: string
          body: string
          created_at?: string
          id?: string
          organisation_id: string
          published_at?: string
          title: string
          visibility?: string
        }
        Update: {
          author_user_id?: string
          body?: string
          created_at?: string
          id?: string
          organisation_id?: string
          published_at?: string
          title?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_updates_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_updates_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations_directory_v1"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_updates_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "verified_organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          based_in_country: string | null
          based_in_region: string | null
          country: string | null
          country_based: string | null
          created_at: string | null
          created_by: string | null
          demographic_tags: string[] | null
          description: string | null
          existing_since: string | null
          founded_at: string | null
          funding_needed: number | null
          id: string
          intervention_tags: string[] | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          social_links: Json | null
          thematic_tags: string[] | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
          website: string | null
          what_we_do: string | null
        }
        Insert: {
          based_in_country?: string | null
          based_in_region?: string | null
          country?: string | null
          country_based?: string | null
          created_at?: string | null
          created_by?: string | null
          demographic_tags?: string[] | null
          description?: string | null
          existing_since?: string | null
          founded_at?: string | null
          funding_needed?: number | null
          id?: string
          intervention_tags?: string[] | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          social_links?: Json | null
          thematic_tags?: string[] | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          what_we_do?: string | null
        }
        Update: {
          based_in_country?: string | null
          based_in_region?: string | null
          country?: string | null
          country_based?: string | null
          created_at?: string | null
          created_by?: string | null
          demographic_tags?: string[] | null
          description?: string | null
          existing_since?: string | null
          founded_at?: string | null
          funding_needed?: number | null
          id?: string
          intervention_tags?: string[] | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          social_links?: Json | null
          thematic_tags?: string[] | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          what_we_do?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country_based: string | null
          country_from: string | null
          created_at: string | null
          date_of_birth: string | null
          email_notifications_enabled: boolean
          first_name: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          kind: string
          last_name: string | null
          nationality: string | null
          occupation: string | null
          organisation_id: string | null
          organisation_name: string | null
          role: string
          social_links: Json | null
          surname: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country_based?: string | null
          country_from?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email_notifications_enabled?: boolean
          first_name?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          kind?: string
          last_name?: string | null
          nationality?: string | null
          occupation?: string | null
          organisation_id?: string | null
          organisation_name?: string | null
          role?: string
          social_links?: Json | null
          surname?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country_based?: string | null
          country_from?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email_notifications_enabled?: boolean
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          kind?: string
          last_name?: string | null
          nationality?: string | null
          occupation?: string | null
          organisation_id?: string | null
          organisation_name?: string | null
          role?: string
          social_links?: Json | null
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
          {
            foreignKeyName: "profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations_directory_v1"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "verified_organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_collaborators: {
        Row: {
          created_at: string
          created_by: string | null
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_collaborators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_collaborators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "rejected_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_ifrc_challenges: {
        Row: {
          challenge_id: number
          project_id: string
        }
        Insert: {
          challenge_id: number
          project_id: string
        }
        Update: {
          challenge_id?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_ifrc_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "ifrc_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_ifrc_challenges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_ifrc_challenges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "rejected_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_links: {
        Row: {
          created_at: string | null
          id: string
          label: string | null
          project_id: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label?: string | null
          project_id?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string | null
          project_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "rejected_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_media: {
        Row: {
          caption: string | null
          created_at: string | null
          created_by: string | null
          id: string
          mime_type: string | null
          path: string
          project_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          mime_type?: string | null
          path: string
          project_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          mime_type?: string | null
          path?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "rejected_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_partners: {
        Row: {
          organisation_id: string
          project_id: string
        }
        Insert: {
          organisation_id: string
          project_id: string
        }
        Update: {
          organisation_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_partners_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_partners_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations_directory_v1"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_partners_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "verified_organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_partners_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_partners_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "rejected_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_posts: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          project_id: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "rejected_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_sdgs: {
        Row: {
          project_id: string
          sdg_id: number
        }
        Insert: {
          project_id: string
          sdg_id: number
        }
        Update: {
          project_id?: string
          sdg_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_sdgs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_sdgs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "rejected_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_sdgs_sdg_id_fkey"
            columns: ["sdg_id"]
            isOneToOne: false
            referencedRelation: "sdgs"
            referencedColumns: ["id"]
          },
        ]
      }
      project_shares: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_shares_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_shares_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "rejected_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          author_user_id: string
          body: string
          created_at: string
          id: string
          project_id: string
          published_at: string
          title: string
          visibility: string
        }
        Insert: {
          author_user_id: string
          body: string
          created_at?: string
          id?: string
          project_id: string
          published_at?: string
          title: string
          visibility?: string
        }
        Update: {
          author_user_id?: string
          body?: string
          created_at?: string
          id?: string
          project_id?: string
          published_at?: string
          title?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "rejected_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          amount_needed: number | null
          approved_at: string | null
          approved_by: string | null
          category: string
          country: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          donations_received: number | null
          end_date: string | null
          id: string
          ifrc_global_challenges: string[] | null
          intervention_type: string | null
          lat: number | null
          lead_org_id: string | null
          lifecycle_status: string
          links: Json | null
          lives_improved: number | null
          lng: number | null
          name: string
          owner_id: string
          owner_type: string
          partner_org_ids: string[] | null
          place_name: string | null
          region: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          review_status: string
          sdgs: string[] | null
          slug: string | null
          start_date: string | null
          status: string
          target_demographic: string | null
          target_demographics: string[] | null
          thematic_area: string[] | null
          type_of_intervention: string[] | null
          visibility: string | null
        }
        Insert: {
          amount_needed?: number | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          donations_received?: number | null
          end_date?: string | null
          id?: string
          ifrc_global_challenges?: string[] | null
          intervention_type?: string | null
          lat?: number | null
          lead_org_id?: string | null
          lifecycle_status?: string
          links?: Json | null
          lives_improved?: number | null
          lng?: number | null
          name: string
          owner_id: string
          owner_type: string
          partner_org_ids?: string[] | null
          place_name?: string | null
          region?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          review_status?: string
          sdgs?: string[] | null
          slug?: string | null
          start_date?: string | null
          status?: string
          target_demographic?: string | null
          target_demographics?: string[] | null
          thematic_area?: string[] | null
          type_of_intervention?: string[] | null
          visibility?: string | null
        }
        Update: {
          amount_needed?: number | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          donations_received?: number | null
          end_date?: string | null
          id?: string
          ifrc_global_challenges?: string[] | null
          intervention_type?: string | null
          lat?: number | null
          lead_org_id?: string | null
          lifecycle_status?: string
          links?: Json | null
          lives_improved?: number | null
          lng?: number | null
          name?: string
          owner_id?: string
          owner_type?: string
          partner_org_ids?: string[] | null
          place_name?: string | null
          region?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          review_status?: string
          sdgs?: string[] | null
          slug?: string | null
          start_date?: string | null
          status?: string
          target_demographic?: string | null
          target_demographics?: string[] | null
          thematic_area?: string[] | null
          type_of_intervention?: string[] | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_lead_org_id_fkey"
            columns: ["lead_org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_org_id_fkey"
            columns: ["lead_org_id"]
            isOneToOne: false
            referencedRelation: "organisations_directory_v1"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_org_id_fkey"
            columns: ["lead_org_id"]
            isOneToOne: false
            referencedRelation: "verified_organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      sdgs: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      update_comments: {
        Row: {
          author_user_id: string
          body: string
          created_at: string
          id: string
          update_id: string
          updated_at: string
        }
        Insert: {
          author_user_id: string
          body: string
          created_at?: string
          id?: string
          update_id: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string
          body?: string
          created_at?: string
          id?: string
          update_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      update_likes: {
        Row: {
          created_at: string
          id: string
          update_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          update_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          update_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
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
      watchdog_issue_updates: {
        Row: {
          author_user_id: string
          body: string
          created_at: string
          id: string
          issue_id: string
          published_at: string
          title: string
          visibility: string
        }
        Insert: {
          author_user_id: string
          body: string
          created_at?: string
          id?: string
          issue_id: string
          published_at?: string
          title: string
          visibility?: string
        }
        Update: {
          author_user_id?: string
          body?: string
          created_at?: string
          id?: string
          issue_id?: string
          published_at?: string
          title?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchdog_issue_updates_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "watchdog_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      watchdog_issues: {
        Row: {
          affected_demographics: string[]
          affected_groups_text: string | null
          approved_at: string | null
          approved_by: string | null
          city: string | null
          contact_allowed: boolean
          country: string | null
          created_at: string
          created_by: string
          date_observed: string | null
          description: string
          desired_outcome: string | null
          evidence_links: string[]
          global_challenges: string[]
          id: string
          latitude: number
          longitude: number
          region: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          reporter_anonymous: boolean
          sdgs: number[]
          status: string
          title: string
          updated_at: string
          urgency: number
        }
        Insert: {
          affected_demographics?: string[]
          affected_groups_text?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          contact_allowed?: boolean
          country?: string | null
          created_at?: string
          created_by: string
          date_observed?: string | null
          description: string
          desired_outcome?: string | null
          evidence_links?: string[]
          global_challenges?: string[]
          id?: string
          latitude: number
          longitude: number
          region?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          reporter_anonymous?: boolean
          sdgs?: number[]
          status?: string
          title: string
          updated_at?: string
          urgency?: number
        }
        Update: {
          affected_demographics?: string[]
          affected_groups_text?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          contact_allowed?: boolean
          country?: string | null
          created_at?: string
          created_by?: string
          date_observed?: string | null
          description?: string
          desired_outcome?: string | null
          evidence_links?: string[]
          global_challenges?: string[]
          id?: string
          latitude?: number
          longitude?: number
          region?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          reporter_anonymous?: boolean
          sdgs?: number[]
          status?: string
          title?: string
          updated_at?: string
          urgency?: number
        }
        Relationships: []
      }
    }
    Views: {
      activity_feed_items: {
        Row: {
          actor_user_id: string | null
          created_at: string | null
          event_type: string | null
          grant_id: string | null
          id: string | null
          issue_id: string | null
          org_id: string | null
          person_profile_id: string | null
          project_id: string | null
          summary: string | null
          title: string | null
          update_id: string | null
        }
        Relationships: []
      }
      organisations_directory_v1: {
        Row: {
          age_years: number | null
          based_in_country: string | null
          based_in_region: string | null
          demographic_tags: string[] | null
          description: string | null
          followers_count: number | null
          founded_at: string | null
          funding_needed: number | null
          id: string | null
          intervention_tags: string[] | null
          lat: number | null
          lng: number | null
          name: string | null
          projects_ongoing_count: number | null
          projects_total_count: number | null
          thematic_tags: string[] | null
          website: string | null
        }
        Insert: {
          age_years?: never
          based_in_country?: never
          based_in_region?: string | null
          demographic_tags?: string[] | null
          description?: never
          followers_count?: never
          founded_at?: never
          funding_needed?: number | null
          id?: string | null
          intervention_tags?: string[] | null
          lat?: number | null
          lng?: number | null
          name?: string | null
          projects_ongoing_count?: never
          projects_total_count?: never
          thematic_tags?: string[] | null
          website?: string | null
        }
        Update: {
          age_years?: never
          based_in_country?: never
          based_in_region?: string | null
          demographic_tags?: string[] | null
          description?: never
          followers_count?: never
          founded_at?: never
          funding_needed?: number | null
          id?: string | null
          intervention_tags?: string[] | null
          lat?: number | null
          lng?: number | null
          name?: string | null
          projects_ongoing_count?: never
          projects_total_count?: never
          thematic_tags?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
      rejected_projects: {
        Row: {
          amount_needed: number | null
          approved_at: string | null
          approved_by: string | null
          category: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          donations_received: number | null
          end_date: string | null
          id: string | null
          ifrc_global_challenges: string[] | null
          intervention_type: string | null
          lat: number | null
          lead_org_id: string | null
          lifecycle_status: string | null
          links: Json | null
          lives_improved: number | null
          lng: number | null
          name: string | null
          partner_org_ids: string[] | null
          place_name: string | null
          region: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          review_status: string | null
          sdgs: string[] | null
          slug: string | null
          start_date: string | null
          status: string | null
          target_demographic: string | null
          target_demographics: string[] | null
          thematic_area: string[] | null
          type_of_intervention: string[] | null
        }
        Insert: {
          amount_needed?: number | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          donations_received?: number | null
          end_date?: string | null
          id?: string | null
          ifrc_global_challenges?: string[] | null
          intervention_type?: string | null
          lat?: number | null
          lead_org_id?: string | null
          lifecycle_status?: string | null
          links?: Json | null
          lives_improved?: number | null
          lng?: number | null
          name?: string | null
          partner_org_ids?: string[] | null
          place_name?: string | null
          region?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          review_status?: string | null
          sdgs?: string[] | null
          slug?: string | null
          start_date?: string | null
          status?: string | null
          target_demographic?: string | null
          target_demographics?: string[] | null
          thematic_area?: string[] | null
          type_of_intervention?: string[] | null
        }
        Update: {
          amount_needed?: number | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          donations_received?: number | null
          end_date?: string | null
          id?: string | null
          ifrc_global_challenges?: string[] | null
          intervention_type?: string | null
          lat?: number | null
          lead_org_id?: string | null
          lifecycle_status?: string | null
          links?: Json | null
          lives_improved?: number | null
          lng?: number | null
          name?: string | null
          partner_org_ids?: string[] | null
          place_name?: string | null
          region?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          review_status?: string | null
          sdgs?: string[] | null
          slug?: string | null
          start_date?: string | null
          status?: string | null
          target_demographic?: string | null
          target_demographics?: string[] | null
          thematic_area?: string[] | null
          type_of_intervention?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_lead_org_id_fkey"
            columns: ["lead_org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_org_id_fkey"
            columns: ["lead_org_id"]
            isOneToOne: false
            referencedRelation: "organisations_directory_v1"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_org_id_fkey"
            columns: ["lead_org_id"]
            isOneToOne: false
            referencedRelation: "verified_organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      verified_organisations: {
        Row: {
          id: string | null
          name: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_project_collaborator_by_email: {
        Args: { email: string; pid: string; role: string }
        Returns: string
      }
      approve_project: { Args: { p_project_id: string }; Returns: undefined }
      can_admin_projects: { Args: never; Returns: boolean }
      create_notification: {
        Args: {
          body: string
          href: string
          metadata: Json
          title: string
          type: string
          user_id: string
        }
        Returns: string
      }
      create_project_submission: {
        Args: {
          p_amount_needed: number
          p_currency: string
          p_description: string
          p_donations_received: number
          p_end_date: string
          p_ifrc_ids: number[]
          p_lat: number
          p_lead_org_id: string
          p_links: Json
          p_lives_improved: number
          p_lng: number
          p_name: string
          p_owner_id: string
          p_owner_type: string
          p_partner_org_ids: string[]
          p_place_name: string
          p_sdg_ids: number[]
          p_start_date: string
          p_target_demographic: string
          p_thematic_area: string[]
          p_type_of_intervention: string[]
        }
        Returns: {
          id: string
          status: string
        }[]
      }
      generate_project_slug: {
        Args: { project_id: string; project_name: string }
        Returns: string
      }
      get_activity_feed_items: {
        Args: {
          cursor_created_at?: string
          cursor_id?: string
          page_size?: number
          scope: string
        }
        Returns: {
          actor_user_id: string
          created_at: string
          event_type: string
          grant_id: string
          id: string
          issue_id: string
          org_id: string
          person_profile_id: string
          project_id: string
          summary: string
          title: string
          update_id: string
        }[]
      }
      get_home_stats: {
        Args: never
        Returns: {
          funding_funders_registered: number
          funding_open_calls: number
          funding_opportunities_total: number
          issues_issues_open: number
          issues_issues_total: number
          projects_donations_received_eur: number
          projects_organisations_registered: number
          projects_projects_approved: number
          projects_projects_ongoing: number
          updated_at: string
        }[]
      }
      get_project_collaborators: {
        Args: { pid: string }
        Returns: {
          created_at: string
          created_by: string
          email: string
          full_name: string
          organisation_name: string
          role: string
          user_id: string
        }[]
      }
      get_unread_notification_count: { Args: never; Returns: number }
      grant_admin: { Args: { p_email: string }; Returns: undefined }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { uid: string }; Returns: boolean }
      is_admin_email: { Args: { e: string }; Returns: boolean }
      is_moderator: { Args: never; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      is_superadmin_email: { Args: { e: string }; Returns: boolean }
      mark_all_notifications_read: { Args: never; Returns: undefined }
      mark_notification_read: { Args: { nid: string }; Returns: undefined }
      reject_project: { Args: { p_project_id: string }; Returns: undefined }
      remove_project_collaborator: {
        Args: { pid: string; target_id: string }
        Returns: string
      }
      revoke_admin: { Args: { p_email: string }; Returns: undefined }
      slugify_project_name: { Args: { project_name: string }; Returns: string }
      user_can_edit_project: { Args: { pid: string }; Returns: boolean }
      user_can_view_project: { Args: { pid: string }; Returns: boolean }
      user_can_view_project_private: { Args: { pid: string }; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      project_approval_status: ["pending", "approved", "rejected"],
    },
  },
} as const
