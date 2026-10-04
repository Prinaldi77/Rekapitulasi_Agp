/**
 * Shared Dynamic Storage Utility for AGP Competition System
 * Provides client-side dynamic state with LocalStorage persistence & API sync
 */

export type SchoolLevel = 'SD' | 'SMP' | 'SMA';

export interface DynamicScheduleItem {
  id: string;
  noTampil: number;
  participantNo: string;
  teamName: string;
  schoolName: string;
  category: string;
  jenjang: SchoolLevel;
  timeSlot: string;
  status: 'NOW PERFORMING' | 'STANDBY' | 'NEXT' | 'WAITING' | 'COMPLETED';
}

export interface DynamicBarackItem {
  id: string;
  noTampil: string;
  teamName: string;
  schoolName: string;
  roomName: string;
  jenjang: SchoolLevel;
}

const INITIAL_SCHEDULES: DynamicScheduleItem[] = [];

const INITIAL_BARACKS: DynamicBarackItem[] = [];

// Helper for Schedule
export const getStoredSchedules = (): DynamicScheduleItem[] => {
  if (typeof window === 'undefined') return INITIAL_SCHEDULES;
  const data = localStorage.getItem('agp_dynamic_schedules_v2');
  if (!data) {
    localStorage.setItem('agp_dynamic_schedules_v2', JSON.stringify(INITIAL_SCHEDULES));
    return INITIAL_SCHEDULES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_SCHEDULES;
  }
};

export const saveStoredSchedules = (items: DynamicScheduleItem[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('agp_dynamic_schedules_v2', JSON.stringify(items));
  }
};

// Helper for Barack
export const getStoredBaracks = (): DynamicBarackItem[] => {
  if (typeof window === 'undefined') return INITIAL_BARACKS;
  const data = localStorage.getItem('agp_dynamic_baracks_v2');
  if (!data) {
    localStorage.setItem('agp_dynamic_baracks_v2', JSON.stringify(INITIAL_BARACKS));
    return INITIAL_BARACKS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_BARACKS;
  }
};

export const saveStoredBaracks = (items: DynamicBarackItem[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('agp_dynamic_baracks_v2', JSON.stringify(items));
  }
};
