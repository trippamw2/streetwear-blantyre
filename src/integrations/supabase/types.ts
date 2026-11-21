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
      auth_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          brand_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_user_id: string
          brand_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          brand_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_audit_log_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_messages: {
        Row: {
          audience: string
          body: string
          brand_id: string
          channel: string
          created_at: string
          created_by: string | null
          id: string
          recipients_count: number
          sent_at: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          audience?: string
          body: string
          brand_id: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          recipients_count?: number
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          brand_id?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          recipients_count?: number
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      brand_settings: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_settings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_accounts: {
        Row: {
          account_manager_id: string | null
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          brand_id: string
          business_type: string | null
          company_name: string
          created_at: string
          credit_limit_mwk: number | null
          id: string
          is_active: boolean
          min_order_mwk: number
          notes: string | null
          notes_internal: string | null
          payment_terms: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
          wholesale_discount_percent: number
        }
        Insert: {
          account_manager_id?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          brand_id?: string
          business_type?: string | null
          company_name: string
          created_at?: string
          credit_limit_mwk?: number | null
          id?: string
          is_active?: boolean
          min_order_mwk?: number
          notes?: string | null
          notes_internal?: string | null
          payment_terms?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
          wholesale_discount_percent?: number
        }
        Update: {
          account_manager_id?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          brand_id?: string
          business_type?: string | null
          company_name?: string
          created_at?: string
          credit_limit_mwk?: number | null
          id?: string
          is_active?: boolean
          min_order_mwk?: number
          notes?: string | null
          notes_internal?: string | null
          payment_terms?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
          wholesale_discount_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_accounts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_items: {
        Row: {
          brand_id: string
          combo_id: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          brand_id?: string
          combo_id: string
          id?: string
          product_id: string
          quantity?: number
        }
        Update: {
          brand_id?: string
          combo_id?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "combo_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_items_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "combos"
            referencedColumns: ["id"]
          },
        ]
      }
      combos: {
        Row: {
          badge: string
          brand_id: string
          created_at: string
          description: string
          discount_percent: number
          hook: string
          id: string
          image: string | null
          is_active: boolean
          lifestyle: string
          name: string
          price: number
          sort_order: number
          stock: number
          tagline: string | null
          updated_at: string
          vibe: string
        }
        Insert: {
          badge?: string
          brand_id?: string
          created_at?: string
          description?: string
          discount_percent?: number
          hook?: string
          id: string
          image?: string | null
          is_active?: boolean
          lifestyle?: string
          name: string
          price?: number
          sort_order?: number
          stock?: number
          tagline?: string | null
          updated_at?: string
          vibe?: string
        }
        Update: {
          badge?: string
          brand_id?: string
          created_at?: string
          description?: string
          discount_percent?: number
          hook?: string
          id?: string
          image?: string | null
          is_active?: boolean
          lifestyle?: string
          name?: string
          price?: number
          sort_order?: number
          stock?: number
          tagline?: string | null
          updated_at?: string
          vibe?: string
        }
        Relationships: [
          {
            foreignKeyName: "combos_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      culture_pillars: {
        Row: {
          brand_id: string
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
          brand_id?: string
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
          brand_id?: string
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
        Relationships: [
          {
            foreignKeyName: "culture_pillars_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      culture_stories: {
        Row: {
          author_name: string | null
          brand_id: string
          content: string
          created_at: string
          culture_pillar: string
          excerpt: string | null
          hero_image: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          published_at: string | null
          read_time_minutes: number | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          brand_id?: string
          content: string
          created_at?: string
          culture_pillar: string
          excerpt?: string | null
          hero_image?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          read_time_minutes?: number | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          brand_id?: string
          content?: string
          created_at?: string
          culture_pillar?: string
          excerpt?: string | null
          hero_image?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          read_time_minutes?: number | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "culture_stories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_loyalty: {
        Row: {
          available_points: number | null
          brand_id: string
          created_at: string | null
          email: string | null
          id: string
          last_activity_at: string | null
          lifetime_spent_mwk: number | null
          redeemed_points: number | null
          tier: string | null
          total_points: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          available_points?: number | null
          brand_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          last_activity_at?: string | null
          lifetime_spent_mwk?: number | null
          redeemed_points?: number | null
          tier?: string | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          available_points?: number | null
          brand_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          last_activity_at?: string | null
          lifetime_spent_mwk?: number | null
          redeemed_points?: number | null
          tier?: string | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_loyalty_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          brand_id: string
          created_at: string
          full_name: string | null
          location: string | null
          marketing_consent: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          full_name?: string | null
          location?: string | null
          marketing_consent?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          full_name?: string | null
          location?: string | null
          marketing_consent?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_subscribers: {
        Row: {
          brand_id: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string | null
          phone: string | null
          source: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
          whatsapp_consent: boolean | null
        }
        Insert: {
          brand_id?: string
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          phone?: string | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          whatsapp_consent?: boolean | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          phone?: string | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          whatsapp_consent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_subscribers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_assignments: {
        Row: {
          brand_id: string
          created_at: string
          delivered_at: string | null
          dispatched_at: string | null
          driver_name: string | null
          failed_reason: string | null
          id: string
          notes: string | null
          order_id: string | null
          slot_id: string | null
          status: string
        }
        Insert: {
          brand_id?: string
          created_at?: string
          delivered_at?: string | null
          dispatched_at?: string | null
          driver_name?: string | null
          failed_reason?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          slot_id?: string | null
          status?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          delivered_at?: string | null
          dispatched_at?: string | null
          driver_name?: string | null
          failed_reason?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          slot_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "delivery_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_companies: {
        Row: {
          base_fee_mwk: number
          brand_id: string
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
          brand_id?: string
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
          brand_id?: string
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
        Relationships: [
          {
            foreignKeyName: "delivery_companies_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_options: {
        Row: {
          actual_delivery: string | null
          brand_id: string
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
          brand_id?: string
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
          brand_id?: string
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
        Relationships: [
          {
            foreignKeyName: "delivery_options_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_options_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_options_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_slots: {
        Row: {
          booked_orders: number
          booked_weight_kg: number
          brand_id: string
          capacity_orders: number
          capacity_weight_kg: number
          created_at: string
          cutoff_at: string
          delivery_date: string
          id: string
          is_open: boolean
          zone_id: string | null
        }
        Insert: {
          booked_orders?: number
          booked_weight_kg?: number
          brand_id?: string
          capacity_orders?: number
          capacity_weight_kg?: number
          created_at?: string
          cutoff_at: string
          delivery_date: string
          id?: string
          is_open?: boolean
          zone_id?: string | null
        }
        Update: {
          booked_orders?: number
          booked_weight_kg?: number
          brand_id?: string
          capacity_orders?: number
          capacity_weight_kg?: number
          created_at?: string
          cutoff_at?: string
          delivery_date?: string
          id?: string
          is_open?: boolean
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_slots_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_slots_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          base_fee_mwk: number
          brand_id: string
          center_lat: number | null
          center_lng: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          min_order_mwk: number
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          base_fee_mwk?: number
          brand_id?: string
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_order_mwk?: number
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          base_fee_mwk?: number
          brand_id?: string
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_order_mwk?: number
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      fish_inventory_batches: {
        Row: {
          brand_id: string
          created_at: string
          expiry_date: string | null
          freshness_grade: string | null
          id: string
          lot_id: string | null
          notes: string | null
          received_date: string
          species_id: string | null
          supplier_brand_id: string | null
          supplier_id: string | null
          updated_at: string
          weight_kg_available: number
          weight_kg_received: number
          weight_kg_reserved: number
          weight_kg_sold: number
          weight_kg_wasted: number
        }
        Insert: {
          brand_id?: string
          created_at?: string
          expiry_date?: string | null
          freshness_grade?: string | null
          id?: string
          lot_id?: string | null
          notes?: string | null
          received_date: string
          species_id?: string | null
          supplier_brand_id?: string | null
          supplier_id?: string | null
          updated_at?: string
          weight_kg_available?: number
          weight_kg_received: number
          weight_kg_reserved?: number
          weight_kg_sold?: number
          weight_kg_wasted?: number
        }
        Update: {
          brand_id?: string
          created_at?: string
          expiry_date?: string | null
          freshness_grade?: string | null
          id?: string
          lot_id?: string | null
          notes?: string | null
          received_date?: string
          species_id?: string | null
          supplier_brand_id?: string | null
          supplier_id?: string | null
          updated_at?: string
          weight_kg_available?: number
          weight_kg_received?: number
          weight_kg_reserved?: number
          weight_kg_sold?: number
          weight_kg_wasted?: number
        }
        Relationships: [
          {
            foreignKeyName: "fish_inventory_batches_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fish_inventory_batches_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lf_lot_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fish_inventory_batches_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "fish_species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fish_inventory_batches_supplier_brand_id_fkey"
            columns: ["supplier_brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fish_inventory_batches_supplier_fk"
            columns: ["supplier_id", "supplier_brand_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id", "brand_id"]
          },
        ]
      }
      fish_products: {
        Row: {
          availability_status: string
          brand_id: string
          created_at: string
          description: string | null
          id: string
          image: string | null
          images: Json
          is_active: boolean
          min_order_qty_kg: number
          name: string
          pilot_option: string | null
          preparation_options: Json
          price_per_kg_mwk: number
          sort_order: number
          species_id: string | null
          updated_at: string
        }
        Insert: {
          availability_status?: string
          brand_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          images?: Json
          is_active?: boolean
          min_order_qty_kg?: number
          name: string
          pilot_option?: string | null
          preparation_options?: Json
          price_per_kg_mwk: number
          sort_order?: number
          species_id?: string | null
          updated_at?: string
        }
        Update: {
          availability_status?: string
          brand_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          images?: Json
          is_active?: boolean
          min_order_qty_kg?: number
          name?: string
          pilot_option?: string | null
          preparation_options?: Json
          price_per_kg_mwk?: number
          sort_order?: number
          species_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fish_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fish_products_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "fish_species"
            referencedColumns: ["id"]
          },
        ]
      }
      fish_species: {
        Row: {
          brand_id: string
          created_at: string
          description: string | null
          handling_info: string | null
          id: string
          image: string | null
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          storage_info: string | null
          updated_at: string
        }
        Insert: {
          brand_id?: string
          created_at?: string
          description?: string | null
          handling_info?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          storage_info?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          description?: string | null
          handling_info?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          storage_info?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fish_species_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      fish_stock_reservations: {
        Row: {
          batch_id: string
          brand_id: string
          created_at: string
          expires_at: string | null
          id: string
          order_id: string | null
          status: string
          weight_kg: number
        }
        Insert: {
          batch_id: string
          brand_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          status?: string
          weight_kg: number
        }
        Update: {
          batch_id?: string
          brand_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          status?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "fish_stock_reservations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "fish_inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fish_stock_reservations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fish_stock_reservations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_items: {
        Row: {
          brand_id: string
          created_at: string
          gift_id: string
          id: string
          product_id: string
          product_image: string | null
          product_name: string
          quantity: number
          size: string | null
          unit_price_mwk: number
        }
        Insert: {
          brand_id?: string
          created_at?: string
          gift_id: string
          id?: string
          product_id: string
          product_image?: string | null
          product_name: string
          quantity?: number
          size?: string | null
          unit_price_mwk: number
        }
        Update: {
          brand_id?: string
          created_at?: string
          gift_id?: string
          id?: string
          product_id?: string
          product_image?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
          unit_price_mwk?: number
        }
        Relationships: [
          {
            foreignKeyName: "gift_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_items_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_reviews: {
        Row: {
          brand_id: string
          created_at: string
          gift_id: string
          id: string
          is_active: boolean | null
          rating: number
          review_text: string | null
          reviewer_name: string
        }
        Insert: {
          brand_id?: string
          created_at?: string
          gift_id: string
          id?: string
          is_active?: boolean | null
          rating: number
          review_text?: string | null
          reviewer_name: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          gift_id?: string
          id?: string
          is_active?: boolean | null
          rating?: number
          review_text?: string | null
          reviewer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_reviews_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_reviews_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_tracking: {
        Row: {
          brand_id: string
          created_at: string
          gift_id: string
          id: string
          note: string | null
          status: string
        }
        Insert: {
          brand_id?: string
          created_at?: string
          gift_id: string
          id?: string
          note?: string | null
          status: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          gift_id?: string
          id?: string
          note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_tracking_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_tracking_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          brand_id: string
          charge_id: string | null
          created_at: string
          delivery_location: string | null
          gift_message: string | null
          gift_pack_id: string | null
          gift_type: string
          id: string
          is_paid: boolean | null
          occasion: string | null
          paid_at: string | null
          payment_reference: string | null
          payment_status: string | null
          preferred_delivery_date: string | null
          provider_reference: string | null
          recipient_email: string | null
          recipient_name: string
          recipient_phone: string
          review_submitted: boolean | null
          sender_email: string | null
          sender_id: string | null
          sender_name: string
          status: string
          total_mwk: number
          tracking_token: string
          updated_at: string
        }
        Insert: {
          brand_id?: string
          charge_id?: string | null
          created_at?: string
          delivery_location?: string | null
          gift_message?: string | null
          gift_pack_id?: string | null
          gift_type: string
          id?: string
          is_paid?: boolean | null
          occasion?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          preferred_delivery_date?: string | null
          provider_reference?: string | null
          recipient_email?: string | null
          recipient_name: string
          recipient_phone: string
          review_submitted?: boolean | null
          sender_email?: string | null
          sender_id?: string | null
          sender_name: string
          status?: string
          total_mwk: number
          tracking_token: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          charge_id?: string | null
          created_at?: string
          delivery_location?: string | null
          gift_message?: string | null
          gift_pack_id?: string | null
          gift_type?: string
          id?: string
          is_paid?: boolean | null
          occasion?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          preferred_delivery_date?: string | null
          provider_reference?: string | null
          recipient_email?: string | null
          recipient_name?: string
          recipient_phone?: string
          review_submitted?: boolean | null
          sender_email?: string | null
          sender_id?: string | null
          sender_name?: string
          status?: string
          total_mwk?: number
          tracking_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gifts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          brand_id: string
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
          brand_id?: string
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
          brand_id?: string
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
        Relationships: [
          {
            foreignKeyName: "inventory_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          inventory_id: string
          notes: string | null
          quantity_change: number
          reference_id: string | null
          type: string
        }
        Insert: {
          brand_id?: string
          created_at?: string
          id?: string
          inventory_id: string
          notes?: string | null
          quantity_change: number
          reference_id?: string | null
          type: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          inventory_id?: string
          notes?: string | null
          quantity_change?: number
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_delivery_events: {
        Row: {
          actor_id: string | null
          brand_id: string
          created_at: string
          id: string
          note: string | null
          order_id: string
          proof_url: string
        }
        Insert: {
          actor_id?: string | null
          brand_id?: string
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          proof_url: string
        }
        Update: {
          actor_id?: string | null
          brand_id?: string
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          proof_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lf_delivery_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_delivery_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_growth_events: {
        Row: {
          brand_id: string
          created_at: string
          event_type: string
          id: string
          path: string | null
          ref_code: string | null
          session_key: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          brand_id?: string
          created_at?: string
          event_type: string
          id?: string
          path?: string | null
          ref_code?: string | null
          session_key: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          event_type?: string
          id?: string
          path?: string | null
          ref_code?: string | null
          session_key?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lf_growth_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_lifecycle_outbox: {
        Row: {
          attempts: number
          brand_id: string
          created_at: string
          due_at: string
          id: string
          kind: string
          last_error: string | null
          order_id: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          brand_id?: string
          created_at?: string
          due_at: string
          id?: string
          kind: string
          last_error?: string | null
          order_id: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          brand_id?: string
          created_at?: string
          due_at?: string
          id?: string
          kind?: string
          last_error?: string | null
          order_id?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lf_lifecycle_outbox_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_lifecycle_outbox_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_lot_records: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          expiry_date: string | null
          id: string
          lot_code: string
          notes: string | null
          received_date: string
          source_location: string | null
          species_id: string | null
          supplier_brand_id: string | null
          supplier_id: string | null
          updated_at: string
          weight_kg_received: number
        }
        Insert: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          lot_code: string
          notes?: string | null
          received_date?: string
          source_location?: string | null
          species_id?: string | null
          supplier_brand_id?: string | null
          supplier_id?: string | null
          updated_at?: string
          weight_kg_received?: number
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          lot_code?: string
          notes?: string | null
          received_date?: string
          source_location?: string | null
          species_id?: string | null
          supplier_brand_id?: string | null
          supplier_id?: string | null
          updated_at?: string
          weight_kg_received?: number
        }
        Relationships: [
          {
            foreignKeyName: "lf_lot_records_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_lot_records_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "fish_species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_lot_records_supplier_brand_id_fkey"
            columns: ["supplier_brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_lot_records_supplier_fk"
            columns: ["supplier_id", "supplier_brand_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id", "brand_id"]
          },
        ]
      }
      lf_newsletter_subscribers: {
        Row: {
          brand_id: string
          consent_given: boolean
          created_at: string
          email: string
          id: string
          name: string | null
          source: string
        }
        Insert: {
          brand_id?: string
          consent_given?: boolean
          created_at?: string
          email: string
          id?: string
          name?: string | null
          source?: string
        }
        Update: {
          brand_id?: string
          consent_given?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "lf_newsletter_subscribers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_qa_checks: {
        Row: {
          batch_id: string | null
          brand_id: string
          check_type: string
          checked_at: string
          checked_by: string | null
          created_at: string
          id: string
          lot_id: string | null
          notes: string | null
          result: string
        }
        Insert: {
          batch_id?: string | null
          brand_id?: string
          check_type: string
          checked_at?: string
          checked_by?: string | null
          created_at?: string
          id?: string
          lot_id?: string | null
          notes?: string | null
          result: string
        }
        Update: {
          batch_id?: string | null
          brand_id?: string
          check_type?: string
          checked_at?: string
          checked_by?: string | null
          created_at?: string
          id?: string
          lot_id?: string | null
          notes?: string | null
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "lf_qa_checks_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "fish_inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_qa_checks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_qa_checks_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lf_lot_records"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_quote_items: {
        Row: {
          estimated_unit_price_mwk: number | null
          id: string
          notes: string | null
          product_name: string
          product_type: string
          quantity: number
          quote_id: string
          unit: string | null
        }
        Insert: {
          estimated_unit_price_mwk?: number | null
          id?: string
          notes?: string | null
          product_name: string
          product_type: string
          quantity?: number
          quote_id: string
          unit?: string | null
        }
        Update: {
          estimated_unit_price_mwk?: number | null
          id?: string
          notes?: string | null
          product_name?: string
          product_type?: string
          quantity?: number
          quote_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lf_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "lf_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_quotes: {
        Row: {
          brand_id: string
          business_account_id: string | null
          created_at: string
          id: string
          notes: string | null
          requester_email: string | null
          requester_name: string
          requester_phone: string | null
          status: string
          total_mwk: number | null
          updated_at: string
        }
        Insert: {
          brand_id?: string
          business_account_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          requester_email?: string | null
          requester_name: string
          requester_phone?: string | null
          status?: string
          total_mwk?: number | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          business_account_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          requester_email?: string | null
          requester_name?: string
          requester_phone?: string | null
          status?: string
          total_mwk?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lf_quotes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_quotes_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_recall_events: {
        Row: {
          brand_id: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          reason: string
          recall_ref: string
          started_at: string
          status: string
        }
        Insert: {
          brand_id?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          reason: string
          recall_ref: string
          started_at?: string
          status?: string
        }
        Update: {
          brand_id?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string
          recall_ref?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lf_recall_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_recall_lots: {
        Row: {
          action_taken: string | null
          affected_weight_kg: number | null
          brand_id: string
          created_at: string
          id: string
          lot_id: string
          recall_id: string
        }
        Insert: {
          action_taken?: string | null
          affected_weight_kg?: number | null
          brand_id?: string
          created_at?: string
          id?: string
          lot_id: string
          recall_id: string
        }
        Update: {
          action_taken?: string | null
          affected_weight_kg?: number | null
          brand_id?: string
          created_at?: string
          id?: string
          lot_id?: string
          recall_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lf_recall_lots_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_recall_lots_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lf_lot_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_recall_lots_recall_id_fkey"
            columns: ["recall_id"]
            isOneToOne: false
            referencedRelation: "lf_recall_events"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_recipe_products: {
        Row: {
          fish_product_id: string | null
          id: string
          product_name: string | null
          product_type: string
          recipe_id: string
          sort_order: number
        }
        Insert: {
          fish_product_id?: string | null
          id?: string
          product_name?: string | null
          product_type?: string
          recipe_id: string
          sort_order?: number
        }
        Update: {
          fish_product_id?: string | null
          id?: string
          product_name?: string | null
          product_type?: string
          recipe_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lf_recipe_products_fish_product_id_fkey"
            columns: ["fish_product_id"]
            isOneToOne: false
            referencedRelation: "fish_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_recipe_products_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "lf_recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_recipes: {
        Row: {
          brand_id: string
          cook_time_min: number | null
          cooking_method: string | null
          created_at: string
          id: string
          image: string | null
          ingredients: Json
          is_active: boolean
          pdf_url: string | null
          prep_time_min: number | null
          qr_target_url: string | null
          recommended_spice: string | null
          safety_notes: string | null
          servings: number | null
          slug: string
          sort_order: number
          species_id: string | null
          steps: Json
          title: string
          updated_at: string
        }
        Insert: {
          brand_id?: string
          cook_time_min?: number | null
          cooking_method?: string | null
          created_at?: string
          id?: string
          image?: string | null
          ingredients?: Json
          is_active?: boolean
          pdf_url?: string | null
          prep_time_min?: number | null
          qr_target_url?: string | null
          recommended_spice?: string | null
          safety_notes?: string | null
          servings?: number | null
          slug: string
          sort_order?: number
          species_id?: string | null
          steps?: Json
          title: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          cook_time_min?: number | null
          cooking_method?: string | null
          created_at?: string
          id?: string
          image?: string | null
          ingredients?: Json
          is_active?: boolean
          pdf_url?: string | null
          prep_time_min?: number | null
          qr_target_url?: string | null
          recommended_spice?: string | null
          safety_notes?: string | null
          servings?: number | null
          slug?: string
          sort_order?: number
          species_id?: string | null
          steps?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lf_recipes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_recipes_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "fish_species"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_reconciliation_audit: {
        Row: {
          action: string
          actor_id: string | null
          brand_id: string
          created_at: string
          details: Json
          difference_mwk: number | null
          estimated_total_mwk: number | null
          final_total_mwk: number | null
          id: string
          order_id: string
          reconciliation_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          brand_id: string
          created_at?: string
          details?: Json
          difference_mwk?: number | null
          estimated_total_mwk?: number | null
          final_total_mwk?: number | null
          id?: string
          order_id: string
          reconciliation_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          brand_id?: string
          created_at?: string
          details?: Json
          difference_mwk?: number | null
          estimated_total_mwk?: number | null
          final_total_mwk?: number | null
          id?: string
          order_id?: string
          reconciliation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lf_reconciliation_audit_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_reconciliation_audit_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_reconciliation_audit_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "price_reconciliation"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_refund_audit: {
        Row: {
          actor_id: string | null
          amount_mwk: number
          brand_id: string
          created_at: string
          gateway_reference: string | null
          gateway_response: Json | null
          id: string
          order_id: string
          reason: string
        }
        Insert: {
          actor_id?: string | null
          amount_mwk: number
          brand_id: string
          created_at?: string
          gateway_reference?: string | null
          gateway_response?: Json | null
          id?: string
          order_id: string
          reason: string
        }
        Update: {
          actor_id?: string | null
          amount_mwk?: number
          brand_id?: string
          created_at?: string
          gateway_reference?: string | null
          gateway_response?: Json | null
          id?: string
          order_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "lf_refund_audit_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_refund_audit_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_reviews: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body: string
          brand_id: string
          created_at: string
          customer_name: string
          customer_user_id: string | null
          id: string
          moderation_note: string | null
          order_id: string
          product_id: string | null
          product_type: string
          rating: number
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body: string
          brand_id?: string
          created_at?: string
          customer_name: string
          customer_user_id?: string | null
          id?: string
          moderation_note?: string | null
          order_id: string
          product_id?: string | null
          product_type?: string
          rating: number
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body?: string
          brand_id?: string
          created_at?: string
          customer_name?: string
          customer_user_id?: string | null
          id?: string
          moderation_note?: string | null
          order_id?: string
          product_id?: string | null
          product_type?: string
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lf_reviews_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_saved_list_items: {
        Row: {
          id: string
          list_id: string
          product_id: string | null
          product_name: string
          product_type: string
          quantity: number
          unit: string | null
        }
        Insert: {
          id?: string
          list_id: string
          product_id?: string | null
          product_name: string
          product_type: string
          quantity?: number
          unit?: string | null
        }
        Update: {
          id?: string
          list_id?: string
          product_id?: string | null
          product_name?: string
          product_type?: string
          quantity?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lf_saved_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lf_saved_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_saved_lists: {
        Row: {
          brand_id: string
          business_account_id: string | null
          created_at: string
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          brand_id?: string
          business_account_id?: string | null
          created_at?: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          brand_id?: string
          business_account_id?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lf_saved_lists_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_saved_lists_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_spices: {
        Row: {
          brand_id: string
          created_at: string
          description: string | null
          id: string
          image: string | null
          images: Json
          ingredients: string | null
          is_active: boolean
          name: string
          price_mwk: number
          recommended_species: string[]
          size_label: string | null
          sort_order: number
          stock_qty: number
          updated_at: string
        }
        Insert: {
          brand_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          images?: Json
          ingredients?: string | null
          is_active?: boolean
          name: string
          price_mwk?: number
          recommended_species?: string[]
          size_label?: string | null
          sort_order?: number
          stock_qty?: number
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          images?: Json
          ingredients?: string | null
          is_active?: boolean
          name?: string
          price_mwk?: number
          recommended_species?: string[]
          size_label?: string | null
          sort_order?: number
          stock_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lf_spices_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_subscription_charges: {
        Row: {
          amount_mwk: number
          brand_id: string
          created_at: string
          gateway_reference: string | null
          id: string
          order_id: string | null
          payment_reference: string
          period_date: string
          reminded_at: string | null
          status: string
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount_mwk: number
          brand_id?: string
          created_at?: string
          gateway_reference?: string | null
          id?: string
          order_id?: string | null
          payment_reference: string
          period_date: string
          reminded_at?: string | null
          status?: string
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount_mwk?: number
          brand_id?: string
          created_at?: string
          gateway_reference?: string | null
          id?: string
          order_id?: string | null
          payment_reference?: string
          period_date?: string
          reminded_at?: string | null
          status?: string
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lf_subscription_charges_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_subscription_charges_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_subscription_charges_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "lf_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_subscriptions: {
        Row: {
          brand_id: string
          consent_given: boolean
          consent_given_at: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_zone_id: string | null
          fish_product_id: string | null
          id: string
          last_charged_at: string | null
          mandate_ref: string | null
          next_charge_date: string | null
          notes: string | null
          payment_reference: string | null
          plan: string
          preparation: string
          price_per_kg_mwk: number
          quantity_kg: number
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          brand_id?: string
          consent_given?: boolean
          consent_given_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_zone_id?: string | null
          fish_product_id?: string | null
          id?: string
          last_charged_at?: string | null
          mandate_ref?: string | null
          next_charge_date?: string | null
          notes?: string | null
          payment_reference?: string | null
          plan: string
          preparation?: string
          price_per_kg_mwk?: number
          quantity_kg?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          brand_id?: string
          consent_given?: boolean
          consent_given_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_zone_id?: string | null
          fish_product_id?: string | null
          id?: string
          last_charged_at?: string | null
          mandate_ref?: string | null
          next_charge_date?: string | null
          notes?: string | null
          payment_reference?: string | null
          plan?: string
          preparation?: string
          price_per_kg_mwk?: number
          quantity_kg?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lf_subscriptions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_subscriptions_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_subscriptions_fish_product_id_fkey"
            columns: ["fish_product_id"]
            isOneToOne: false
            referencedRelation: "fish_products"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_support_events: {
        Row: {
          action: string
          brand_id: string
          created_at: string
          details: Json
          id: string
          ticket_id: string | null
        }
        Insert: {
          action: string
          brand_id?: string
          created_at?: string
          details?: Json
          id?: string
          ticket_id?: string | null
        }
        Update: {
          action?: string
          brand_id?: string
          created_at?: string
          details?: Json
          id?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lf_support_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_support_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "lf_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_support_messages: {
        Row: {
          actor_role: string
          actor_user_id: string | null
          body: string
          brand_id: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          actor_role: string
          actor_user_id?: string | null
          body: string
          brand_id?: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          actor_role?: string
          actor_user_id?: string | null
          body?: string
          brand_id?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lf_support_messages_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "lf_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_support_tickets: {
        Row: {
          access_token: string | null
          brand_id: string
          category: string
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          first_response_at: string | null
          id: string
          order_id: string | null
          priority: string
          requester_user_id: string | null
          resolved_at: string | null
          sla_breached_at: string | null
          sla_due_at: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          brand_id?: string
          category?: string
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          first_response_at?: string | null
          id?: string
          order_id?: string | null
          priority?: string
          requester_user_id?: string | null
          resolved_at?: string | null
          sla_breached_at?: string | null
          sla_due_at?: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          brand_id?: string
          category?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          first_response_at?: string | null
          id?: string
          order_id?: string | null
          priority?: string
          requester_user_id?: string | null
          resolved_at?: string | null
          sla_breached_at?: string | null
          sla_due_at?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lf_support_tickets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lf_support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lf_wholesale_prices: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          is_active: boolean
          min_qty: number
          product_id: string
          product_name: string
          product_type: string
          updated_at: string
          wholesale_price_mwk: number
        }
        Insert: {
          brand_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          min_qty?: number
          product_id: string
          product_name: string
          product_type: string
          updated_at?: string
          wholesale_price_mwk?: number
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          min_qty?: number
          product_id?: string
          product_name?: string
          product_type?: string
          updated_at?: string
          wholesale_price_mwk?: number
        }
        Relationships: [
          {
            foreignKeyName: "lf_wholesale_prices_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      lookbook_items: {
        Row: {
          brand_id: string
          created_at: string
          editorial_note: string | null
          id: string
          lookbook_id: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          brand_id?: string
          created_at?: string
          editorial_note?: string | null
          id?: string
          lookbook_id: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          editorial_note?: string | null
          id?: string
          lookbook_id?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lookbook_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lookbook_items_lookbook_id_fkey"
            columns: ["lookbook_id"]
            isOneToOne: false
            referencedRelation: "lookbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      lookbooks: {
        Row: {
          brand_id: string
          created_at: string
          culture_pillar: string | null
          description: string | null
          hero_image: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          season: string | null
          slug: string
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          brand_id?: string
          created_at?: string
          culture_pillar?: string | null
          description?: string | null
          hero_image?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          season?: string | null
          slug: string
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          culture_pillar?: string | null
          description?: string | null
          hero_image?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          season?: string | null
          slug?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lookbooks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_programs: {
        Row: {
          brand_id: string
          created_at: string | null
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          max_redeem_percent: number | null
          min_order_mwk: number | null
          name: string
          points_per_mwk: number
          points_to_redeem: number
          reward_value_mwk: number
          starts_at: string | null
          updated_at: string | null
        }
        Insert: {
          brand_id?: string
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_redeem_percent?: number | null
          min_order_mwk?: number | null
          name: string
          points_per_mwk?: number
          points_to_redeem?: number
          reward_value_mwk?: number
          starts_at?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_redeem_percent?: number | null
          min_order_mwk?: number | null
          name?: string
          points_per_mwk?: number
          points_to_redeem?: number
          reward_value_mwk?: number
          starts_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_programs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tiers: {
        Row: {
          brand_id: string
          created_at: string | null
          discount_percent: number | null
          free_delivery: boolean | null
          id: string
          min_lifetime_points: number
          name: string
          points_multiplier: number | null
          priority_support: boolean | null
        }
        Insert: {
          brand_id?: string
          created_at?: string | null
          discount_percent?: number | null
          free_delivery?: boolean | null
          id?: string
          min_lifetime_points: number
          name: string
          points_multiplier?: number | null
          priority_support?: boolean | null
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          discount_percent?: number | null
          free_delivery?: boolean | null
          id?: string
          min_lifetime_points?: number
          name?: string
          points_multiplier?: number | null
          priority_support?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_tiers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          brand_id: string
          created_at: string | null
          description: string | null
          id: string
          order_id: string | null
          points: number
          type: string
          user_id: string | null
        }
        Insert: {
          brand_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          points: number
          type: string
          user_id?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          order_id: string
          product_key: string
          product_name: string
          quantity: number
          recipe_id: string | null
          recipe_title: string | null
          unit_price_mwk: number
        }
        Insert: {
          brand_id?: string
          created_at?: string
          id?: string
          order_id: string
          product_key: string
          product_name: string
          quantity: number
          recipe_id?: string | null
          recipe_title?: string | null
          unit_price_mwk: number
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          order_id?: string
          product_key?: string
          product_name?: string
          quantity?: number
          recipe_id?: string | null
          recipe_title?: string | null
          unit_price_mwk?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "lf_recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      order_preparation: {
        Row: {
          brand_id: string
          created_at: string
          final_price_mwk: number | null
          id: string
          order_item_id: string | null
          packed_weight_kg: number | null
          preparation_type: string
          price_per_kg_mwk: number | null
          reconciled_at: string | null
          reconciled_by: string | null
          requested_weight_kg: number | null
        }
        Insert: {
          brand_id?: string
          created_at?: string
          final_price_mwk?: number | null
          id?: string
          order_item_id?: string | null
          packed_weight_kg?: number | null
          preparation_type: string
          price_per_kg_mwk?: number | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          requested_weight_kg?: number | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          final_price_mwk?: number | null
          id?: string
          order_item_id?: string | null
          packed_weight_kg?: number | null
          preparation_type?: string
          price_per_kg_mwk?: number | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          requested_weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_preparation_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_preparation_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          brand_id: string
          charge_id: string | null
          created_at: string
          customer_email: string | null
          customer_location: string | null
          customer_name: string
          customer_phone: string
          delivered_by: string | null
          delivery_date: string | null
          delivery_fee_mwk: number | null
          delivery_lat: number | null
          delivery_lng: number | null
          delivery_place: string | null
          delivery_proof_url: string | null
          delivery_slot_id: string | null
          delivery_window: string | null
          delivery_zone_id: string | null
          discount_mwk: number | null
          guest_access_token: string | null
          house_number: string | null
          id: string
          inventory_committed_at: string | null
          notes: string | null
          paid_at: string | null
          payment_channel: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string
          promo_code: string | null
          provider_reference: string | null
          status: Database["public"]["Enums"]["order_status"]
          street_name: string | null
          subtotal_mwk: number | null
          total_mwk: number
          updated_at: string
          user_id: string | null
          whatsapp_sent: boolean
        }
        Insert: {
          brand_id?: string
          charge_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_location?: string | null
          customer_name: string
          customer_phone: string
          delivered_by?: string | null
          delivery_date?: string | null
          delivery_fee_mwk?: number | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_place?: string | null
          delivery_proof_url?: string | null
          delivery_slot_id?: string | null
          delivery_window?: string | null
          delivery_zone_id?: string | null
          discount_mwk?: number | null
          guest_access_token?: string | null
          house_number?: string | null
          id?: string
          inventory_committed_at?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_channel?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          promo_code?: string | null
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          street_name?: string | null
          subtotal_mwk?: number | null
          total_mwk: number
          updated_at?: string
          user_id?: string | null
          whatsapp_sent?: boolean
        }
        Update: {
          brand_id?: string
          charge_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_location?: string | null
          customer_name?: string
          customer_phone?: string
          delivered_by?: string | null
          delivery_date?: string | null
          delivery_fee_mwk?: number | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_place?: string | null
          delivery_proof_url?: string | null
          delivery_slot_id?: string | null
          delivery_window?: string | null
          delivery_zone_id?: string | null
          discount_mwk?: number | null
          guest_access_token?: string | null
          house_number?: string | null
          id?: string
          inventory_committed_at?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_channel?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          promo_code?: string | null
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          street_name?: string | null
          subtotal_mwk?: number | null
          total_mwk?: number
          updated_at?: string
          user_id?: string | null
          whatsapp_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_slot_id_fkey"
            columns: ["delivery_slot_id"]
            isOneToOne: false
            referencedRelation: "delivery_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          amount: number | null
          brand_id: string | null
          channel: string | null
          charge_id: string | null
          created_at: string
          currency: string | null
          gift_id: string | null
          id: string
          message: string | null
          order_id: string | null
          outcome: string
          payload: Json
          provider: string
          provider_mode: string | null
          provider_reference: string | null
          provider_status: string | null
          subscription_id: string | null
          tx_ref: string
        }
        Insert: {
          amount?: number | null
          brand_id?: string | null
          channel?: string | null
          charge_id?: string | null
          created_at?: string
          currency?: string | null
          gift_id?: string | null
          id?: string
          message?: string | null
          order_id?: string | null
          outcome?: string
          payload?: Json
          provider?: string
          provider_mode?: string | null
          provider_reference?: string | null
          provider_status?: string | null
          subscription_id?: string | null
          tx_ref: string
        }
        Update: {
          amount?: number | null
          brand_id?: string | null
          channel?: string | null
          charge_id?: string | null
          created_at?: string
          currency?: string | null
          gift_id?: string | null
          id?: string
          message?: string | null
          order_id?: string | null
          outcome?: string
          payload?: Json
          provider?: string
          provider_mode?: string | null
          provider_reference?: string | null
          provider_status?: string | null
          subscription_id?: string | null
          tx_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_events_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "lf_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_links: {
        Row: {
          amount_mwk: number
          brand_id: string
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
          brand_id?: string
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
          brand_id?: string
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
        Relationships: [
          {
            foreignKeyName: "payment_links_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_links_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      price_reconciliation: {
        Row: {
          brand_id: string
          confirmed_by: string | null
          created_at: string
          customer_confirmed_at: string | null
          difference_mwk: number | null
          estimated_total_mwk: number
          final_total_mwk: number | null
          id: string
          order_id: string | null
          status: string
        }
        Insert: {
          brand_id?: string
          confirmed_by?: string | null
          created_at?: string
          customer_confirmed_at?: string | null
          difference_mwk?: number | null
          estimated_total_mwk: number
          final_total_mwk?: number | null
          id?: string
          order_id?: string | null
          status?: string
        }
        Update: {
          brand_id?: string
          confirmed_by?: string | null
          created_at?: string
          customer_confirmed_at?: string | null
          difference_mwk?: number | null
          estimated_total_mwk?: number
          final_total_mwk?: number | null
          id?: string
          order_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_reconciliation_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_reconciliation_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_auth: {
        Row: {
          authentication_status: string
          brand_id: string
          care_instructions: string | null
          category: string | null
          collection: string | null
          color: string | null
          country_of_manufacture: string | null
          created_at: string
          edition_number: number | null
          fabric_weight: string | null
          first_scan_date: string | null
          id: string
          last_scan_date: string | null
          manufacturing_date: string | null
          material: string | null
          order_id: string | null
          order_item_id: string | null
          print_technique: string | null
          product_id: string
          product_image: string | null
          product_name: string
          product_story: string | null
          qr_token: string
          quantity_produced: number | null
          registered_at: string | null
          registered_owner_name: string | null
          registered_owner_phone: string | null
          serial_number: string
          size: string | null
          total_scans: number | null
          updated_at: string
        }
        Insert: {
          authentication_status?: string
          brand_id?: string
          care_instructions?: string | null
          category?: string | null
          collection?: string | null
          color?: string | null
          country_of_manufacture?: string | null
          created_at?: string
          edition_number?: number | null
          fabric_weight?: string | null
          first_scan_date?: string | null
          id?: string
          last_scan_date?: string | null
          manufacturing_date?: string | null
          material?: string | null
          order_id?: string | null
          order_item_id?: string | null
          print_technique?: string | null
          product_id: string
          product_image?: string | null
          product_name: string
          product_story?: string | null
          qr_token: string
          quantity_produced?: number | null
          registered_at?: string | null
          registered_owner_name?: string | null
          registered_owner_phone?: string | null
          serial_number: string
          size?: string | null
          total_scans?: number | null
          updated_at?: string
        }
        Update: {
          authentication_status?: string
          brand_id?: string
          care_instructions?: string | null
          category?: string | null
          collection?: string | null
          color?: string | null
          country_of_manufacture?: string | null
          created_at?: string
          edition_number?: number | null
          fabric_weight?: string | null
          first_scan_date?: string | null
          id?: string
          last_scan_date?: string | null
          manufacturing_date?: string | null
          material?: string | null
          order_id?: string | null
          order_item_id?: string | null
          print_technique?: string | null
          product_id?: string
          product_image?: string | null
          product_name?: string
          product_story?: string | null
          qr_token?: string
          quantity_produced?: number | null
          registered_at?: string | null
          registered_owner_name?: string | null
          registered_owner_phone?: string | null
          serial_number?: string
          size?: string | null
          total_scans?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_auth_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_auth_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ownership: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          is_current_owner: boolean | null
          owner_email: string | null
          owner_name: string
          owner_phone: string | null
          product_auth_id: string
          registered_at: string
        }
        Insert: {
          brand_id?: string
          created_at?: string
          id?: string
          is_current_owner?: boolean | null
          owner_email?: string | null
          owner_name: string
          owner_phone?: string | null
          product_auth_id: string
          registered_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          is_current_owner?: boolean | null
          owner_email?: string | null
          owner_name?: string
          owner_phone?: string | null
          product_auth_id?: string
          registered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ownership_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ownership_product_auth_id_fkey"
            columns: ["product_auth_id"]
            isOneToOne: false
            referencedRelation: "product_auth"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          brand_id: string
          created_at: string
          customer_name: string
          id: string
          is_active: boolean
          product_id: string
          rating: number
          review_text: string
        }
        Insert: {
          brand_id?: string
          created_at?: string
          customer_name?: string
          id?: string
          is_active?: boolean
          product_id: string
          rating: number
          review_text?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          customer_name?: string
          id?: string
          is_active?: boolean
          product_id?: string
          rating?: number
          review_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      product_types: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          name: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          brand_id?: string
          created_at?: string
          id: string
          name: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          name?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_types_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          benefit: string | null
          bestseller: boolean
          brand: string | null
          brand_id: string
          care_instructions: string | null
          category: string
          collection_name: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          culture_context: string | null
          culture_pillar: string | null
          culture_story: string | null
          description: string | null
          discount_percent: number | null
          featured: boolean
          fit: string | null
          gallery_images: Json | null
          gender_classification: string
          id: string
          image: string | null
          images: Json | null
          is_active: boolean | null
          is_best_seller: boolean | null
          is_featured: boolean | null
          is_new_arrival: boolean | null
          is_on_sale: boolean | null
          limited_drop: boolean
          material: string | null
          model_fit_note: string | null
          name: string
          new_arrival: boolean
          price: number
          product_type_code: string | null
          rating: number | null
          release_date: string | null
          reward_points: number | null
          sku: string | null
          slug: string | null
          sort_order: number | null
          specs: Json | null
          status: string
          stock_quantity: number | null
          supplier_id: string | null
          updated_at: string
          wearable_category: string | null
        }
        Insert: {
          barcode?: string | null
          benefit?: string | null
          bestseller?: boolean
          brand?: string | null
          brand_id?: string
          care_instructions?: string | null
          category?: string
          collection_name?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          culture_context?: string | null
          culture_pillar?: string | null
          culture_story?: string | null
          description?: string | null
          discount_percent?: number | null
          featured?: boolean
          fit?: string | null
          gallery_images?: Json | null
          gender_classification?: string
          id?: string
          image?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_best_seller?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          is_on_sale?: boolean | null
          limited_drop?: boolean
          material?: string | null
          model_fit_note?: string | null
          name: string
          new_arrival?: boolean
          price?: number
          product_type_code?: string | null
          rating?: number | null
          release_date?: string | null
          reward_points?: number | null
          sku?: string | null
          slug?: string | null
          sort_order?: number | null
          specs?: Json | null
          status?: string
          stock_quantity?: number | null
          supplier_id?: string | null
          updated_at?: string
          wearable_category?: string | null
        }
        Update: {
          barcode?: string | null
          benefit?: string | null
          bestseller?: boolean
          brand?: string | null
          brand_id?: string
          care_instructions?: string | null
          category?: string
          collection_name?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          culture_context?: string | null
          culture_pillar?: string | null
          culture_story?: string | null
          description?: string | null
          discount_percent?: number | null
          featured?: boolean
          fit?: string | null
          gallery_images?: Json | null
          gender_classification?: string
          id?: string
          image?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_best_seller?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          is_on_sale?: boolean | null
          limited_drop?: boolean
          material?: string | null
          model_fit_note?: string | null
          name?: string
          new_arrival?: boolean
          price?: number
          product_type_code?: string | null
          rating?: number | null
          release_date?: string | null
          reward_points?: number | null
          sku?: string | null
          slug?: string | null
          sort_order?: number | null
          specs?: Json | null
          status?: string
          stock_quantity?: number | null
          supplier_id?: string | null
          updated_at?: string
          wearable_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_brand_type_fkey"
            columns: ["brand_id", "product_type_code"]
            isOneToOne: false
            referencedRelation: "sb_product_types"
            referencedColumns: ["brand_id", "code"]
          },
        ]
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
      promo_codes: {
        Row: {
          brand_id: string
          code: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order: number | null
          name: string
          start_date: string | null
          type: string
          used_count: number | null
          value: number
        }
        Insert: {
          brand_id?: string
          code: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order?: number | null
          name: string
          start_date?: string | null
          type: string
          used_count?: number | null
          value: number
        }
        Update: {
          brand_id?: string
          code?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order?: number | null
          name?: string
          start_date?: string | null
          type?: string
          used_count?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          background_color: string
          brand_id: string
          created_at: string
          description: string | null
          discount_percent: number
          end_date: string | null
          id: string
          image: string
          images: Json | null
          is_active: boolean
          is_featured: boolean | null
          link: string
          link_text: string
          name: string | null
          pages: Json | null
          sort_order: number
          start_date: string
          subtitle: string
          text_color: string
          title: string
          updated_at: string
        }
        Insert: {
          background_color?: string
          brand_id?: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          end_date?: string | null
          id?: string
          image?: string
          images?: Json | null
          is_active?: boolean
          is_featured?: boolean | null
          link?: string
          link_text?: string
          name?: string | null
          pages?: Json | null
          sort_order?: number
          start_date?: string
          subtitle?: string
          text_color?: string
          title?: string
          updated_at?: string
        }
        Update: {
          background_color?: string
          brand_id?: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          end_date?: string | null
          id?: string
          image?: string
          images?: Json | null
          is_active?: boolean
          is_featured?: boolean | null
          link?: string
          link_text?: string
          name?: string | null
          pages?: Json | null
          sort_order?: number
          start_date?: string
          subtitle?: string
          text_color?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          brand_id: string
          created_at: string | null
          id: string
          order_id: string | null
          reward_points: number
          reward_type: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          brand_id?: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          reward_points: number
          reward_type: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          reward_points?: number
          reward_type?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_transactions: {
        Row: {
          brand_id: string
          created_at: string | null
          id: string
          order_id: string | null
          referee_id: string
          referee_reward: number | null
          referral_code: string
          referrer_id: string
          referrer_reward: number | null
          status: string | null
        }
        Insert: {
          brand_id?: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          referee_id: string
          referee_reward?: number | null
          referral_code: string
          referrer_id: string
          referrer_reward?: number | null
          status?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          referee_id?: string
          referee_reward?: number | null
          referral_code?: string
          referrer_id?: string
          referrer_reward?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_transactions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      sb_campaigns: {
        Row: {
          brand_id: string
          created_at: string
          cta_href: string | null
          cta_label: string | null
          description: string | null
          ends_at: string | null
          headline: string | null
          hero_image: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          brand_id?: string
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          ends_at?: string | null
          headline?: string | null
          hero_image?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          ends_at?: string | null
          headline?: string | null
          hero_image?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sb_campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      sb_collection_products: {
        Row: {
          brand_id: string
          collection_id: string
          created_at: string
          id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          brand_id?: string
          collection_id: string
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
        }
        Update: {
          brand_id?: string
          collection_id?: string
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "sb_collection_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sb_collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "sb_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sb_collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sb_collections: {
        Row: {
          brand_id: string
          created_at: string
          description: string | null
          hero_image: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          kind: string
          limited_drop: boolean
          name: string
          release_date: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          brand_id?: string
          created_at?: string
          description?: string | null
          hero_image?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          kind?: string
          limited_drop?: boolean
          name: string
          release_date?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          description?: string | null
          hero_image?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          kind?: string
          limited_drop?: boolean
          name?: string
          release_date?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sb_collections_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      sb_complete_look_rules: {
        Row: {
          brand_id: string
          id: string
          is_active: boolean
          sort_order: number
          source_type_code: string
          suggested_type_code: string
        }
        Insert: {
          brand_id?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          source_type_code: string
          suggested_type_code: string
        }
        Update: {
          brand_id?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          source_type_code?: string
          suggested_type_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "sb_complete_look_rules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sb_complete_look_rules_brand_id_source_type_code_fkey"
            columns: ["brand_id", "source_type_code"]
            isOneToOne: false
            referencedRelation: "sb_product_types"
            referencedColumns: ["brand_id", "code"]
          },
          {
            foreignKeyName: "sb_complete_look_rules_brand_id_suggested_type_code_fkey"
            columns: ["brand_id", "suggested_type_code"]
            isOneToOne: false
            referencedRelation: "sb_product_types"
            referencedColumns: ["brand_id", "code"]
          },
        ]
      }
      sb_editorial_placements: {
        Row: {
          body: string | null
          brand_id: string
          campaign_id: string | null
          collection_id: string | null
          created_at: string
          cta_href: string | null
          cta_label: string | null
          ends_at: string | null
          headline: string | null
          id: string
          image_override: string | null
          is_active: boolean
          look_id: string | null
          product_id: string | null
          section_key: string
          sort_order: number
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          brand_id?: string
          campaign_id?: string | null
          collection_id?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          ends_at?: string | null
          headline?: string | null
          id?: string
          image_override?: string | null
          is_active?: boolean
          look_id?: string | null
          product_id?: string | null
          section_key: string
          sort_order?: number
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          brand_id?: string
          campaign_id?: string | null
          collection_id?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          ends_at?: string | null
          headline?: string | null
          id?: string
          image_override?: string | null
          is_active?: boolean
          look_id?: string | null
          product_id?: string | null
          section_key?: string
          sort_order?: number
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sb_editorial_placements_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sb_editorial_placements_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sb_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sb_editorial_placements_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "sb_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sb_editorial_placements_look_id_fkey"
            columns: ["look_id"]
            isOneToOne: false
            referencedRelation: "sb_looks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sb_editorial_placements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sb_look_items: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          is_purchasable: boolean
          look_id: string
          product_id: string
          role: string | null
          sort_order: number
          styling_note: string | null
          variant_id: string | null
        }
        Insert: {
          brand_id?: string
          created_at?: string
          id?: string
          is_purchasable?: boolean
          look_id: string
          product_id: string
          role?: string | null
          sort_order?: number
          styling_note?: string | null
          variant_id?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          is_purchasable?: boolean
          look_id?: string
          product_id?: string
          role?: string | null
          sort_order?: number
          styling_note?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sb_look_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sb_look_items_look_id_fkey"
            columns: ["look_id"]
            isOneToOne: false
            referencedRelation: "sb_looks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sb_look_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sb_look_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "sb_product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      sb_looks: {
        Row: {
          brand_id: string
          created_at: string
          description: string | null
          hero_image: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          slug: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          brand_id?: string
          created_at?: string
          description?: string | null
          hero_image?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          slug: string
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          description?: string | null
          hero_image?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          slug?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sb_looks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      sb_product_relations: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          product_id: string
          related_product_id: string
          relation_type: string
          sort_order: number
        }
        Insert: {
          brand_id?: string
          created_at?: string
          id?: string
          product_id: string
          related_product_id: string
          relation_type?: string
          sort_order?: number
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          product_id?: string
          related_product_id?: string
          relation_type?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "sb_product_relations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sb_product_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sb_product_relations_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sb_product_tags: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          product_id: string
          sort_order: number
          tag: string
        }
        Insert: {
          brand_id?: string
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          tag: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "sb_product_tags_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sb_product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sb_product_types: {
        Row: {
          brand_id: string
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          brand_id?: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          brand_id?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sb_product_types_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      sb_product_variants: {
        Row: {
          availability: string
          brand_id: string
          color: string
          compare_at_price_mwk: number | null
          cost_price_mwk: number | null
          created_at: string
          id: string
          is_active: boolean
          price_mwk: number
          product_id: string
          reserved_qty: number
          size_label: string
          sku: string
          stock_qty: number
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          availability?: string
          brand_id?: string
          color?: string
          compare_at_price_mwk?: number | null
          cost_price_mwk?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          price_mwk: number
          product_id: string
          reserved_qty?: number
          size_label: string
          sku: string
          stock_qty?: number
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          availability?: string
          brand_id?: string
          color?: string
          compare_at_price_mwk?: number | null
          cost_price_mwk?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          price_mwk?: number
          product_id?: string
          reserved_qty?: number
          size_label?: string
          sku?: string
          stock_qty?: number
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sb_product_variants_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sb_product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_logs: {
        Row: {
          approximate_location: string | null
          browser: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_hash: string | null
          is_suspicious: boolean | null
          os: string | null
          product_auth_id: string
          qr_token: string
          scan_result: string
          scanned_at: string
          suspicious_reason: string | null
        }
        Insert: {
          approximate_location?: string | null
          browser?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          is_suspicious?: boolean | null
          os?: string | null
          product_auth_id: string
          qr_token: string
          scan_result: string
          scanned_at?: string
          suspicious_reason?: string | null
        }
        Update: {
          approximate_location?: string | null
          browser?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          is_suspicious?: boolean | null
          os?: string | null
          product_auth_id?: string
          qr_token?: string
          scan_result?: string
          scanned_at?: string
          suspicious_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_logs_product_auth_id_fkey"
            columns: ["product_auth_id"]
            isOneToOne: false
            referencedRelation: "product_auth"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          brand_id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          brand_id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          brand_id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_permissions: {
        Row: {
          brand_id: string | null
          created_at: string
          id: string
          permissions: Json
          role: string
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          id?: string
          permissions?: Json
          role: string
          user_id: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          id?: string
          permissions?: Json
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_permissions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          brand_id: string
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
          brand_id?: string
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
          brand_id?: string
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
        Relationships: [
          {
            foreignKeyName: "suppliers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          brand_id: string
          created_at: string
          customer_name: string
          id: string
          is_active: boolean
          message: string
          rating: number
        }
        Insert: {
          brand_id?: string
          created_at?: string
          customer_name: string
          id?: string
          is_active?: boolean
          message: string
          rating?: number
        }
        Update: {
          brand_id?: string
          created_at?: string
          customer_name?: string
          id?: string
          is_active?: boolean
          message?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      user_referral_codes: {
        Row: {
          brand_id: string
          code: string
          created_at: string | null
          id: string
          max_referrals: number | null
          rewards_points: number | null
          rewards_redeemed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand_id?: string
          code: string
          created_at?: string | null
          id?: string
          max_referrals?: number | null
          rewards_points?: number | null
          rewards_redeemed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand_id?: string
          code?: string
          created_at?: string | null
          id?: string
          max_referrals?: number | null
          rewards_points?: number | null
          rewards_redeemed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_referral_codes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
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
          brand_id: string
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
          brand_id?: string
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
          brand_id?: string
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
        Relationships: [
          {
            foreignKeyName: "wearable_categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_campaigns: {
        Row: {
          brand_id: string
          created_at: string | null
          id: string
          message: string
          name: string
          sent_count: number | null
        }
        Insert: {
          brand_id?: string
          created_at?: string | null
          id?: string
          message: string
          name: string
          sent_count?: number | null
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          id?: string
          message?: string
          name?: string
          sent_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_credit_loyalty_points: {
        Args: {
          p_brand_id: string
          p_description?: string
          p_points: number
          p_user_id: string
        }
        Returns: Json
      }
      apply_referral_code: { Args: { p_code: string }; Returns: Json }
      award_loyalty_for_order: { Args: { p_order_id: string }; Returns: Json }
      complete_referral: {
        Args: { p_order_id?: string; p_referee_id: string }
        Returns: Json
      }
      confirm_fish_reservation: {
        Args: { p_reservation_id: string }
        Returns: undefined
      }
      credit_loyalty_points: {
        Args: {
          p_brand_id: string
          p_description: string
          p_order_id?: string
          p_points: number
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      generate_gift_tracking_token: { Args: never; Returns: string }
      generate_order_item_qr: { Args: { p_order_id: string }; Returns: number }
      generate_qr_token: { Args: never; Returns: string }
      generate_serial_number: { Args: never; Returns: string }
      generate_slug: { Args: { input_text: string }; Returns: string }
      has_brand_access: { Args: { _brand_id: string }; Returns: boolean }
      has_brand_permission: {
        Args: { p_brand_id: string; p_permission: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lf_admin_remove_staff_permission: {
        Args: { p_brand_id: string; p_role: string; p_user_id: string }
        Returns: Json
      }
      lf_admin_save_preparation: {
        Args: { p_packed_weight_kg: number; p_preparation_id: string }
        Returns: Json
      }
      lf_admin_set_staff_permission: {
        Args: {
          p_brand_id: string
          p_permissions?: Json
          p_role: string
          p_user_id: string
        }
        Returns: Json
      }
      lf_claim_lifecycle_messages: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          kind: string
          link: string
          order_id: string
          to_email: string
          to_name: string
        }[]
      }
      lf_confirm_subscription_charge: {
        Args: { p_charge_id: string; p_gateway_reference?: string }
        Returns: Json
      }
      lf_customer_confirm_reconciliation: {
        Args: { p_access_token?: string; p_order_id: string }
        Returns: Json
      }
      lf_customer_open_ticket: {
        Args: {
          p_access_token?: string
          p_body?: string
          p_category?: string
          p_customer_email?: string
          p_order_id?: string
          p_priority?: string
          p_subject?: string
        }
        Returns: Json
      }
      lf_customer_reply_ticket: {
        Args: { p_access_token: string; p_body: string; p_ticket_id: string }
        Returns: Json
      }
      lf_finish_lifecycle_message: {
        Args: { p_error?: string; p_id: string; p_sent: boolean }
        Returns: Json
      }
      lf_generate_delivery_slots: {
        Args: {
          p_capacity_orders?: number
          p_capacity_weight_kg?: number
          p_days?: number
        }
        Returns: number
      }
      lf_mark_delivery_result: {
        Args: { p_note?: string; p_order_id: string; p_proof_url: string }
        Returns: Json
      }
      lf_mark_support_sla_breaches: { Args: never; Returns: Json }
      lf_moderate_review: {
        Args: {
          p_moderation_note?: string
          p_review_id: string
          p_status: string
        }
        Returns: Json
      }
      lf_permissions_for_role: { Args: { p_role: string }; Returns: string[] }
      lf_place_order: {
        Args: {
          p_customer_email?: string
          p_customer_name: string
          p_customer_phone: string
          p_delivery_lat?: number
          p_delivery_lng?: number
          p_delivery_place?: string
          p_house_number?: string
          p_items: Json
          p_marketing_consent?: boolean
          p_notes?: string
          p_promo_code?: string
          p_redeem_points?: number
          p_slot_id: string
          p_street_name?: string
          p_zone_id: string
        }
        Returns: string
      }
      lf_place_order_guest: {
        Args: {
          p_customer_email?: string
          p_customer_name: string
          p_customer_phone: string
          p_delivery_lat?: number
          p_delivery_lng?: number
          p_delivery_place?: string
          p_house_number?: string
          p_items: Json
          p_marketing_consent?: boolean
          p_notes?: string
          p_promo_code?: string
          p_redeem_points?: number
          p_slot_id: string
          p_street_name?: string
          p_zone_id: string
        }
        Returns: Json
      }
      lf_prepare_subscription_charges: { Args: never; Returns: Json }
      lf_preview_promo: { Args: { p_code: string }; Returns: Json }
      lf_public_catalog: {
        Args: never
        Returns: {
          availability_status: string
          available_kg: number
          description: string
          handling_info: string
          id: string
          image: string
          images: Json
          min_order_qty_kg: number
          name: string
          pilot_option: string
          preparation_options: Json
          price_per_kg_mwk: number
          sort_order: number
          species_id: string
          species_name: string
          species_slug: string
          storage_info: string
        }[]
      }
      lf_public_config: { Args: never; Returns: Json }
      lf_public_order_detail: {
        Args: { p_access_token?: string; p_order_id: string }
        Returns: Json
      }
      lf_public_order_proof: {
        Args: { p_access_token?: string; p_order_id: string }
        Returns: Json
      }
      lf_public_subscription_status: {
        Args: { p_subscription_id: string; p_tx_ref: string }
        Returns: string
      }
      lf_public_support_ticket: {
        Args: { p_access_token?: string; p_ticket_id: string }
        Returns: Json
      }
      lf_record_growth_event: {
        Args: {
          p_event_type: string
          p_path?: string
          p_ref_code?: string
          p_session_key: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
        }
        Returns: Json
      }
      lf_set_order_status: {
        Args: {
          p_gateway_reference?: string
          p_gateway_response?: Json
          p_order_id: string
          p_reason?: string
          p_status: Database["public"]["Enums"]["order_status"]
        }
        Returns: Json
      }
      lf_set_ticket_status: {
        Args: { p_status: string; p_ticket_id: string }
        Returns: Json
      }
      lf_staff_reply_ticket: {
        Args: { p_body: string; p_ticket_id: string }
        Returns: Json
      }
      lf_submit_review: {
        Args: {
          p_access_token?: string
          p_body: string
          p_order_id: string
          p_product_id?: string
          p_product_type?: string
          p_rating: number
          p_title?: string
        }
        Returns: Json
      }
      lf_track_order: {
        Args: { p_phone: string; p_reference?: string }
        Returns: Json
      }
      lf_verify_order_access: {
        Args: { p_access_token: string; p_order_id: string }
        Returns: Json
      }
      mark_order_paid: { Args: { p_order_id: string }; Returns: Json }
      process_order_paid: {
        Args: {
          p_channel?: string
          p_charge_id?: string
          p_order_id: string
          p_provider_reference?: string
        }
        Returns: Json
      }
      process_payment_event: {
        Args: {
          p_amount?: number
          p_channel?: string
          p_charge_id?: string
          p_currency?: string
          p_mode?: string
          p_payload?: Json
          p_provider_reference?: string
          p_status: string
          p_tx_ref: string
        }
        Returns: Json
      }
      record_scan: {
        Args: {
          p_approximate_location?: string
          p_browser?: string
          p_device_type?: string
          p_ip_hash?: string
          p_os?: string
          p_product_auth_id: string
          p_qr_token: string
          p_scan_result: string
        }
        Returns: string
      }
      redeem_loyalty_points: {
        Args: { p_brand_id: string; p_order_total: number; p_points: number }
        Returns: Json
      }
      release_fish_reservation: {
        Args: { p_reservation_id: string }
        Returns: undefined
      }
      reserve_fish_stock: {
        Args: { p_batch_id: string; p_order_id: string; p_weight_kg: number }
        Returns: string
      }
      sb_adjust_variant_stock: {
        Args: { p_delta: number; p_reserve?: boolean; p_variant_id: string }
        Returns: Json
      }
      sb_placement_is_live: {
        Args: { p_ends_at: string; p_starts_at: string }
        Returns: boolean
      }
      sb_set_variant_stock: {
        Args: {
          p_reserved_qty?: number
          p_stock_qty: number
          p_variant_id: string
        }
        Returns: Json
      }
      update_gift_status: {
        Args: { p_gift_id: string; p_new_status: string; p_note?: string }
        Returns: undefined
      }
      user_has_brand_permission: {
        Args: { p_brand_id: string; p_permission: string; p_user_id: string }
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
        | "refunded"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
        "refunded",
      ],
    },
  },
} as const
