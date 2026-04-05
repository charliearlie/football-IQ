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
      achievements: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          id: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
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
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      blog_articles: {
        Row: {
          article_date: string
          content: string
          created_at: string
          excerpt: string | null
          generation_model: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          published_at: string | null
          published_by: string | null
          raw_match_data: Json | null
          research_data: Json | null
          review_factual: Json | null
          review_quality: Json | null
          review_sensitivity: Json | null
          slug: string
          status: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          article_date: string
          content: string
          created_at?: string
          excerpt?: string | null
          generation_model?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          published_at?: string | null
          published_by?: string | null
          raw_match_data?: Json | null
          research_data?: Json | null
          review_factual?: Json | null
          review_quality?: Json | null
          review_sensitivity?: Json | null
          slug: string
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          article_date?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          generation_model?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          published_at?: string | null
          published_by?: string | null
          raw_match_data?: Json | null
          research_data?: Json | null
          review_factual?: Json | null
          review_quality?: Json | null
          review_sensitivity?: Json | null
          slug?: string
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      challenge_responses: {
        Row: {
          challenge_id: string
          completed_at: string | null
          id: string
          metadata: Json | null
          responder_id: string
          score: number
          score_display: string | null
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          responder_id: string
          score: number
          score_display?: string | null
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          responder_id?: string
          score?: number
          score_display?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_responses_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenger_id: string
          challenger_metadata: Json | null
          challenger_score: number
          challenger_score_display: string | null
          created_at: string | null
          game_mode: string
          id: string
          play_count: number | null
          puzzle_date: string | null
          puzzle_id: string
        }
        Insert: {
          challenger_id: string
          challenger_metadata?: Json | null
          challenger_score: number
          challenger_score_display?: string | null
          created_at?: string | null
          game_mode: string
          id?: string
          play_count?: number | null
          puzzle_date?: string | null
          puzzle_id: string
        }
        Update: {
          challenger_id?: string
          challenger_metadata?: Json | null
          challenger_score?: number
          challenger_score_display?: string | null
          created_at?: string | null
          game_mode?: string
          id?: string
          play_count?: number | null
          puzzle_date?: string | null
          puzzle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_puzzle_id_fkey"
            columns: ["puzzle_id"]
            isOneToOne: false
            referencedRelation: "daily_puzzles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_mismatches: {
        Row: {
          api_club_id: number | null
          api_club_name: string | null
          detected_at: string | null
          id: number
          our_club_name: string | null
          player_id: string | null
          resolved_action: string | null
          resolved_at: string | null
        }
        Insert: {
          api_club_id?: number | null
          api_club_name?: string | null
          detected_at?: string | null
          id?: number
          our_club_name?: string | null
          player_id?: string | null
          resolved_action?: string | null
          resolved_at?: string | null
        }
        Update: {
          api_club_id?: number | null
          api_club_name?: string | null
          detected_at?: string | null
          id?: number
          our_club_name?: string | null
          player_id?: string | null
          resolved_action?: string | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_mismatches_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_mismatches_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_players_no_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_mismatches_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_suspicious_club_assignments"
            referencedColumns: ["player_id"]
          },
        ]
      }
      clubs: {
        Row: {
          api_football_id: number | null
          canonical_club_id: string | null
          country_code: string | null
          created_at: string
          display_name: string | null
          id: string
          league: string | null
          name: string
          search_name: string
          updated_at: string
        }
        Insert: {
          api_football_id?: number | null
          canonical_club_id?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          league?: string | null
          name: string
          search_name: string
          updated_at?: string
        }
        Update: {
          api_football_id?: number | null
          canonical_club_id?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          league?: string | null
          name?: string
          search_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_canonical_club_id_fkey"
            columns: ["canonical_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clubs_canonical_club_id_fkey"
            columns: ["canonical_club_id"]
            isOneToOne: false
            referencedRelation: "v_suspicious_club_assignments"
            referencedColumns: ["club_id"]
          },
        ]
      }
      content_reports: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          puzzle_id: string
          report_type: string
          reporter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          puzzle_id: string
          report_type: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          puzzle_id?: string
          report_type?: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string | null
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
      email_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
          unsubscribed_at: string | null
          welcome_sequence_step: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
          unsubscribed_at?: string | null
          welcome_sequence_step?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
          unsubscribed_at?: string | null
          welcome_sequence_step?: number
        }
        Relationships: []
      }
      game_submissions: {
        Row: {
          created_at: string | null
          description: string
          email: string | null
          id: string
          status: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          email?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          email?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      grid_cell_selections: {
        Row: {
          cell_index: number
          created_at: string
          id: number
          nationality_code: string | null
          player_id: string
          player_name: string
          puzzle_id: string
          selection_count: number
          updated_at: string
        }
        Insert: {
          cell_index: number
          created_at?: string
          id?: number
          nationality_code?: string | null
          player_id: string
          player_name: string
          puzzle_id: string
          selection_count?: number
          updated_at?: string
        }
        Update: {
          cell_index?: number
          created_at?: string
          id?: number
          nationality_code?: string | null
          player_id?: string
          player_name?: string
          puzzle_id?: string
          selection_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grid_cell_selections_puzzle_id_fkey"
            columns: ["puzzle_id"]
            isOneToOne: false
            referencedRelation: "daily_puzzles"
            referencedColumns: ["id"]
          },
        ]
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
      notification_opens: {
        Row: {
          id: string
          notification_id: string | null
          opened_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          notification_id?: string | null
          opened_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string | null
          opened_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_opens_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "sent_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      player_achievements: {
        Row: {
          achievement_id: string
          club_id: string | null
          created_at: string
          id: number
          player_id: string
          year: number | null
        }
        Insert: {
          achievement_id: string
          club_id?: string | null
          created_at?: string
          id?: number
          player_id: string
          year?: number | null
        }
        Update: {
          achievement_id?: string
          club_id?: string | null
          created_at?: string
          id?: number
          player_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_achievements_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_achievements_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "v_suspicious_club_assignments"
            referencedColumns: ["club_id"]
          },
          {
            foreignKeyName: "player_achievements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_achievements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_players_no_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_achievements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_suspicious_club_assignments"
            referencedColumns: ["player_id"]
          },
        ]
      }
      player_appearances: {
        Row: {
          club_id: string
          created_at: string
          end_year: number | null
          id: number
          player_id: string
          start_year: number | null
        }
        Insert: {
          club_id: string
          created_at?: string
          end_year?: number | null
          id?: number
          player_id: string
          start_year?: number | null
        }
        Update: {
          club_id?: string
          created_at?: string
          end_year?: number | null
          id?: number
          player_id?: string
          start_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_appearances_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_appearances_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "v_suspicious_club_assignments"
            referencedColumns: ["club_id"]
          },
          {
            foreignKeyName: "player_appearances_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_appearances_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_players_no_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_appearances_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_suspicious_club_assignments"
            referencedColumns: ["player_id"]
          },
        ]
      }
      player_links: {
        Row: {
          club_id: string
          overlap_end: number | null
          overlap_start: number | null
          player_a: string
          player_b: string
        }
        Insert: {
          club_id: string
          overlap_end?: number | null
          overlap_start?: number | null
          player_a: string
          player_b: string
        }
        Update: {
          club_id?: string
          overlap_end?: number | null
          overlap_start?: number | null
          player_a?: string
          player_b?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          api_football_id: number | null
          birth_year: number | null
          career_refreshed_at: string | null
          created_at: string
          id: string
          mapping_status: string | null
          name: string
          nationality_code: string | null
          position_category: string | null
          scout_rank: number
          search_name: string
          stats_cache: Json | null
          updated_at: string
          verified_at: string | null
          verified_club: string | null
          verified_league: string | null
        }
        Insert: {
          api_football_id?: number | null
          birth_year?: number | null
          career_refreshed_at?: string | null
          created_at?: string
          id: string
          mapping_status?: string | null
          name: string
          nationality_code?: string | null
          position_category?: string | null
          scout_rank?: number
          search_name: string
          stats_cache?: Json | null
          updated_at?: string
          verified_at?: string | null
          verified_club?: string | null
          verified_league?: string | null
        }
        Update: {
          api_football_id?: number | null
          birth_year?: number | null
          career_refreshed_at?: string | null
          created_at?: string
          id?: string
          mapping_status?: string | null
          name?: string
          nationality_code?: string | null
          position_category?: string | null
          scout_rank?: number
          search_name?: string
          stats_cache?: Json | null
          updated_at?: string
          verified_at?: string | null
          verified_club?: string | null
          verified_league?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_admin: boolean
          is_premium: boolean | null
          is_readonly: boolean
          premium_purchased_at: string | null
          referral_code: string | null
          total_iq: number
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          is_admin?: boolean
          is_premium?: boolean | null
          is_readonly?: boolean
          premium_purchased_at?: string | null
          referral_code?: string | null
          total_iq?: number
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_admin?: boolean
          is_premium?: boolean | null
          is_readonly?: boolean
          premium_purchased_at?: string | null
          referral_code?: string | null
          total_iq?: number
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
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
      scheduled_notifications: {
        Row: {
          body: string
          campaign_type: string | null
          created_at: string | null
          data: Json
          id: string
          recipient_count: number | null
          scheduled_for: string
          segment: string
          sent_at: string | null
          status: string
          title: string
        }
        Insert: {
          body: string
          campaign_type?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          recipient_count?: number | null
          scheduled_for: string
          segment?: string
          sent_at?: string | null
          status?: string
          title: string
        }
        Update: {
          body?: string
          campaign_type?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          recipient_count?: number | null
          scheduled_for?: string
          segment?: string
          sent_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      sent_notifications: {
        Row: {
          body: string
          data: Json | null
          id: string
          recipient_count: number | null
          sent_at: string | null
          sent_by: string | null
          title: string
        }
        Insert: {
          body: string
          data?: Json | null
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          title: string
        }
        Update: {
          body?: string
          data?: Json | null
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          title?: string
        }
        Relationships: []
      }
      tier_history: {
        Row: {
          id: number
          reached_at: string
          tier_name: string
          tier_number: number
          total_iq_at_transition: number
          user_id: string
        }
        Insert: {
          id?: number
          reached_at?: string
          tier_name: string
          tier_number: number
          total_iq_at_transition: number
          user_id: string
        }
        Update: {
          id?: number
          reached_at?: string
          tier_name?: string
          tier_number?: number
          total_iq_at_transition?: number
          user_id?: string
        }
        Relationships: []
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
    }
    Views: {
      v_elite_at_obscure_clubs: {
        Row: {
          club_name: string | null
          country_code: string | null
          player_name: string | null
          scout_rank: number | null
        }
        Relationships: []
      }
      v_players_no_clubs: {
        Row: {
          id: string | null
          name: string | null
          nationality_code: string | null
          scout_rank: number | null
        }
        Relationships: []
      }
      v_suspicious_club_assignments: {
        Row: {
          club_country: string | null
          club_id: string | null
          club_name: string | null
          player_country: string | null
          player_id: string | null
          player_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bump_elite_index_version: { Args: never; Returns: number }
      calculate_player_stats: {
        Args: { target_player_id: string }
        Returns: Json
      }
      check_players_linked: {
        Args: { player_a_qid: string; player_b_qid: string }
        Returns: {
          is_linked: boolean
          overlap_end: number
          overlap_start: number
          shared_club_id: string
          shared_club_name: string
        }[]
      }
      count_active_users_7d: { Args: never; Returns: number }
      count_distinct_users_played: { Args: never; Returns: number }
      count_no_career_players: { Args: never; Returns: number }
      find_chain_path_samples: {
        Args: { end_qid: string; sample_count?: number; start_qid: string }
        Returns: {
          depth_counts: Json
          optimal_length: number
          paths: Json
        }[]
      }
      find_shortest_player_path: {
        Args: { end_qid: string; max_depth?: number; start_qid: string }
        Returns: {
          path_found: boolean
          path_length: number
          path_names: string[]
          path_qids: string[]
        }[]
      }
      get_alltime_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          display_name: string
          rank: number
          total_games: number
          total_iq: number
          user_id: string
        }[]
      }
      get_balldle_attributes: { Args: { p_player_id: string }; Returns: Json }
      get_canonical_club_id: { Args: { club_id: string }; Returns: string }
      get_club_player_distribution: {
        Args: never
        Returns: {
          bucket: string
          club_count: number
        }[]
      }
      get_daily_leaderboard: {
        Args: { for_date?: string; limit_count?: number }
        Returns: {
          avatar_url: string
          daily_score: number
          display_name: string
          games_played: number
          last_completed_at: string
          rank: number
          user_id: string
        }[]
      }
      get_duplicate_club_groups: {
        Args: never
        Returns: {
          clubs: Json
          country_code: string
          normalized_name: string
        }[]
      }
      get_elite_index_delta: {
        Args: { client_version?: number }
        Returns: {
          has_updates: boolean
          server_version: number
          updated_players: Json
        }[]
      }
      get_global_iq_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          display_name: string
          global_iq: number
          rank: number
          total_games: number
          user_id: string
        }[]
      }
      get_grid_cell_rarity: {
        Args: { p_cell_index: number; p_player_id: string; p_puzzle_id: string }
        Returns: {
          cell_total: number
          rank_in_cell: number
          rarity_pct: number
          selection_count: number
        }[]
      }
      get_grid_cell_stats: {
        Args: { p_puzzle_id: string }
        Returns: {
          avg_rarity: number
          cell_index: number
          top_player_count: number
          top_player_id: string
          top_player_name: string
          top_player_pct: number
          total_selections: number
          unique_players: number
        }[]
      }
      get_grid_summary_rarity: {
        Args: { p_puzzle_id: string; p_selections: Json }
        Returns: {
          cell_index: number
          cell_total: number
          nationality_code: string
          player_id: string
          player_name: string
          rarity_pct: number
          selection_count: number
        }[]
      }
      get_no_career_players: {
        Args: { p_limit: number; p_offset: number }
        Returns: {
          birth_year: number
          id: string
          name: string
          nationality_code: string
          scout_rank: number
        }[]
      }
      get_puzzle_by_id: {
        Args: { puzzle_id: string }
        Returns: {
          content: Json
          difficulty: string
          game_mode: string
          id: string
          puzzle_date: string
        }[]
      }
      get_puzzle_catalog: {
        Args: { since_timestamp?: string }
        Returns: {
          difficulty: string
          game_mode: string
          id: string
          is_premium: boolean
          puzzle_date: string
        }[]
      }
      get_puzzle_score_distribution: {
        Args: { target_puzzle_id: string }
        Returns: {
          count: number
          percentage: number
          score: number
          total_attempts: number
        }[]
      }
      get_server_time: { Args: never; Returns: string }
      get_user_list: {
        Args: {
          p_cohort?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
        }
        Returns: Json
      }
      get_user_rank: {
        Args: {
          for_date?: string
          leaderboard_type?: string
          target_user_id: string
        }
        Returns: {
          rank: number
          score: number
          total_users: number
        }[]
      }
      get_yearly_leaderboard: {
        Args: { for_year?: number; limit_count?: number }
        Returns: {
          avatar_url: string
          display_name: string
          games_played: number
          last_completed_at: string
          rank: number
          user_id: string
          yearly_score: number
        }[]
      }
      match_club_by_name: {
        Args: { club_name_input: string; player_country_code?: string }
        Returns: {
          appearance_count: number
          club_id: string
          club_name: string
          country_code: string
          match_score: number
        }[]
      }
      record_grid_selection: {
        Args: {
          p_cell_index: number
          p_nationality_code?: string
          p_player_id: string
          p_player_name: string
          p_puzzle_id: string
        }
        Returns: undefined
      }
      record_notification_open: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: undefined
      }
      safe_upsert_attempt: {
        Args: {
          p_completed: boolean
          p_completed_at: string
          p_id: string
          p_metadata: Json
          p_puzzle_id: string
          p_score: number
          p_score_display: string
          p_started_at: string
          p_user_id: string
        }
        Returns: undefined
      }
      search_players_oracle: {
        Args: { match_limit?: number; query_text: string }
        Returns: {
          birth_year: number
          id: string
          name: string
          nationality_code: string
          position_category: string
          relevance_score: number
          scout_rank: number
        }[]
      }
      upgrade_to_premium: {
        Args: never
        Returns: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_admin: boolean
          is_premium: boolean | null
          is_readonly: boolean
          premium_purchased_at: string | null
          referral_code: string | null
          total_iq: number
          updated_at: string | null
          username: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      validate_player_club: {
        Args: { club_qid: string; player_qid: string }
        Returns: boolean
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

// ─── Convenience aliases ─────────────────────────────────────────────────────

export type DailyPuzzle = Tables<"daily_puzzles">
export type ContentReport = Tables<"content_reports">
export type ContentReportInsert = TablesInsert<"content_reports">
export type ReportType = ContentReport["report_type"]
export type ReportStatus = ContentReport["status"]
