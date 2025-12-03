/**
 * Database types for Supabase tables
 * Auto-generated from data-model.md schema
 */

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          player_id: string;
          nickname: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          nickname: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          nickname?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          code: string;
          manager_id: string;
          expected_players: number;
          status: RoomStatus;
          created_at: string;
          last_activity_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          manager_id: string;
          expected_players: number;
          status?: RoomStatus;
          created_at?: string;
          last_activity_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          manager_id?: string;
          expected_players?: number;
          status?: RoomStatus;
          created_at?: string;
          last_activity_at?: string;
        };
      };
      room_players: {
        Row: {
          id: string;
          room_id: string;
          player_id: string;
          joined_at: string;
          is_connected: boolean;
          disconnected_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          player_id: string;
          joined_at?: string;
          is_connected?: boolean;
          disconnected_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          player_id?: string;
          joined_at?: string;
          is_connected?: boolean;
          disconnected_at?: string | null;
        };
      };
      player_roles: {
        Row: {
          id: string;
          room_id: string;
          player_id: string;
          role: Role;
          is_confirmed: boolean;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          player_id: string;
          role: Role;
          is_confirmed?: boolean;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          player_id?: string;
          role?: Role;
          is_confirmed?: boolean;
          assigned_at?: string;
        };
      };
    };
    Functions: {
      get_evil_teammates: {
        Args: { p_room_id: string; p_player_id: string };
        Returns: Array<{ nickname: string }>;
      };
      cleanup_stale_rooms: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
  };
}

// Room status enum
export type RoomStatus = 'waiting' | 'roles_distributed' | 'started';

// Role enum
export type Role = 'good' | 'evil';

// Convenience types from row types
export type Player = Database['public']['Tables']['players']['Row'];
export type PlayerInsert = Database['public']['Tables']['players']['Insert'];
export type PlayerUpdate = Database['public']['Tables']['players']['Update'];

export type Room = Database['public']['Tables']['rooms']['Row'];
export type RoomInsert = Database['public']['Tables']['rooms']['Insert'];
export type RoomUpdate = Database['public']['Tables']['rooms']['Update'];

export type RoomPlayer = Database['public']['Tables']['room_players']['Row'];
export type RoomPlayerInsert = Database['public']['Tables']['room_players']['Insert'];
export type RoomPlayerUpdate = Database['public']['Tables']['room_players']['Update'];

export type PlayerRole = Database['public']['Tables']['player_roles']['Row'];
export type PlayerRoleInsert = Database['public']['Tables']['player_roles']['Insert'];
export type PlayerRoleUpdate = Database['public']['Tables']['player_roles']['Update'];
