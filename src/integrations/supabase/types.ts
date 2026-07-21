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
      business_accounts: {
        Row: {
          account_manager_id: string | null
          business_type: string | null
          company_name: string
          created_at: string
          credit_limit_mwk: number | null
          id: string
          is_active: boolean
          notes: string | null
          payment_terms: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_manager_id?: string | null
          business_type?: string | null
          company_name: string
          created_at?: string
          credit_limit_mwk?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          payment_terms?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_manager_id?: string | null
          business_type?: string | null
          company_name?: string
          created_at?: string
          credit_limit_mwk?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          payment_terms?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      combo_items: {
        Row: {
          combo_id: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          combo_id: string
          id?: string
          product_id: string
          quantity?: number
        }
        Update: {
          combo_id?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: []
      }
      combos: {
        Row: {
          created_at: string
          id: string
          image: string | null
          name: string
          price: number
          tagline: string | null
        }
        Insert: {
          created_at?: string
          id: string
          image?: string | null
          name: string
          price: number
          tagline?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image?: string | null
          name?: string
          price?: number
          tagline?: string | null
        }
        Relationships: []
      }
      culture_pillars: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      delivery_companies: {
        Row: {
          base_fee_mwk: number
          created_at: string
          description: string | null
          estimated_days: number | null
          id: string
          is_active: boolean
          is_same_day: boolean
          name: string
          service_area: string[] | null
          slug: string
        }
        Insert: {
          base_fee_mwk?: number
          created_at?: string
          description?: string | null
          estimated_days?: number | null
          id?: string
          is_active?: boolean
          is_same_day?: boolean
          name: string
          service_area?: string[] | null
          slug: string
        }
        Update: {
          base_fee_mwk?: number
          created_at?: string
          description?: string | null
          estimated_days?: number | null
          id?: string
          is_active?: boolean
          is_same_day?: boolean
          name?: string
          service_area?: string[] | null
          slug?: string
        }
        Relationships: []
      }
      delivery_options: {
        Row: {
          actual_delivery: string | null
          company_id: string
          created_at: string
          delivery_note: string | null
          estimated_delivery: string | null
          fee_mwk: number
          id: string
          order_id: string
          status: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          actual_delivery?: string | null
          company_id: string
          created_at?: string
          delivery_note?: string | null
          estimated_delivery?: string | null
          fee_mwk?: number
          id?: string
          order_id: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          actual_delivery?: string | null
          company_id?: string
          created_at?: string
          delivery_note?: string | null
          estimated_delivery?: string | null
          fee_mwk?: number
          id?: string
          order_id?: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          cost_price_mwk: number | null
          created_at: string
          id: string
          last_restocked: string | null
          location: string | null
          product_id: string
          quantity: number
          reorder_level: number
          reserved_quantity: number
          sku: string | null
          updated_at: string
        }
        Insert: {
          cost_price_mwk?: number | null
          created_at?: string
          id?: string
          last_restocked?: string | null
          location?: string | null
          product_id: string
          quantity?: number
          reorder_level?: number
          reserved_quantity?: number
          sku?: string | null
          updated_at?: string
        }
        Update: {
          cost_price_mwk?: number | null
          created_at?: string
          id?: string
          last_restocked?: string | null
          location?: string | null
          product_id?: string
          quantity?: number
          reorder_level?: number
          reserved_quantity?: number
          sku?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_transactions: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          notes: string | null
          quantity_change: number
          reference_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          notes?: string | null
          quantity_change: number
          reference_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          notes?: string | null
          quantity_change?: number
          reference_id?: string | null
          type?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_key: string
          product_name: string
          quantity: number
          unit_price_mwk: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_key: string
          product_name: string
          quantity: number
          unit_price_mwk: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_key?: string
          product_name?: string
          quantity?: number
          unit_price_mwk?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_location: string | null
          customer_name: string
          customer_phone: string
          delivery_fee_mwk: number | null
          id: string
          notes: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_mwk: number | null
          total_mwk: number
          updated_at: string
          user_id: string | null
          whatsapp_sent: boolean
        }
        Insert: {
          created_at?: string
          customer_location?: string | null
          customer_name: string
          customer_phone: string
          delivery_fee_mwk?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_mwk?: number | null
          total_mwk: number
          updated_at?: string
          user_id?: string | null
          whatsapp_sent?: boolean
        }
        Update: {
          created_at?: string
          customer_location?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_fee_mwk?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_mwk?: number | null
          total_mwk?: number
          updated_at?: string
          user_id?: string | null
          whatsapp_sent?: boolean
        }
        Relationships: []
      }
      payment_links: {
        Row: {
          amount_mwk: number
          created_at: string
          expires_at: string | null
          id: string
          order_id: string
          paid_at: string | null
          payment_method: string | null
          phone_number: string | null
          reference: string | null
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount_mwk: number
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          phone_number?: string | null
          reference?: string | null
          status?: string
          transaction_id?: string | null
        }
        Update: {
          amount_mwk?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          phone_number?: string | null
          reference?: string | null
          status?: string
          transaction_id?: string | null
        }
        Relationships: []
      }
      product_types: {
        Row: {
          created_at: string
          id: string
          name: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          benefit: string | null
          brand: string | null
          category: string
          created_at: string
          culture_pillar: string | null
          discount_percent: number | null
          gallery_images: Json | null
          id: string
          image: string | null
          images: Json | null
          is_active: boolean | null
          is_best_seller: boolean | null
          is_featured: boolean | null
          is_on_sale: boolean | null
          name: string
          price: number
          rating: number | null
          reward_points: number | null
          sort_order: number | null
          specs: Json | null
          stock_quantity: number | null
          supplier_id: string | null
          wearable_category: string | null
        }
        Insert: {
          benefit?: string | null
          brand?: string | null
          category?: string
          created_at?: string
          culture_pillar?: string | null
          discount_percent?: number | null
          gallery_images?: Json | null
          id: string
          image?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_best_seller?: boolean | null
          is_featured?: boolean | null
          is_on_sale?: boolean | null
          name: string
          price?: number
          rating?: number | null
          reward_points?: number | null
          sort_order?: number | null
          specs?: Json | null
          stock_quantity?: number | null
          supplier_id?: string | null
          wearable_category?: string | null
        }
        Update: {
          benefit?: string | null
          brand?: string | null
          category?: string
          created_at?: string
          culture_pillar?: string | null
          discount_percent?: number | null
          gallery_images?: Json | null
          id?: string
          image?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_best_seller?: boolean | null
          is_featured?: boolean | null
          is_on_sale?: boolean | null
          name?: string
          price?: number
          rating?: number | null
          reward_points?: number | null
          sort_order?: number | null
          specs?: Json | null
          stock_quantity?: number | null
          supplier_id?: string | null
          wearable_category?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string
          description: string | null
          discount_percent: number
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          start_date?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          location?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          is_active: boolean
          message: string
          rating: number
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          is_active?: boolean
          message: string
          rating: number
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          is_active?: boolean
          message?: string
          rating?: number
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
      wearable_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
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
      app_role: "admin" | "customer"
      order_status:
        | "new"
        | "confirmed"
        | "processing"
        | "dispatched"
        | "delivered"
        | "cancelled"
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
      app_role: ["admin", "customer"],
      order_status: [
        "new",
        "confirmed",
        "processing",
        "dispatched",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
