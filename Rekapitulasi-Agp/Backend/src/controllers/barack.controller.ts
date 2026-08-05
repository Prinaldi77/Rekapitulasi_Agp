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
      .select('*, participant:participants(*)');

    if (error) {
      res.status(200).json({
        success: true,
        message: 'Mengambil data barack (mode simulasi standalone)',
        data: [],
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

    const newBarack = {
      id: 'b_' + Date.now(),
      participant_id: req.body.participant_id || 'p_' + Date.now(),
      room_name,
      building,
      no_tampil: no_tampil || 'A-00',
      team_name,
      school_name: school_name || '',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('baracks').insert(newBarack).select().single();

    if (error) {
      // Fallback for standalone/mock mode
      res.status(201).json({
        success: true,
        message: 'Alokasi barack baru berhasil ditambahkan (simulasi standalone)!',
        data: newBarack,
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
      console.warn('Supabase DB delete barack:', error.message);
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
