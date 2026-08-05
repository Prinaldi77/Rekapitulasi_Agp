/**
 * AGP Competition Management System - Definisi Tipe TypeScript Utama
 */

export type SchoolLevel = 'SD' | 'SMP' | 'SMA';

export type GroupType = 'PBB_DASAR' | 'VARIASI_FORMASI' | 'DANTON';

export type ShowStatus = 'WAITING' | 'PERFORMING' | 'COMPLETED';

export type WinnerBadge = 'Gold' | 'Silver' | 'Bronze' | null;

/**
 * Interface Kategori Lomba
 */
export interface Category {
  id: string;
  level: SchoolLevel;
  competition_name: string;
  is_published: boolean;
  created_at?: string;
}

/**
 * Interface Peserta Lomba
 */
export interface Participant {
  id: string;
  category_id: string;
  show_number: number;
  participant_no: string; // e.g. "A-01"
  team_name: string;      // e.g. "PASBRATA UTAMA"
  school_name: string;    // e.g. "SMAN 1 BANDUNG"
  gender?: string;        // 'PA', 'PI', 'CAMPURAN'
  created_at?: string;
}

/**
 * Interface Unsur Penilaian / Kriteria Juri
 */
export interface AssessmentItem {
  id: string;
  category_id: string;
  group_type: GroupType;
  sub_group?: string;
  item_no: number;
  item_name: string;
  min_score: number;
  max_score: number;
  created_at?: string;
}

/**
 * Interface Skor per Item per Juri
 */
export interface ParticipantScore {
  id?: string;
  participant_id: string;
  item_id: string;
  juri_number: number; // 1, 2, atau 3
  score_value: number;
  created_at?: string;
}

/**
 * Interface Urutan Tampil Realtime
 */
export interface Schedule {
  id: string;
  participant_id: string;
  status: ShowStatus;
  time_slot?: string;
  participant?: Participant;
  updated_at?: string;
}

/**
 * Interface Pembagian Transit / Barak Peserta
 */
export interface Barack {
  id: string;
  participant_id: string;
  room_name: string;
  building: string;
  participant?: Participant;
  updated_at?: string;
}

/**
 * Interface Papan Peringkat / Leaderboard Entry
 */
export interface LeaderboardEntry {
  rank: number;
  badge: WinnerBadge;
  participant: Participant;
  totalScore: number;
  juriScores: {
    juri1: number;
    juri2: number;
    juri3: number;
  };
  groupTotals: {
    PBB_DASAR: number;
    VARIASI_FORMASI: number;
    DANTON: number;
  };
  isTieBroken?: boolean;
}

/**
 * Response Standar dari Server Actions
 */
export interface ActionResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
