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
      arco_requests: {
        Row: {
          created_at: string
          deadline_at: string
          id: string
          justification: string
          request_type: Database["public"]["Enums"]["arco_request_type"]
          requester_dni: string
          requester_email: string
          requester_name: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["arco_status"]
          supporting_document_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          deadline_at?: string
          id?: string
          justification: string
          request_type: Database["public"]["Enums"]["arco_request_type"]
          requester_dni: string
          requester_email: string
          requester_name: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["arco_status"]
          supporting_document_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          deadline_at?: string
          id?: string
          justification?: string
          request_type?: Database["public"]["Enums"]["arco_request_type"]
          requester_dni?: string
          requester_email?: string
          requester_name?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["arco_status"]
          supporting_document_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arco_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arco_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: number
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_documents: {
        Row: {
          case_id: string
          created_at: string
          file_name: string
          file_size_bytes: number
          id: string
          mime_type: string
          storage_path: string
          uploaded_by: string
          visibility: Database["public"]["Enums"]["document_visibility"]
        }
        Insert: {
          case_id: string
          created_at?: string
          file_name: string
          file_size_bytes: number
          id?: string
          mime_type: string
          storage_path: string
          uploaded_by: string
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Update: {
          case_id?: string
          created_at?: string
          file_name?: string
          file_size_bytes?: number
          id?: string
          mime_type?: string
          storage_path?: string
          uploaded_by?: string
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "case_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          ai_classification: Json | null
          city: string
          created_at: string
          deleted_at: string | null
          description: string
          embedding: string | null
          id: string
          is_confidential: boolean
          location: unknown
          modality: Database["public"]["Enums"]["modality_type"]
          search_vector: unknown
          specialty_id: number
          status: Database["public"]["Enums"]["case_status"]
          subspecialty_id: number | null
          title: string
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"]
          user_id: string
        }
        Insert: {
          ai_classification?: Json | null
          city: string
          created_at?: string
          deleted_at?: string | null
          description: string
          embedding?: string | null
          id?: string
          is_confidential?: boolean
          location?: unknown
          modality?: Database["public"]["Enums"]["modality_type"]
          search_vector?: unknown
          specialty_id: number
          status?: Database["public"]["Enums"]["case_status"]
          subspecialty_id?: number | null
          title: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          user_id: string
        }
        Update: {
          ai_classification?: Json | null
          city?: string
          created_at?: string
          deleted_at?: string | null
          description?: string
          embedding?: string | null
          id?: string
          is_confidential?: boolean
          location?: unknown
          modality?: Database["public"]["Enums"]["modality_type"]
          search_vector?: unknown
          specialty_id?: number
          status?: Database["public"]["Enums"]["case_status"]
          subspecialty_id?: number | null
          title?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_subspecialty_id_fkey"
            columns: ["subspecialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          agreed_price: number
          case_id: string
          client_id: string
          created_at: string
          duration_minutes: number
          id: string
          lawyer_id: string
          meeting_link: string | null
          modality: Database["public"]["Enums"]["modality_type"]
          notes: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["consultation_status"]
          updated_at: string
        }
        Insert: {
          agreed_price?: number
          case_id: string
          client_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          lawyer_id: string
          meeting_link?: string | null
          modality?: Database["public"]["Enums"]["modality_type"]
          notes?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["consultation_status"]
          updated_at?: string
        }
        Update: {
          agreed_price?: number
          case_id?: string
          client_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          lawyer_id?: string
          meeting_link?: string | null
          modality?: Database["public"]["Enums"]["modality_type"]
          notes?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["consultation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          case_id: string
          created_at: string
          id: string
          is_active: boolean
          last_message_at: string | null
          match_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          match_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          match_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_profiles: {
        Row: {
          address_office: string | null
          bar_association: string
          bar_number: string
          bio: string | null
          consultation_price: number | null
          created_at: string
          currency: string
          id: string
          is_available: boolean
          office_location: unknown
          physical_attention: boolean
          professional_title: string
          rating_average: number
          total_reviews: number
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          virtual_attention: boolean
          years_experience: number
        }
        Insert: {
          address_office?: string | null
          bar_association: string
          bar_number: string
          bio?: string | null
          consultation_price?: number | null
          created_at?: string
          currency?: string
          id?: string
          is_available?: boolean
          office_location?: unknown
          physical_attention?: boolean
          professional_title?: string
          rating_average?: number
          total_reviews?: number
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          virtual_attention?: boolean
          years_experience?: number
        }
        Update: {
          address_office?: string | null
          bar_association?: string
          bar_number?: string
          bio?: string | null
          consultation_price?: number | null
          created_at?: string
          currency?: string
          id?: string
          is_available?: boolean
          office_location?: unknown
          physical_attention?: boolean
          professional_title?: string
          rating_average?: number
          total_reviews?: number
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          virtual_attention?: boolean
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_schedules: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          lawyer_id: string
          slot_duration_minutes: number
          start_time: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          lawyer_id: string
          slot_duration_minutes?: number
          start_time: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          lawyer_id?: string
          slot_duration_minutes?: number
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_schedules_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_specialties: {
        Row: {
          created_at: string
          experience_years: number
          id: string
          is_primary: boolean
          lawyer_id: string
          specialty_id: number
        }
        Insert: {
          created_at?: string
          experience_years?: number
          id?: string
          is_primary?: boolean
          lawyer_id: string
          specialty_id: number
        }
        Update: {
          created_at?: string
          experience_years?: number
          id?: string
          is_primary?: boolean
          lawyer_id?: string
          specialty_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_specialties_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          card_brand: string | null
          card_last_four: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          external_provider: string | null
          external_subscription_id: string | null
          gateway_customer_id: string | null
          id: string
          lawyer_id: string
          matches_used_this_period: number
          plan_id: string
          status: string
          trial_ended_at: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string
          current_period_end: string
          current_period_start?: string
          external_provider?: string | null
          external_subscription_id?: string | null
          gateway_customer_id?: string | null
          id?: string
          lawyer_id: string
          matches_used_this_period?: number
          plan_id: string
          status?: string
          trial_ended_at?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          external_provider?: string | null
          external_subscription_id?: string | null
          gateway_customer_id?: string | null
          id?: string
          lawyer_id?: string
          matches_used_this_period?: number
          plan_id?: string
          status?: string
          trial_ended_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_subscriptions_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: true
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          breakdown: Json
          case_id: string
          created_at: string
          id: string
          lawyer_id: string
          lawyer_interacted_at: string | null
          lawyer_interest: boolean
          matched_at: string | null
          score: number
          status: Database["public"]["Enums"]["match_status"]
          user_interacted_at: string | null
          user_interest: boolean
        }
        Insert: {
          breakdown?: Json
          case_id: string
          created_at?: string
          id?: string
          lawyer_id: string
          lawyer_interacted_at?: string | null
          lawyer_interest?: boolean
          matched_at?: string | null
          score: number
          status?: Database["public"]["Enums"]["match_status"]
          user_interacted_at?: string | null
          user_interest?: boolean
        }
        Update: {
          breakdown?: Json
          case_id?: string
          created_at?: string
          id?: string
          lawyer_id?: string
          lawyer_interacted_at?: string | null
          lawyer_interest?: boolean
          matched_at?: string | null
          score?: number
          status?: Database["public"]["Enums"]["match_status"]
          user_interacted_at?: string | null
          user_interest?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "matches_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          conversation_id: string
          created_at: string
          id: string
          message: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string
          consent_accepted_at: string | null
          consent_policy_version: string | null
          country: string
          created_at: string
          document_number: string | null
          document_type: string | null
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          last_seen_at: string | null
          location: unknown
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city: string
          consent_accepted_at?: string | null
          consent_policy_version?: string | null
          country?: string
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          first_name: string
          id: string
          is_active?: boolean
          last_name: string
          last_seen_at?: string | null
          location?: unknown
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string
          consent_accepted_at?: string | null
          consent_policy_version?: string | null
          country?: string
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          last_seen_at?: string | null
          location?: unknown
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_entity_id: string
          reported_entity_type: string
          reporter_id: string
          resolved_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_entity_id: string
          reported_entity_type: string
          reporter_id: string
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_entity_id?: string
          reported_entity_type?: string
          reporter_id?: string
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          attention_score: number
          case_id: string
          clarity_score: number
          client_id: string
          comment: string | null
          communication_score: number
          consultation_id: string
          created_at: string
          id: string
          is_published: boolean
          lawyer_id: string
          punctuality_score: number
        }
        Insert: {
          attention_score: number
          case_id: string
          clarity_score: number
          client_id: string
          comment?: string | null
          communication_score: number
          consultation_id: string
          created_at?: string
          id?: string
          is_published?: boolean
          lawyer_id: string
          punctuality_score: number
        }
        Update: {
          attention_score?: number
          case_id?: string
          clarity_score?: number
          client_id?: string
          comment?: string | null
          communication_score?: number
          consultation_id?: string
          created_at?: string
          id?: string
          is_published?: boolean
          lawyer_id?: string
          punctuality_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: true
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          description: string | null
          display_order: number
          id: number
          is_active: boolean
          name: string
          parent_id: number | null
          slug: string
        }
        Insert: {
          description?: string | null
          display_order?: number
          id?: number
          is_active?: boolean
          name: string
          parent_id?: number | null
          slug: string
        }
        Update: {
          description?: string | null
          display_order?: number
          id?: number
          is_active?: boolean
          name?: string
          parent_id?: number | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialties_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_invoices: {
        Row: {
          amount_pen: number
          created_at: string
          external_payment_id: string | null
          id: string
          invoice_number: string | null
          invoice_pdf_url: string | null
          invoice_type: string | null
          lawyer_id: string
          paid_at: string | null
          payment_method: string
          rejection_reason: string | null
          status: string
          subscription_id: string
          target_plan_id: string | null
          tax_id_number: string | null
          tax_legal_name: string | null
          voucher_url: string | null
        }
        Insert: {
          amount_pen: number
          created_at?: string
          external_payment_id?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          invoice_type?: string | null
          lawyer_id: string
          paid_at?: string | null
          payment_method: string
          rejection_reason?: string | null
          status: string
          subscription_id: string
          target_plan_id?: string | null
          tax_id_number?: string | null
          tax_legal_name?: string | null
          voucher_url?: string | null
        }
        Update: {
          amount_pen?: number
          created_at?: string
          external_payment_id?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          invoice_type?: string | null
          lawyer_id?: string
          paid_at?: string | null
          payment_method?: string
          rejection_reason?: string | null
          status?: string
          subscription_id?: string
          target_plan_id?: string | null
          tax_id_number?: string | null
          tax_legal_name?: string | null
          voucher_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "lawyer_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_target_plan_id_fkey"
            columns: ["target_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_period: string
          boost_multiplier: number
          created_at: string
          description: string | null
          gateway_plan_id: string | null
          has_ai_assistant: boolean
          has_radar_priority: boolean
          has_whatsapp_alerts: boolean
          id: string
          is_active: boolean
          match_quota: number
          max_team_members: number
          name: string
          price_pen: number
          storage_limit_mb: number
          tier: string
        }
        Insert: {
          billing_period: string
          boost_multiplier?: number
          created_at?: string
          description?: string | null
          gateway_plan_id?: string | null
          has_ai_assistant?: boolean
          has_radar_priority?: boolean
          has_whatsapp_alerts?: boolean
          id: string
          is_active?: boolean
          match_quota?: number
          max_team_members?: number
          name: string
          price_pen?: number
          storage_limit_mb?: number
          tier: string
        }
        Update: {
          billing_period?: string
          boost_multiplier?: number
          created_at?: string
          description?: string | null
          gateway_plan_id?: string | null
          has_ai_assistant?: boolean
          has_radar_priority?: boolean
          has_whatsapp_alerts?: boolean
          id?: string
          is_active?: boolean
          match_quota?: number
          max_team_members?: number
          name?: string
          price_pen?: number
          storage_limit_mb?: number
          tier?: string
        }
        Relationships: []
      }
      verifications: {
        Row: {
          bar_status: Database["public"]["Enums"]["verification_status"]
          bar_verified_at: string | null
          created_at: string
          documents_metadata: Json | null
          id: string
          identity_status: Database["public"]["Enums"]["verification_status"]
          identity_verified_at: string | null
          lawyer_id: string
          rejection_reason: string | null
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          bar_status?: Database["public"]["Enums"]["verification_status"]
          bar_verified_at?: string | null
          created_at?: string
          documents_metadata?: Json | null
          id?: string
          identity_status?: Database["public"]["Enums"]["verification_status"]
          identity_verified_at?: string | null
          lawyer_id: string
          rejection_reason?: string | null
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          bar_status?: Database["public"]["Enums"]["verification_status"]
          bar_verified_at?: string | null
          created_at?: string
          documents_metadata?: Json | null
          id?: string
          identity_status?: Database["public"]["Enums"]["verification_status"]
          identity_verified_at?: string | null
          lawyer_id?: string
          rejection_reason?: string | null
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verifications_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: true
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_case_matches: {
        Args: { p_case_id: string }
        Returns: {
          breakdown: Json
          lawyer_id: string
          total_score: number
        }[]
      }
      consume_lawyer_match_quota: {
        Args: { p_lawyer_id: string }
        Returns: Json
      }
      create_notification: {
        Args: {
          p_data?: Json
          p_message: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      cron_subscription_dunning_sweep: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_verifier: { Args: never; Returns: boolean }
      resolve_arco_request: {
        Args: {
          p_decision: Database["public"]["Enums"]["arco_status"]
          p_request_id: string
          p_resolution_notes: string
        }
        Returns: Json
      }
      resolve_lawyer_verification: {
        Args: {
          p_admin_notes?: string
          p_decision: Database["public"]["Enums"]["verification_status"]
          p_rejection_reason?: string
          p_verification_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      arco_request_type:
        | "access"
        | "rectification"
        | "cancellation"
        | "opposition"
      arco_status: "received" | "in_process" | "resolved" | "rejected"
      case_status:
        | "draft"
        | "published"
        | "matching"
        | "contacted"
        | "in_consultation"
        | "in_progress"
        | "closed"
        | "cancelled"
      consultation_status:
        | "requested"
        | "confirmed"
        | "rescheduled"
        | "completed"
        | "cancelled"
      document_visibility:
        | "private_client"
        | "shared_match"
        | "verification_only"
      match_status:
        | "pending"
        | "user_interested"
        | "lawyer_interested"
        | "matched"
        | "discarded"
      modality_type: "virtual" | "in_person" | "hybrid"
      report_reason:
        | "impersonation"
        | "false_information"
        | "inappropriate_conduct"
        | "fraud"
        | "harassment"
        | "spam"
        | "other"
      urgency_level: "low" | "medium" | "high" | "immediate"
      user_role: "client" | "lawyer" | "admin" | "verifier"
      verification_status:
        | "pending"
        | "in_review"
        | "verified"
        | "observed"
        | "rejected"
        | "suspended"
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
      arco_request_type: [
        "access",
        "rectification",
        "cancellation",
        "opposition",
      ],
      arco_status: ["received", "in_process", "resolved", "rejected"],
      case_status: [
        "draft",
        "published",
        "matching",
        "contacted",
        "in_consultation",
        "in_progress",
        "closed",
        "cancelled",
      ],
      consultation_status: [
        "requested",
        "confirmed",
        "rescheduled",
        "completed",
        "cancelled",
      ],
      document_visibility: [
        "private_client",
        "shared_match",
        "verification_only",
      ],
      match_status: [
        "pending",
        "user_interested",
        "lawyer_interested",
        "matched",
        "discarded",
      ],
      modality_type: ["virtual", "in_person", "hybrid"],
      report_reason: [
        "impersonation",
        "false_information",
        "inappropriate_conduct",
        "fraud",
        "harassment",
        "spam",
        "other",
      ],
      urgency_level: ["low", "medium", "high", "immediate"],
      user_role: ["client", "lawyer", "admin", "verifier"],
      verification_status: [
        "pending",
        "in_review",
        "verified",
        "observed",
        "rejected",
        "suspended",
      ],
    },
  },
} as const
