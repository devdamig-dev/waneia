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
      activity_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: string
          workspace_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
          workspace_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          actions: Json
          category: string
          created_at: string
          description: string | null
          id: string
          last_executed_at: string | null
          name: string
          reply_rate: number
          response_message: string | null
          run_count: number
          status: string
          trigger_type: string
          trigger_value: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          actions?: Json
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          last_executed_at?: string | null
          name: string
          reply_rate?: number
          response_message?: string | null
          run_count?: number
          status?: string
          trigger_type: string
          trigger_value?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          actions?: Json
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          last_executed_at?: string | null
          name?: string
          reply_rate?: number
          response_message?: string | null
          run_count?: number
          status?: string
          trigger_type?: string
          trigger_value?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          assigned_user_id: string | null
          business: string | null
          created_at: string
          email: string | null
          id: string
          last_interaction_at: string | null
          lifecycle: string
          metadata: Json
          name: string
          opt_in: boolean
          phone: string
          source: string
          tags: string[]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_user_id?: string | null
          business?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_interaction_at?: string | null
          lifecycle?: string
          metadata?: Json
          name: string
          opt_in?: boolean
          phone: string
          source?: string
          tags?: string[]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_user_id?: string | null
          business?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_interaction_at?: string | null
          lifecycle?: string
          metadata?: Json
          name?: string
          opt_in?: boolean
          phone?: string
          source?: string
          tags?: string[]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_user_id: string | null
          category: string
          channel: string
          contact_id: string
          created_at: string
          id: string
          intent: string | null
          internal_notes: string | null
          last_message: string | null
          last_message_at: string | null
          linked_opportunity_id: string | null
          next_task: string | null
          next_task_due_at: string | null
          priority: string
          raw_metadata: Json
          sla_due_at: string | null
          status: string
          suggested_reply: string | null
          tags: string[]
          updated_at: string
          whatsapp_thread_key: string | null
          workspace_id: string
        }
        Insert: {
          assigned_user_id?: string | null
          category?: string
          channel?: string
          contact_id: string
          created_at?: string
          id?: string
          intent?: string | null
          internal_notes?: string | null
          last_message?: string | null
          last_message_at?: string | null
          linked_opportunity_id?: string | null
          next_task?: string | null
          next_task_due_at?: string | null
          priority?: string
          raw_metadata?: Json
          sla_due_at?: string | null
          status?: string
          suggested_reply?: string | null
          tags?: string[]
          updated_at?: string
          whatsapp_thread_key?: string | null
          workspace_id: string
        }
        Update: {
          assigned_user_id?: string | null
          category?: string
          channel?: string
          contact_id?: string
          created_at?: string
          id?: string
          intent?: string | null
          internal_notes?: string | null
          last_message?: string | null
          last_message_at?: string | null
          linked_opportunity_id?: string | null
          next_task?: string | null
          next_task_due_at?: string | null
          priority?: string
          raw_metadata?: Json
          sla_due_at?: string | null
          status?: string
          suggested_reply?: string | null
          tags?: string[]
          updated_at?: string
          whatsapp_thread_key?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_linked_opportunity_id_fkey"
            columns: ["linked_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          direction: string
          id: string
          message_type: string
          payload: Json
          sender_user_id: string | null
          sent_at: string
          status: string
          whatsapp_message_id: string | null
          workspace_id: string
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          message_type?: string
          payload?: Json
          sender_user_id?: string | null
          sent_at?: string
          status?: string
          whatsapp_message_id?: string | null
          workspace_id: string
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          message_type?: string
          payload?: Json
          sender_user_id?: string | null
          sent_at?: string
          status?: string
          whatsapp_message_id?: string | null
          workspace_id?: string
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
            foreignKeyName: "messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          business: string | null
          category: string
          contact_id: string
          conversation_id: string | null
          created_at: string
          estimated_value: number
          id: string
          lost_reason: string | null
          name: string
          next_follow_up_at: string | null
          notes: string | null
          owner_user_id: string | null
          source: string
          stage: string
          tags: string[]
          updated_at: string
          won_at: string | null
          workspace_id: string
        }
        Insert: {
          business?: string | null
          category?: string
          contact_id: string
          conversation_id?: string | null
          created_at?: string
          estimated_value?: number
          id?: string
          lost_reason?: string | null
          name: string
          next_follow_up_at?: string | null
          notes?: string | null
          owner_user_id?: string | null
          source?: string
          stage?: string
          tags?: string[]
          updated_at?: string
          won_at?: string | null
          workspace_id: string
        }
        Update: {
          business?: string | null
          category?: string
          contact_id?: string
          conversation_id?: string | null
          created_at?: string
          estimated_value?: number
          id?: string
          lost_reason?: string | null
          name?: string
          next_follow_up_at?: string | null
          notes?: string | null
          owner_user_id?: string | null
          source?: string
          stage?: string
          tags?: string[]
          updated_at?: string
          won_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_accounts: {
        Row: {
          created_at: string
          display_phone_number: string | null
          id: string
          metadata: Json
          phone_number_id: string
          status: string
          updated_at: string
          verified_name: string | null
          waba_id: string | null
          webhook_subscribed: boolean
          workspace_id: string
        }
        Insert: {
          created_at?: string
          display_phone_number?: string | null
          id?: string
          metadata?: Json
          phone_number_id: string
          status?: string
          updated_at?: string
          verified_name?: string | null
          waba_id?: string | null
          webhook_subscribed?: boolean
          workspace_id: string
        }
        Update: {
          created_at?: string
          display_phone_number?: string | null
          id?: string
          metadata?: Json
          phone_number_id?: string
          status?: string
          updated_at?: string
          verified_name?: string | null
          waba_id?: string | null
          webhook_subscribed?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string
          id: string
          industry: string | null
          name: string
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          industry?: string | null
          name: string
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          industry?: string | null
          name?: string
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
