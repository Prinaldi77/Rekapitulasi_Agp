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

const INITIAL_SCHEDULES: DynamicScheduleItem[] = [
  // SD / MI
  { id: 's_sd1', noTampil: 1, participantNo: 'SD-01', teamName: 'PASBRAMA CILIK', schoolName: 'SDN 1 KOTA BANDUNG', category: 'LKBB PRAMUKA', jenjang: 'SD', timeSlot: '07:30 - 07:45', status: 'COMPLETED' },
  { id: 's_sd2', noTampil: 2, participantNo: 'SD-02', teamName: 'GARUDA CILIK', schoolName: 'SDN 3 KOTA BANDUNG', category: 'LKBB PRAMUKA', jenjang: 'SD', timeSlot: '07:45 - 08:00', status: 'COMPLETED' },

  // SMP / MTs
  { id: 's_smp1', noTampil: 1, participantNo: 'SMP-01', teamName: 'SATRIA MUDA', schoolName: 'SMPN 1 KOTA BANDUNG', category: 'LKBB PRAMUKA', jenjang: 'SMP', timeSlot: '08:00 - 08:20', status: 'COMPLETED' },
  { id: 's_smp2', noTampil: 2, participantNo: 'SMP-02', teamName: 'PANG LIMA MUDA', schoolName: 'SMPN 3 KOTA BANDUNG', category: 'LKBB PRAMUKA', jenjang: 'SMP', timeSlot: '08:20 - 08:40', status: 'NOW PERFORMING' },
  { id: 's_smp3', noTampil: 3, participantNo: 'SMP-03', teamName: 'TRISULA JUNIOR', schoolName: 'SMPN 5 KOTA BANDUNG', category: 'LKBB PRAMUKA', jenjang: 'SMP', timeSlot: '08:40 - 09:00', status: 'STANDBY' },

  // SMA / SMK
  { id: 's_sma1', noTampil: 1, participantNo: 'SMA-01', teamName: 'PASBRATA UTAMA', schoolName: 'SMAN 1 KOTA BANDUNG', category: 'LKBB PRAMUKA', jenjang: 'SMA', timeSlot: '09:00 - 09:20', status: 'NEXT' },
  { id: 's_sma2', noTampil: 2, participantNo: 'SMA-02', teamName: 'GARUDA KENCANA', schoolName: 'SMAN 3 KOTA BANDUNG', category: 'LKBB PRAMUKA', jenjang: 'SMA', timeSlot: '09:20 - 09:40', status: 'WAITING' },
];

const INITIAL_BARACKS: DynamicBarackItem[] = [
  // SD
  { id: 'b_sd1', noTampil: 'SD-01', teamName: 'PASBRAMA CILIK', schoolName: 'SDN 1 KOTA BANDUNG', roomName: 'Kelas VI-A', jenjang: 'SD' },
  { id: 'b_sd2', noTampil: 'SD-02', teamName: 'GARUDA CILIK', schoolName: 'SDN 3 KOTA BANDUNG', roomName: 'Kelas VI-B', jenjang: 'SD' },

  // SMP
  { id: 'b_smp1', noTampil: 'SMP-01', teamName: 'SATRIA MUDA', schoolName: 'SMPN 1 KOTA BANDUNG', roomName: 'Kelas VII-1', jenjang: 'SMP' },
  { id: 'b_smp2', noTampil: 'SMP-02', teamName: 'PANG LIMA MUDA', schoolName: 'SMPN 3 KOTA BANDUNG', roomName: 'Kelas VII-2', jenjang: 'SMP' },

  // SMA
  { id: 'b_sma1', noTampil: 'SMA-01', teamName: 'PASBRATA UTAMA', schoolName: 'SMAN 1 KOTA BANDUNG', roomName: 'Kelas X-1', jenjang: 'SMA' },
  { id: 'b_sma2', noTampil: 'SMA-02', teamName: 'GARUDA KENCANA', schoolName: 'SMAN 3 KOTA BANDUNG', roomName: 'Kelas X-2', jenjang: 'SMA' },
];

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
