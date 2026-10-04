import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { ApiResponse, UpdateScheduleStatusPayload, ShowStatus } from '../types';

export interface ScheduleItemPayload {
  participant_id?: string;
  no_tampil?: number;
  participant_no: string;
  team_name: string;
  school_name: string;
  category: string;
  jenjang: 'SD' | 'SMP' | 'SMA';
  time_slot: string;
  status?: ShowStatus;
}

/**
 * GET /api/schedules
 * Fetch all schedules with participant data
 */
export const getSchedules = async (
  req: Request,
  res: Response<ApiResponse<any[]>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*, participant:participants(*, category:categories(*))');

    if (error) {
      console.error('Supabase DB error fetching schedules:', error.message);
      res.status(500).json({
        success: false,
        message: `Gagal mengambil data jadwal: ${error.message}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Data urutan tampil berhasil diambil',
      data: data || [],
    });
  } catch (err: any) {
    next(err);
  }
};

/**
 * POST /api/schedules
 * Create or update a schedule allocation (resolving participant first)
 */
export const createSchedule = async (
  req: Request<{}, {}, ScheduleItemPayload>,
  res: Response<ApiResponse<any>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { team_name, school_name, participant_no, category, jenjang, time_slot, status } = req.body;

    if (!team_name || !school_name) {
      res.status(400).json({
        success: false,
        message: 'Validasi gagal: Nama tim dan sekolah wajib diisi.',
      });
      return;
    }

    // Resolve participant_id (UUID)
    let participantId = req.body.participant_id;
    if (!participantId || participantId.length < 36) {
      // Find participant by participant_no
      const { data: part } = await supabase
        .from('participants')
        .select('id')
        .eq('participant_no', participant_no)
        .limit(1)
        .maybeSingle();

      if (part) {
        participantId = part.id;
      } else {
        // Find category
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('level', jenjang || 'SMA')
          .limit(1)
          .maybeSingle();

        const categoryId = cat?.id || 'c1111111-1111-1111-1111-111111111111';

        const { data: newPart, error: partErr } = await supabase
          .from('participants')
          .insert({
            participant_no: participant_no || `T-${Date.now()}`,
            team_name,
            school_name,
            category_id: categoryId,
            show_number: req.body.no_tampil || Math.floor(Math.random() * 100) + 1
          })
          .select()
          .single();

        if (partErr) {
          throw partErr;
        }
        participantId = newPart.id;
      }
    }

    const { data, error } = await supabase
      .from('schedules')
      .upsert({
        participant_id: participantId,
        status: status || 'WAITING',
        time_slot: time_slot || '09:00 - 09:20',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'participant_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase DB error createSchedule:', error.message);
      res.status(500).json({
        success: false,
        message: `Gagal menyimpan jadwal tampil: ${error.message}`,
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Jadwal tampil berhasil disimpan di database!',
      data,
    });
  } catch (err: any) {
    next(err);
  }
};

/**
 * Controller: PATCH /api/schedules/status
 * Updates schedule status ('WAITING' | 'PERFORMING' | 'COMPLETED') for live status displays on mobile user screens.
 */
export const updateScheduleStatus = async (
  req: Request<{}, {}, UpdateScheduleStatusPayload>,
  res: Response<ApiResponse<{ participantId: string; status: ShowStatus }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { participantId, status } = req.body;

    if (!participantId) {
      res.status(400).json({
        success: false,
        message: 'Validasi gagal: ID Peserta (participantId) wajib diisi.',
      });
      return;
    }

    const validStatuses: ShowStatus[] = ['WAITING', 'STANDBY', 'NEXT', 'NOW PERFORMING', 'COMPLETED'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Validasi gagal: Status harus salah satu dari: ${validStatuses.join(', ')}.`,
      });
      return;
    }

    const { error } = await supabase
      .from('schedules')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('participant_id', participantId);

    if (error) {
      console.error('Supabase DB error updating schedule status:', error.message);
      res.status(500).json({
        success: false,
        message: `Gagal memperbarui status jadwal: ${error.message}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Status urutan tampil peserta berhasil diperbarui menjadi '${status}'!`,
      data: { participantId, status },
    });
  } catch (err: any) {
    next(err);
  }
};

/**
 * DELETE /api/schedules/:id
 * Delete a schedule allocation
 */
export const deleteSchedule = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<null>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('schedules').delete().eq('id', id);

    if (error) {
      console.error('Supabase DB delete schedule:', error.message);
      res.status(500).json({
        success: false,
        message: `Gagal menghapus jadwal tampil: ${error.message}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Jadwal tampil ID ${id} berhasil dihapus!`,
      data: null,
    });
  } catch (err: any) {
    next(err);
  }
};
