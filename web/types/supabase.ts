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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      agent_runs: {
        Row: {
          agent_name: string
          completed_at: string | null
          id: string
          logs: Json | null
          puzzles_created: number | null
          run_date: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          agent_name: string
          completed_at?: string | null
          id?: string
          logs?: Json | null
          puzzles_created?: number | null
          run_date: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          agent_name?: string
          completed_at?: string | null
          id?: string
          logs?: Json | null
          puzzles_created?: number | null
          run_date?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      daily_puzzles: {
        Row: {
          content: Json
          created_at: string | null
          difficulty: string | null
          event_subtitle: string | null
          event_tag: string | null
          event_theme: string | null
          event_title: string | null
          game_mode: string
          id: string
          is_bonus: boolean | null
          is_premium: boolean | null
          is_special: boolean | null
          puzzle_date: string | null
          source: string | null
          status: string | null
          triggered_by: string | null
          updated_at: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          difficulty?: string | null
          event_subtitle?: string | null
          event_tag?: string | null
          event_theme?: string | null
          event_title?: string | null
          game_mode: string
          id?: string
          is_bonus?: boolean | null
          is_premium?: boolean | null
          is_special?: boolean | null
          puzzle_date?: string | null
          source?: string | null
          status?: string | null
          triggered_by?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          difficulty?: string | null
          event_subtitle?: string | null
          event_tag?: string | null
          event_theme?: string | null
          event_title?: string | null
          game_mode?: string
          id?: string
          is_bonus?: boolean | null
          is_premium?: boolean | null
          is_special?: boolean | null
          puzzle_date?: string | null
          source?: string | null
          status?: string | null
          triggered_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      match_data: {
        Row: {
          away_score: number | null
          away_team: string
          competition: string | null
          created_at: string | null
          external_id: string | null
          goalscorers: Json | null
          home_score: number | null
          home_team: string
          id: string
          match_date: string | null
          notable_events: Json | null
          processed: boolean | null
          updated_at: string | null
        }
        Insert: {
          away_score?: number | null
          away_team: string
          competition?: string | null
          created_at?: string | null
          external_id?: string | null
          goalscorers?: Json | null
          home_score?: number | null
          home_team: string
          id?: string
          match_date?: string | null
          notable_events?: Json | null
          processed?: boolean | null
          updated_at?: string | null
        }
        Update: {
          away_score?: number | null
          away_team?: string
          competition?: string | null
          created_at?: string | null
          external_id?: string | null
          goalscorers?: Json | null
          home_score?: number | null
          home_team?: string
          id?: string
          match_date?: string | null
          notable_events?: Json | null
          processed?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_premium: boolean | null
          premium_purchased_at: string | null
          total_iq: number
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          is_premium?: boolean | null
          premium_purchased_at?: string | null
          total_iq?: number
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_premium?: boolean | null
          premium_purchased_at?: string | null
          total_iq?: number
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      puzzle_attempts: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          id: string
          metadata: Json | null
          puzzle_id: string | null
          score: number | null
          score_display: string | null
          started_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          puzzle_id?: string | null
          score?: number | null
          score_display?: string | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          puzzle_id?: string | null
          score?: number | null
          score_display?: string | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "puzzle_attempts_puzzle_id_fkey"
            columns: ["puzzle_id"]
            isOneToOne: false
            referencedRelation: "daily_puzzles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          current_streak: number | null
          game_mode: string
          id: string
          last_played_date: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          current_streak?: number | null
          game_mode: string
          id?: string
          last_played_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          current_streak?: number | null
          game_mode?: string
          id?: string
          last_played_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          id: string
          puzzle_id: string
          report_type: "retired_moved" | "incorrect_stats" | "name_visible" | "wrong_club" | "other"
          comment: string | null
          status: "pending" | "resolved" | "dismissed"
          reporter_id: string | null
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          puzzle_id: string
          report_type: "retired_moved" | "incorrect_stats" | "name_visible" | "wrong_club" | "other"
          comment?: string | null
          status?: "pending" | "resolved" | "dismissed"
          reporter_id?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          puzzle_id?: string
          report_type?: "retired_moved" | "incorrect_stats" | "name_visible" | "wrong_club" | "other"
          comment?: string | null
          status?: "pending" | "resolved" | "dismissed"
          reporter_id?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_puzzle_id_fkey"
            columns: ["puzzle_id"]
            isOneToOne: false
            referencedRelation: "daily_puzzles"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          id: string
          name: string
          search_name: string
          scout_rank: number
          birth_year: number | null
          position_category: string | null
          nationality_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          search_name: string
          scout_rank?: number
          birth_year?: number | null
          position_category?: string | null
          nationality_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          search_name?: string
          scout_rank?: number
          birth_year?: number | null
          position_category?: string | null
          nationality_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clubs: {
        Row: {
          id: string
          name: string
          search_name: string
          country_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          search_name: string
          country_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          search_name?: string
          country_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_appearances: {
        Row: {
          id: number
          player_id: string
          club_id: string
          start_year: number | null
          end_year: number | null
          created_at: string
        }
        Insert: {
          id?: number
          player_id: string
          club_id: string
          start_year?: number | null
          end_year?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          player_id?: string
          club_id?: string
          start_year?: number | null
          end_year?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_appearances_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_appearances_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_leaderboard: {
        Args: {
          for_date?: string
          limit_count?: number
        }
        Returns: {
          rank: number
          user_id: string
          display_name: string
          avatar_url: string | null
          daily_score: number
          games_played: number
          last_completed_at: string
        }[]
      }
      get_global_iq_leaderboard: {
        Args: {
          limit_count?: number
        }
        Returns: {
          rank: number
          user_id: string
          display_name: string
          avatar_url: string | null
          global_iq: number
          total_games: number
        }[]
      }
      get_puzzle_by_id: {
        Args: {
          puzzle_id: string
        }
        Returns: {
          id: string
          game_mode: string
          puzzle_date: string
          content: Json
          difficulty: string
        }[]
      }
      get_puzzle_catalog:
        | {
            Args: Record<string, never>
            Returns: {
              id: string
              game_mode: string
              puzzle_date: string
              difficulty: string
            }[]
          }
        | {
            Args: { since_timestamp?: string }
            Returns: {
              id: string
              game_mode: string
              puzzle_date: string
              difficulty: string
            }[]
          }
      get_puzzle_score_distribution: {
        Args: {
          target_puzzle_id: string
        }
        Returns: {
          score: number
          count: number
          percentage: number
          total_attempts: number
        }[]
      }
      get_user_rank: {
        Args: {
          target_user_id: string
          leaderboard_type?: string
          for_date?: string
        }
        Returns: {
          rank: number
          score: number
          total_users: number
        }[]
      }
      get_server_time: {
        Args: Record<string, never>
        Returns: string
      }
      get_elite_index_delta: {
        Args: {
          client_version?: number
        }
        Returns: {
          server_version: number
          has_updates: boolean
          updated_players: Json
        }[]
      }
      bump_elite_index_version: {
        Args: Record<string, never>
        Returns: number
      }
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

// Convenience type for daily_puzzles rows
export type DailyPuzzle = Tables<"daily_puzzles">

// Convenience type for content_reports rows
export type ContentReport = Tables<"content_reports">
export type ContentReportInsert = TablesInsert<"content_reports">
export type ReportType = ContentReport["report_type"]
export type ReportStatus = ContentReport["status"]
