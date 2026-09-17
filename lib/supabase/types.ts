/**
 * Hand-written Database types matching supabase/migrations/*.sql.
 *
 * TODO once a real Supabase project is connected: replace this file by
 * running `npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts`
 * so it's generated from the live schema instead of hand-maintained. Keeping
 * it hand-written for now means it can drift from the SQL — the SQL files
 * are the source of truth.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type LocalizedText = { en?: string; ar?: string; ku?: string };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          locale: "en" | "ar" | "ku";
          internal_role: "super_admin" | "support" | "content_editor" | "sales" | null;
          created_at: string;
          last_login_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          name: LocalizedText;
          tagline: LocalizedText;
          price_iqd: number | null;
          billing_cycle: string;
          features: Json;
          max_locations: number;
          max_staff: number;
          sort_order: number;
          active: boolean;
          setup_price_iqd: number | null;
          popular: boolean;
          cta: LocalizedText;
        };
        Insert: Partial<Database["public"]["Tables"]["plans"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["plans"]["Row"]>;
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          username: string;
          name: LocalizedText;
          category: LocalizedText;
          description: LocalizedText;
          logo_url: string | null;
          cover_image_url: string | null;
          status: "draft" | "published" | "suspended";
          ordering_mode: "menu_only" | "whatsapp" | "online" | "table";
          reservation_enabled: boolean;
          reservation_url: string | null;
          offer: LocalizedText | null;
          menu_link_enabled: boolean;
          likes_enabled: boolean;
          whatsapp_number: string | null;
          phone: string | null;
          instagram_url: string | null;
          website_url: string | null;
          google_maps_url: string | null;
          google_review_url: string | null;
          plan_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["businesses"]["Row"]> & { username: string };
        Update: Partial<Database["public"]["Tables"]["businesses"]["Row"]>;
        Relationships: [];
      };
      business_members: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: "owner" | "staff";
          permissions: string[];
          invited_email: string | null;
          invited_at: string;
          accepted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["business_members"]["Row"]> & {
          business_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["business_members"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      locations: {
        Row: {
          id: string;
          business_id: string;
          name: LocalizedText;
          address: LocalizedText;
          hours: Json;
          maps_url: string | null;
          is_primary: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["locations"]["Row"]> & { business_id: string };
        Update: Partial<Database["public"]["Tables"]["locations"]["Row"]>;
        Relationships: [];
      };
      profile_links: {
        Row: {
          id: string;
          business_id: string;
          type: string;
          icon: string;
          label: LocalizedText;
          url: string;
          enabled: boolean;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["profile_links"]["Row"]> & {
          business_id: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["profile_links"]["Row"]>;
        Relationships: [];
      };
      menu_categories: {
        Row: {
          id: string;
          business_id: string;
          name: LocalizedText;
          icon: string;
          visible: boolean;
          scheduled_start: string | null;
          scheduled_end: string | null;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["menu_categories"]["Row"]> & { business_id: string };
        Update: Partial<Database["public"]["Tables"]["menu_categories"]["Row"]>;
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          business_id: string;
          category_id: string;
          name: LocalizedText;
          description: LocalizedText;
          price: number;
          discount_price: number | null;
          currency: string;
          image_url: string | null;
          gallery: string[];
          tags: string[];
          allergens: Json;
          available: boolean;
          visible: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["menu_items"]["Row"]> & {
          business_id: string;
          category_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Row"]>;
        Relationships: [];
      };
      product_options: {
        Row: {
          id: string;
          menu_item_id: string;
          type: "single" | "multi";
          name: LocalizedText;
          choices: Json;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["product_options"]["Row"]> & { menu_item_id: string };
        Update: Partial<Database["public"]["Tables"]["product_options"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "product_options_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_item_likes: {
        Row: {
          id: string;
          menu_item_id: string;
          business_id: string;
          liker_hash: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["menu_item_likes"]["Row"]> & {
          menu_item_id: string;
          business_id: string;
          liker_hash: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_item_likes"]["Row"]>;
        Relationships: [];
      };
      menu_labels: {
        Row: {
          id: string;
          key: string;
          name: LocalizedText;
          sort_order: number;
          active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["menu_labels"]["Row"]> & { key: string };
        Update: Partial<Database["public"]["Tables"]["menu_labels"]["Row"]>;
        Relationships: [];
      };
      menu_item_label_links: {
        Row: {
          id: string;
          menu_item_id: string;
          label_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["menu_item_label_links"]["Row"]> & {
          menu_item_id: string;
          label_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_item_label_links"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "menu_item_label_links_label_id_fkey";
            columns: ["label_id"];
            isOneToOne: false;
            referencedRelation: "menu_labels";
            referencedColumns: ["id"];
          },
        ];
      };
      review_pages: {
        Row: {
          id: string;
          business_id: string;
          enabled: boolean;
          title: LocalizedText;
          intro: LocalizedText;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["review_pages"]["Row"]> & { business_id: string };
        Update: Partial<Database["public"]["Tables"]["review_pages"]["Row"]>;
        Relationships: [];
      };
      review_questions: {
        Row: {
          id: string;
          review_page_id: string;
          prompt: LocalizedText;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["review_questions"]["Row"]> & { review_page_id: string };
        Update: Partial<Database["public"]["Tables"]["review_questions"]["Row"]>;
        Relationships: [];
      };
      review_submissions: {
        Row: {
          id: string;
          business_id: string;
          review_page_id: string;
          ratings: Json;
          average_rating: number;
          comment: string | null;
          status: "published" | "hidden";
          submitter_hash: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["review_submissions"]["Row"]> & {
          business_id: string;
          review_page_id: string;
          ratings: Json;
          average_rating: number;
          submitter_hash: string;
        };
        Update: Partial<Database["public"]["Tables"]["review_submissions"]["Row"]>;
        Relationships: [];
      };
      nfc_devices: {
        Row: {
          id: string;
          business_id: string | null;
          location_id: string | null;
          serial: string;
          type: string;
          status: "unassigned" | "active" | "inactive";
          activated_at: string | null;
          created_at: string;
          table_number: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["nfc_devices"]["Row"]> & { serial: string; type: string };
        Update: Partial<Database["public"]["Tables"]["nfc_devices"]["Row"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          business_id: string;
          location_id: string | null;
          items: Json;
          total: number;
          status: "new" | "preparing" | "completed" | "cancelled";
          type: "whatsapp" | "table" | "online";
          customer_name: string | null;
          table_number: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & { business_id: string };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          business_id: string;
          type: string;
          metadata: Json;
          session_locale: "en" | "ar" | "ku" | null;
          device_type: string | null;
          location_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["analytics_events"]["Row"]> & {
          business_id: string;
          type: string;
        };
        Update: Partial<Database["public"]["Tables"]["analytics_events"]["Row"]>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          business_name: string | null;
          message: string | null;
          source: string;
          status: "new" | "contacted" | "qualified" | "closed";
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
        Relationships: [];
      };
      catalogue_products: {
        Row: {
          id: string;
          sku: string;
          category: string;
          name: LocalizedText;
          description: LocalizedText;
          features: Json;
          specifications: Json;
          price_iqd: number | null;
          discount_price_iqd: number | null;
          currency: string;
          request_quote: boolean;
          images: string[];
          colors: string[];
          status: "draft" | "published" | "hidden" | "out_of_stock";
          sort_order: number;
          featured: boolean;
          seo_title: LocalizedText;
          seo_description: LocalizedText;
          cta_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["catalogue_products"]["Row"]> & { sku: string };
        Update: Partial<Database["public"]["Tables"]["catalogue_products"]["Row"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          business_id: string;
          plan_id: string;
          status: string;
          billing_cycle: string;
          renews_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]> & {
          business_id: string;
          plan_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
        Relationships: [];
      };
      feature_flags: {
        Row: {
          id: string;
          key: string;
          label: string;
          description: string;
          scope: "global" | "plan" | "business";
          default_value: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["feature_flags"]["Row"]> & { key: string; label: string };
        Update: Partial<Database["public"]["Tables"]["feature_flags"]["Row"]>;
        Relationships: [];
      };
      feature_flag_overrides: {
        Row: {
          id: string;
          flag_id: string;
          scope_type: string;
          scope_id: string;
          value: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["feature_flag_overrides"]["Row"]> & {
          flag_id: string;
          scope_type: string;
          scope_id: string;
          value: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["feature_flag_overrides"]["Row"]>;
        Relationships: [];
      };
      feature_flag_audit_log: {
        Row: {
          id: string;
          flag_id: string | null;
          actor_id: string | null;
          action: string;
          previous_value: Json;
          new_value: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["feature_flag_audit_log"]["Row"]> & { action: string };
        Update: Partial<Database["public"]["Tables"]["feature_flag_audit_log"]["Row"]>;
        Relationships: [];
      };
      site_content: {
        Row: {
          id: string;
          key: string;
          type: string;
          content: Json;
          visible: boolean;
          scheduled_start: string | null;
          scheduled_end: string | null;
          sort_order: number;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["site_content"]["Row"]> & { key: string; type: string };
        Update: Partial<Database["public"]["Tables"]["site_content"]["Row"]>;
        Relationships: [];
      };
      nav_menu_items: {
        Row: {
          id: string;
          parent_id: string | null;
          label: LocalizedText;
          url: string;
          icon: string | null;
          image_url: string | null;
          open_new_tab: boolean;
          placement: "desktop" | "mobile" | "both";
          access_rule: string;
          visible: boolean;
          sort_order: number;
          location: "header" | "footer";
          footer_group: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["nav_menu_items"]["Row"]> & { url: string };
        Update: Partial<Database["public"]["Tables"]["nav_menu_items"]["Row"]>;
        Relationships: [];
      };
      translation_overrides: {
        Row: {
          id: string;
          namespace: string;
          key: string;
          locale: "en" | "ar" | "ku";
          value: string;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["translation_overrides"]["Row"]> & {
          namespace: string;
          key: string;
          locale: "en" | "ar" | "ku";
          value: string;
        };
        Update: Partial<Database["public"]["Tables"]["translation_overrides"]["Row"]>;
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          business_id: string | null;
          requester_name: string;
          requester_email: string;
          subject: string;
          message: string;
          status: "open" | "pending" | "resolved" | "closed";
          priority: "low" | "normal" | "high" | "urgent";
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]> & {
          requester_name: string;
          requester_email: string;
          subject: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          business_id: string | null;
          entity_type: string;
          entity_id: string | null;
          action: string;
          before: Json;
          after: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_log"]["Row"]> & { entity_type: string; action: string };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      resolve_device: {
        Args: { p_serial: string };
        Returns: {
          username: string;
          status: "unassigned" | "active" | "inactive";
          table_number: string | null;
          business_id: string;
          device_type: Database["public"]["Tables"]["nfc_devices"]["Row"]["type"];
          location_id: string | null;
        }[];
      };
      get_menu_item_likes: {
        Args: { p_business_id: string; p_liker_hash?: string | null };
        Returns: { menu_item_id: string; like_count: number; liked_by_caller: boolean }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
