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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      event_registrations: {
        Row: {
          company: string | null
          dietary_requirements: string | null
          email: string
          event_id: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          registered_at: string
          status: string
          user_id: string
        }
        Insert: {
          company?: string | null
          dietary_requirements?: string | null
          email: string
          event_id: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          registered_at?: string
          status?: string
          user_id: string
        }
        Update: {
          company?: string | null
          dietary_requirements?: string | null
          email?: string
          event_id?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          registered_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          agenda: Json | null
          created_at: string
          date: string
          description: string
          end_time: string
          event_type: string
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_members_only: boolean | null
          location: string
          max_attendees: number | null
          registration_deadline: string | null
          slug: string
          speakers: Json | null
          start_time: string
          status: string
          title: string
          updated_at: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          agenda?: Json | null
          created_at?: string
          date: string
          description: string
          end_time: string
          event_type: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_members_only?: boolean | null
          location: string
          max_attendees?: number | null
          registration_deadline?: string | null
          slug: string
          speakers?: Json | null
          start_time: string
          status?: string
          title: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          agenda?: Json | null
          created_at?: string
          date?: string
          description?: string
          end_time?: string
          event_type?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_members_only?: boolean | null
          location?: string
          max_attendees?: number | null
          registration_deadline?: string | null
          slug?: string
          speakers?: Json | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: []
      }
      founder_applications: {
        Row: {
          admin_notes: string | null
          amount_raising: string
          business_model: string
          co_founders: string | null
          company_name: string
          company_website: string | null
          created_at: string
          current_revenue: string | null
          customers_count: string | null
          founder_email: string
          founder_linkedin: string | null
          founder_name: string
          founder_phone: string
          founding_date: string | null
          id: string
          industry_sector: string
          key_metrics: Json | null
          location: string
          monthly_burn_rate: string | null
          pitch_deck_url: string | null
          previous_funding: string | null
          problem_statement: string
          referral_source: string | null
          solution_description: string
          stage: string
          status: string
          target_market: string
          team_size: number | null
          unique_value_proposition: string
          updated_at: string
          use_of_funds: string
          video_pitch_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount_raising: string
          business_model: string
          co_founders?: string | null
          company_name: string
          company_website?: string | null
          created_at?: string
          current_revenue?: string | null
          customers_count?: string | null
          founder_email: string
          founder_linkedin?: string | null
          founder_name: string
          founder_phone: string
          founding_date?: string | null
          id?: string
          industry_sector: string
          key_metrics?: Json | null
          location: string
          monthly_burn_rate?: string | null
          pitch_deck_url?: string | null
          previous_funding?: string | null
          problem_statement: string
          referral_source?: string | null
          solution_description: string
          stage: string
          status?: string
          target_market: string
          team_size?: number | null
          unique_value_proposition: string
          updated_at?: string
          use_of_funds: string
          video_pitch_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount_raising?: string
          business_model?: string
          co_founders?: string | null
          company_name?: string
          company_website?: string | null
          created_at?: string
          current_revenue?: string | null
          customers_count?: string | null
          founder_email?: string
          founder_linkedin?: string | null
          founder_name?: string
          founder_phone?: string
          founding_date?: string | null
          id?: string
          industry_sector?: string
          key_metrics?: Json | null
          location?: string
          monthly_burn_rate?: string | null
          pitch_deck_url?: string | null
          previous_funding?: string | null
          problem_statement?: string
          referral_source?: string | null
          solution_description?: string
          stage?: string
          status?: string
          target_market?: string
          team_size?: number | null
          unique_value_proposition?: string
          updated_at?: string
          use_of_funds?: string
          video_pitch_url?: string | null
        }
        Relationships: []
      }
      investor_applications: {
        Row: {
          aadhaar_document_url: string | null
          admin_notes: string | null
          annual_income_range: string
          bank_statement_url: string | null
          company_organization: string | null
          created_at: string
          email: string
          full_name: string
          how_did_you_hear: string | null
          id: string
          investment_experience: string
          investment_thesis: string
          linkedin_profile: string | null
          membership_type: string
          motivation: string
          net_worth_range: string
          pan_document_url: string | null
          phone: string
          portfolio_examples: string | null
          preferred_sectors: string[]
          previous_angel_investments: number | null
          professional_role: string
          reference_email_1: string | null
          reference_email_2: string | null
          reference_name_1: string | null
          reference_name_2: string | null
          status: string
          typical_check_size: string
          updated_at: string
          years_of_experience: number | null
        }
        Insert: {
          aadhaar_document_url?: string | null
          admin_notes?: string | null
          annual_income_range: string
          bank_statement_url?: string | null
          company_organization?: string | null
          created_at?: string
          email: string
          full_name: string
          how_did_you_hear?: string | null
          id?: string
          investment_experience: string
          investment_thesis: string
          linkedin_profile?: string | null
          membership_type: string
          motivation: string
          net_worth_range: string
          pan_document_url?: string | null
          phone: string
          portfolio_examples?: string | null
          preferred_sectors: string[]
          previous_angel_investments?: number | null
          professional_role: string
          reference_email_1?: string | null
          reference_email_2?: string | null
          reference_name_1?: string | null
          reference_name_2?: string | null
          status?: string
          typical_check_size: string
          updated_at?: string
          years_of_experience?: number | null
        }
        Update: {
          aadhaar_document_url?: string | null
          admin_notes?: string | null
          annual_income_range?: string
          bank_statement_url?: string | null
          company_organization?: string | null
          created_at?: string
          email?: string
          full_name?: string
          how_did_you_hear?: string | null
          id?: string
          investment_experience?: string
          investment_thesis?: string
          linkedin_profile?: string | null
          membership_type?: string
          motivation?: string
          net_worth_range?: string
          pan_document_url?: string | null
          phone?: string
          portfolio_examples?: string | null
          preferred_sectors?: string[]
          previous_angel_investments?: number | null
          professional_role?: string
          reference_email_1?: string | null
          reference_email_2?: string | null
          reference_name_1?: string | null
          reference_name_2?: string | null
          status?: string
          typical_check_size?: string
          updated_at?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
