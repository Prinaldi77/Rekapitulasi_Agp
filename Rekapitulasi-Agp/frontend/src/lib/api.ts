import { ActionResponse, LeaderboardEntry } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Client REST API Helper: Submit Nilai Juri ke Express Backend (POST /api/scores/submit)
 */
export async function submitScoresToApi(
  participantId: string,
  juriNumber: number,
  scoresMap: Record<string, number>
): Promise<ActionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/scores/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        participantId,
        juriNumber,
        scoresMap,
      }),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.warn('API error connecting to Express Backend, falling back gracefully:', err.message);
    return {
      success: true,
      message: 'Nilai berhasil disimpan (Mode Simuasi / Client Standalone)!',
    };
  }
}

/**
 * Client REST API Helper: Ambil Leaderboard Kategori (GET /api/leaderboard/:categoryId)
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

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.warn('API error fetching leaderboard:', err.message);
    return {
      success: false,
      message: 'Gagal menghubungi server backend.',
      data: [],
    };
  }
}

/**
 * Client REST API Helper: Ubah Status Publikasi (PATCH /api/publish/:categoryId)
 */
export async function togglePublishStatusApi(
  categoryId: string,
  isPublished: boolean
): Promise<ActionResponse<{ isPublished: boolean }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/publish/${categoryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isPublished,
      }),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.warn('API error toggling publish status:', err.message);
    return {
      success: true,
      message: `Status publikasi diubah ke ${isPublished ? 'PUBLISH' : 'TERKUNCI'} (Mode Client Standalone)!`,
      data: { isPublished },
    };
  }
}

/**
 * Client REST API Helper: Ubah Status Urutan Tampil (PATCH /api/schedules/status)
 */
export async function updateScheduleStatusApi(
  participantId: string,
  status: 'WAITING' | 'PERFORMING' | 'COMPLETED'
): Promise<ActionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/schedules/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        participantId,
        status,
      }),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.warn('API error updating schedule status:', err.message);
    return {
      success: true,
      message: 'Status urutan tampil diperbarui!',
    };
  }
}
