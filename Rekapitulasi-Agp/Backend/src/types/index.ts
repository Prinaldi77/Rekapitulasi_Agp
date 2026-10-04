/**
 * AGP Competition REST API Backend - TypeScript Definitions & Interfaces
 */

export type SchoolLevel = 'SD' | 'SMP' | 'SMA';
export type GroupType = 'PBB_DASAR' | 'VARIASI_FORMASI' | 'DANTON';
export type ShowStatus = 'WAITING' | 'STANDBY' | 'NEXT' | 'NOW PERFORMING' | 'COMPLETED';

export interface Category {
  id: string;
  level: SchoolLevel;
  competition_name: string;
  is_published: boolean;
  created_at?: string;
}

export interface Participant {
  id: string;
  category_id: string;
  show_number: number;
  participant_no: string;
  team_name: string;
  school_name: string;
  gender?: string;
  created_at?: string;
}

export interface AssessmentItem {
  id: string;
  category_id: string;
  group_type: GroupType;
  sub_group?: string;
  item_no: number;
  name: string;
  min_score: number;
  max_score: number;
  weight?: number;
  created_at?: string;
}

export interface ParticipantScore {
  id?: string;
  participant_id: string;
  criterion_id: string;
  juri_number: number;
  score_value: number;
  created_at?: string;
}

export interface Schedule {
  id: string;
  participant_id: string;
  status: ShowStatus;
  time_slot?: string;
  updated_at?: string;
}

// REST API Request Payloads
export interface SubmitScoresPayload {
  participantId: string;
  juriNumber: number;
  scoresMap: Record<string, number>;
}

export interface PublishStatusPayload {
  isPublished: boolean;
}

export interface UpdateScheduleStatusPayload {
  participantId: string;
  status: ShowStatus;
}

// Leaderboard Output Object
export interface LeaderboardItemResponse {
  rank: number;
  badge?: 'Gold' | 'Silver' | 'Bronze' | null;
  participantId: string;
  participantNo: string;
  teamName: string;
  schoolName: string;
  pbbTotal: number;
  variasiTotal: number;
  dantonTotal: number;
  grandTotal: number;
  isTieBroken?: boolean;
}

// Standardized API Response Format
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
