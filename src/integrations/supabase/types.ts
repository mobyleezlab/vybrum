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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          payload: Json | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          payload?: Json | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          payload?: Json | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profile_with_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profile_with_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      avatars: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      credit_balances: {
        Row: {
          balance: number
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profile_with_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packages: {
        Row: {
          bonus_credits: number
          created_at: string
          credits: number
          google_product_id: string | null
          id: string
          is_active: boolean
          name: string
          price_brl: number
          sort_order: number
          total_credits: number | null
        }
        Insert: {
          bonus_credits?: number
          created_at?: string
          credits: number
          google_product_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_brl: number
          sort_order?: number
          total_credits?: number | null
        }
        Update: {
          bonus_credits?: number
          created_at?: string
          credits?: number
          google_product_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_brl?: number
          sort_order?: number
          total_credits?: number | null
        }
        Relationships: []
      }
      credit_purchases: {
        Row: {
          completed_at: string | null
          created_at: string
          credits_granted: number
          google_order_id: string | null
          google_purchase_token: string | null
          id: string
          package_id: string
          price_brl: number
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credits_granted: number
          google_order_id?: string | null
          google_purchase_token?: string | null
          id?: string
          package_id: string
          price_brl: number
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credits_granted?: number
          google_order_id?: string | null
          google_purchase_token?: string | null
          id?: string
          package_id?: string
          price_brl?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kits: {
        Row: {
          colors: Json
          created_at: string
          font_selected: string
          id: string
          is_premium_model: boolean
          model_code: string
          name: string
          player_name: string
          player_number: string
          shield_selected: string
          updated_at: string
          user_id: string
        }
        Insert: {
          colors?: Json
          created_at?: string
          font_selected?: string
          id?: string
          is_premium_model?: boolean
          model_code?: string
          name?: string
          player_name?: string
          player_number?: string
          shield_selected?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          colors?: Json
          created_at?: string
          font_selected?: string
          id?: string
          is_premium_model?: boolean
          model_code?: string
          name?: string
          player_name?: string
          player_number?: string
          shield_selected?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lgpd_requests: {
        Row: {
          admin_id: string | null
          completed_at: string | null
          id: string
          notes: string | null
          requested_at: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          completed_at?: string | null
          id?: string
          notes?: string | null
          requested_at?: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          completed_at?: string | null
          id?: string
          notes?: string | null
          requested_at?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lgpd_requests_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profile_with_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lgpd_requests_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lgpd_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lgpd_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          available_until: string | null
          buy_cost: number | null
          category: string
          code: string
          created_at: string
          drop_name: string | null
          is_limited: boolean
          is_premium: boolean
          name: string
          preview_url: string | null
          rarity_level: string
          sort_order: number | null
          sport: string | null
          svg_costas_url: string | null
          svg_frente_url: string | null
          thumbnail_url: string | null
          unlock_cost: number | null
          zones: Json | null
        }
        Insert: {
          available_until?: string | null
          buy_cost?: number | null
          category?: string
          code: string
          created_at?: string
          drop_name?: string | null
          is_limited?: boolean
          is_premium?: boolean
          name: string
          preview_url?: string | null
          rarity_level?: string
          sort_order?: number | null
          sport?: string | null
          svg_costas_url?: string | null
          svg_frente_url?: string | null
          thumbnail_url?: string | null
          unlock_cost?: number | null
          zones?: Json | null
        }
        Update: {
          available_until?: string | null
          buy_cost?: number | null
          category?: string
          code?: string
          created_at?: string
          drop_name?: string | null
          is_limited?: boolean
          is_premium?: boolean
          name?: string
          preview_url?: string | null
          rarity_level?: string
          sort_order?: number | null
          sport?: string | null
          svg_costas_url?: string | null
          svg_frente_url?: string | null
          thumbnail_url?: string | null
          unlock_cost?: number | null
          zones?: Json | null
        }
        Relationships: []
      }
      pack_items: {
        Row: {
          id: string
          model_code: string
          pack_id: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          model_code: string
          pack_id: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          model_code?: string
          pack_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pack_items_model_code_fkey"
            columns: ["model_code"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "pack_items_model_code_fkey"
            columns: ["model_code"]
            isOneToOne: false
            referencedRelation: "models_with_status"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "pack_items_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
      packs: {
        Row: {
          available_until: string | null
          category: string
          cost_credits: number
          created_at: string
          description: string | null
          discount_pct: number | null
          id: string
          is_active: boolean
          is_limited: boolean
          name: string
          original_value: number
          sort_order: number | null
          thumbnail_url: string | null
        }
        Insert: {
          available_until?: string | null
          category: string
          cost_credits: number
          created_at?: string
          description?: string | null
          discount_pct?: number | null
          id?: string
          is_active?: boolean
          is_limited?: boolean
          name: string
          original_value: number
          sort_order?: number | null
          thumbnail_url?: string | null
        }
        Update: {
          available_until?: string | null
          category?: string
          cost_credits?: number
          created_at?: string
          description?: string | null
          discount_pct?: number | null
          id?: string
          is_active?: boolean
          is_limited?: boolean
          name?: string
          original_value?: number
          sort_order?: number | null
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_id: string | null
          created_at: string
          data_deletion_requested_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_disabled: boolean
          last_seen_at: string | null
          plan: string
          plan_expires_at: string | null
          privacy_accepted_at: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string
        }
        Insert: {
          avatar_id?: string | null
          created_at?: string
          data_deletion_requested_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_disabled?: boolean
          last_seen_at?: string | null
          plan?: string
          plan_expires_at?: string | null
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
        }
        Update: {
          avatar_id?: string | null
          created_at?: string
          data_deletion_requested_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_disabled?: boolean
          last_seen_at?: string | null
          plan?: string
          plan_expires_at?: string | null
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatars"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action: string
          created_at: string
          id: string
          identifier: string
          requests: number
          window_start: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          identifier: string
          requests?: number
          window_start?: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          identifier?: string
          requests?: number
          window_start?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unlocked_packs: {
        Row: {
          created_at: string
          credits_spent: number
          id: string
          pack_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_spent: number
          id?: string
          pack_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_spent?: number
          id?: string
          pack_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unlocked_packs_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unlocked_packs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unlocked_packs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unlocked_templates: {
        Row: {
          created_at: string
          credits_spent: number
          export_credits_spent: number
          export_unlocked: boolean
          export_unlocked_at: string | null
          id: string
          model_code: string
          unlock_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_spent?: number
          export_credits_spent?: number
          export_unlocked?: boolean
          export_unlocked_at?: string | null
          id?: string
          model_code: string
          unlock_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_spent?: number
          export_credits_spent?: number
          export_unlocked?: boolean
          export_unlocked_at?: string | null
          id?: string
          model_code?: string
          unlock_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unlocked_templates_model_code_fkey"
            columns: ["model_code"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "unlocked_templates_model_code_fkey"
            columns: ["model_code"]
            isOneToOne: false
            referencedRelation: "models_with_status"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "unlocked_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unlocked_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_shields: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_default: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_default?: boolean | null
          name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_default?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_shields_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_shields_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      models_with_status: {
        Row: {
          available_until: string | null
          buy_cost: number | null
          category: string | null
          code: string | null
          days_remaining: number | null
          drop_name: string | null
          export_cost: number | null
          export_unlocked: boolean | null
          export_unlocked_at: string | null
          is_expired: boolean | null
          is_limited: boolean | null
          is_premium: boolean | null
          is_unlocked: boolean | null
          name: string | null
          preview_url: string | null
          rarity_level: string | null
          sort_order: number | null
          sport: string | null
          svg_costas_url: string | null
          svg_frente_url: string | null
          thumbnail_url: string | null
          unlock_cost: number | null
          unlock_type: string | null
          zones: Json | null
        }
        Relationships: []
      }
      profile_with_plan: {
        Row: {
          email: string | null
          full_name: string | null
          id: string | null
          is_disabled: boolean | null
          is_premium_active: boolean | null
          plan: string | null
          plan_expires_at: string | null
        }
        Insert: {
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_disabled?: boolean | null
          is_premium_active?: never
          plan?: string | null
          plan_expires_at?: string | null
        }
        Update: {
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_disabled?: boolean | null
          is_premium_active?: never
          plan?: string | null
          plan_expires_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_user_account: { Args: never; Returns: Json }
      export_user_data: { Args: never; Returns: Json }
      is_active_user: { Args: never; Returns: boolean }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { uid: string }; Returns: boolean }
      is_premium_active: { Args: never; Returns: boolean }
      unlock_export: { Args: { p_model_code: string }; Returns: Json }
      unlock_pack: { Args: { p_pack_id: string }; Returns: Json }
      unlock_template: { Args: { p_model_code: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
