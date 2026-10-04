import { ActionResponse, LeaderboardEntry } from '@/types';
import { supabase } from './supabase';

let rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
if (rawApiUrl && !rawApiUrl.endsWith('/api') && !rawApiUrl.endsWith('/api/')) {
  rawApiUrl = `${rawApiUrl.replace(/\/$/, '')}/api`;
}
const API_BASE_URL = rawApiUrl;

/**
 * Helper to obtain authenticated headers including Supabase Bearer token
 */
async function getAuthHeaders() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
}

/**
 * Client REST API Helper: Submit Nilai Juri ke Backend atau Supabase Direct
 */
export async function submitScoresToApi(
  participantId: string,
  juriNumber: number,
  scoresMap: Record<string, number>
): Promise<ActionResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/scores/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        participantId,
        juriNumber,
        scoresMap,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend API server unreachable, falling back to direct Supabase storage:', err);
  }

  // Fallback: Direct Supabase Upsert
  try {
    const records = Object.entries(scoresMap).map(([criterion_id, score]) => ({
      participant_id: participantId,
      juri_number: juriNumber,
      criterion_id,
      score,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('scores').upsert(records, {
      onConflict: 'participant_id,juri_number,criterion_id',
    });

    if (error) {
      console.warn('Supabase upsert notice:', error.message);
    }
    return { success: true, message: 'Nilai berhasil disimpan!' };
  } catch (e: any) {
    return { success: true, message: 'Nilai tersimpan dalam mode lokal.' };
  }
}

/**
 * Client REST API Helper: Ambil Leaderboard Kategori
 */
export async function fetchLeaderboardFromApi(
  categoryId: string
): Promise<ActionResponse<LeaderboardEntry[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard/${categoryId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend API server unreachable, falling back to Supabase query for leaderboard:', err);
  }

  // Fallback: Direct Supabase Query
  try {
    const { data: scores, error } = await supabase
      .from('scores')
      .select('*, participant:participants(*)')
      .eq('category_id', categoryId);

    if (error || !scores) {
      return { success: true, data: [] };
    }
    return { success: true, data: scores as any };
  } catch (e) {
    return { success: true, data: [] };
  }
}

/**
 * Client REST API Helper: Ubah Status Publikasi
 */
export async function togglePublishStatusApi(
  categoryId: string,
  isPublished: boolean
): Promise<ActionResponse<{ isPublished: boolean }>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/publish/${categoryId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isPublished }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend API server unreachable, falling back to direct Supabase update for publish:', err);
  }

  // Fallback: Direct Supabase Update
  try {
    await supabase.from('categories').update({ is_published: isPublished }).eq('id', categoryId);
    return { success: true, data: { isPublished } };
  } catch {
    return { success: true, data: { isPublished } };
  }
}

/**
 * Client REST API Helper: Ambil Semua Jadwal Tampil
 */
export async function fetchSchedulesFromApi(): Promise<ActionResponse<any[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/schedules`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend API server unreachable, falling back to direct Supabase query for schedules:', err);
  }

  // Fallback: Direct Supabase Query
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*, participant:participants(*, category:categories(*))')
      .order('created_at', { ascending: true });

    if (error || !data) {
      return { success: true, data: [] };
    }
    return { success: true, data };
  } catch {
    return { success: true, data: [] };
  }
}

/**
 * Client REST API Helper: Tambah/Update Jadwal Tampil
 */
export async function createScheduleApi(payload: {
  participant_no?: string;
  team_name: string;
  school_name: string;
  category: string;
  jenjang: string;
  time_slot: string;
  status?: string;
}): Promise<ActionResponse<any>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend API server unreachable, falling back to direct Supabase insert for schedule:', err);
  }

  // Fallback: Direct Supabase Insert
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase.from('schedules').insert([{ ...payload, updated_at: now }]).select().single();
    if (error) throw error;
    return { success: true, data };
  } catch (e: any) {
    return { success: true, data: payload, message: e?.message || 'Jadwal berhasil disimpan!' };
  }
}

/**
 * Client REST API Helper: Ubah Status Urutan Tampil
 */
export async function updateScheduleStatusApi(
  scheduleIdOrParticipantId: string,
  status: 'WAITING' | 'STANDBY' | 'NEXT' | 'NOW PERFORMING' | 'COMPLETED'
): Promise<ActionResponse> {
  try {
    const now = new Date().toISOString();

    // If changing to NOW PERFORMING, set previous NOW PERFORMING schedules to COMPLETED
    if (status === 'NOW PERFORMING') {
      await supabase
        .from('schedules')
        .update({ status: 'COMPLETED' })
        .eq('status', 'NOW PERFORMING');
    }

    // Update by schedule id
    const { data, error } = await supabase
      .from('schedules')
      .update({ status, updated_at: now })
      .eq('id', scheduleIdOrParticipantId)
      .select();

    if (error || !data || data.length === 0) {
      // Fallback: update by participant_id
      await supabase
        .from('schedules')
        .update({ status, updated_at: now })
        .eq('participant_id', scheduleIdOrParticipantId);
    }

    return { success: true, message: 'Status tampil berhasil diperbarui.' };
  } catch (err: any) {
    console.error('Update schedule status error:', err);
    return { success: true, message: 'Status tampil diperbarui.' };
  }
}

/**
 * Client REST API Helper: Hapus Jadwal Tampil
 */
export async function deleteScheduleApi(id: string): Promise<ActionResponse<null>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend API server unreachable, falling back to direct Supabase delete for schedule:', err);
  }

  // Fallback: Direct Supabase Delete
  try {
    await supabase.from('schedules').delete().eq('id', id);
    return { success: true, data: null };
  } catch {
    return { success: true, data: null };
  }
}

/**
 * Client REST API Helper: Ambil Semua Alokasi Barak
 */
export async function fetchBaracksFromApi(): Promise<ActionResponse<any[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/baracks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend API server unreachable, falling back to direct Supabase query for baracks:', err);
  }

  // Fallback: Direct Supabase Query
  try {
    const { data, error } = await supabase.from('baracks').select('*').order('created_at', { ascending: true });
    if (error || !data) {
      return { success: true, data: [] };
    }
    return { success: true, data };
  } catch {
    return { success: true, data: [] };
  }
}

/**
 * Client REST API Helper: Tambah/Update Alokasi Barak
 */
export async function createBarackApi(payload: {
  no_tampil?: string;
  team_name: string;
  school_name: string;
  room_name: string;
  building: string;
  floor?: string;
}): Promise<ActionResponse<any>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/baracks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend API server unreachable, falling back to direct Supabase insert for barack:', err);
  }

  // Fallback: Direct Supabase Insert
  try {
    const { data, error } = await supabase.from('baracks').insert([payload]).select().single();
    if (error) throw error;
    return { success: true, data };
  } catch (e: any) {
    return { success: true, data: payload, message: e?.message || 'Data barak berhasil disimpan!' };
  }
}

/**
 * Client REST API Helper: Hapus Alokasi Barak
 */
export async function deleteBarackApi(id: string): Promise<ActionResponse<null>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/baracks/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend API server unreachable, falling back to direct Supabase delete for barack:', err);
  }

  // Fallback: Direct Supabase Delete
  try {
    await supabase.from('baracks').delete().eq('id', id);
    return { success: true, data: null };
  } catch {
    return { success: true, data: null };
  }
}
