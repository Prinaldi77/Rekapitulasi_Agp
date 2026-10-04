import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { ApiResponse } from '../types';

export interface BarackItemPayload {
  participant_id?: string;
  no_tampil?: string;
  team_name: string;
  school_name: string;
  room_name: string;
  building: string;
  floor?: string;
}

/**
 * GET /api/baracks
 * Fetch all barack allocations
 */
export const getBaracks = async (
  req: Request,
  res: Response<ApiResponse<any[]>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('baracks')
      .select('*, participant:participants(*, category:categories(*))');

    if (error) {
      console.error('Supabase DB error fetching baracks:', error.message);
      res.status(500).json({
        success: false,
        message: `Gagal mengambil data barack: ${error.message}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Data pembagian barack berhasil diambil',
      data: data || [],
    });
  } catch (err: any) {
    next(err);
  }
};

/**
 * POST /api/baracks
 * Create a new barack allocation
 */
export const createBarack = async (
  req: Request<{}, {}, BarackItemPayload>,
  res: Response<ApiResponse<any>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { team_name, school_name, room_name, building, no_tampil } = req.body;

    if (!team_name || !room_name || !building) {
      res.status(400).json({
        success: false,
        message: 'Validasi gagal: Nama tim, nama ruangan, dan gedung wajib diisi.',
      });
      return;
    }

    // Resolve participant_id (UUID)
    let participantId = req.body.participant_id;
    if (!participantId || participantId.length < 36) {
      // Find participant by no_tampil / participant_no
      const { data: part } = await supabase
        .from('participants')
        .select('id')
        .eq('participant_no', no_tampil)
        .limit(1)
        .maybeSingle();

      if (part) {
        participantId = part.id;
      } else {
        // Create participant dynamically if not found
        const level = req.body.floor?.includes('SD') ? 'SD' : 'SMA'; // basic heuristic or default
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('level', level)
          .limit(1)
          .maybeSingle();

        const categoryId = cat?.id || 'c1111111-1111-1111-1111-111111111111';

        const { data: newPart, error: partErr } = await supabase
          .from('participants')
          .insert({
            participant_no: no_tampil || `T-${Date.now()}`,
            team_name,
            school_name: school_name || '',
            category_id: categoryId,
            show_number: Math.floor(Math.random() * 100) + 1
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
      .from('baracks')
      .upsert({
        participant_id: participantId,
        room_name,
        building,
        floor: req.body.floor || 'Lantai 1',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'participant_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase DB error createBarack:', error.message);
      res.status(500).json({
        success: false,
        message: `Gagal menyimpan alokasi barack: ${error.message}`,
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Alokasi barack baru berhasil disimpan di database!',
      data,
    });
  } catch (err: any) {
    next(err);
  }
};

/**
 * DELETE /api/baracks/:id
 * Delete a barack allocation
 */
export const deleteBarack = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<null>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('baracks').delete().eq('id', id);

    if (error) {
      console.error('Supabase DB delete barack:', error.message);
      res.status(500).json({
        success: false,
        message: `Gagal menghapus alokasi barack: ${error.message}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Alokasi barack ID ${id} berhasil dihapus!`,
      data: null,
    });
  } catch (err: any) {
    next(err);
  }
};
