import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { ApiResponse, PublishStatusPayload } from '../types';

/**
 * Controller: PATCH /api/publish/:categoryId
 * Toggles the 'is_published' column in categories table to lock or publish public leaderboard results.
 */
export const togglePublishStatus = async (
  req: Request<{ categoryId: string }, {}, PublishStatusPayload>,
  res: Response<ApiResponse<{ isPublished: boolean }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { isPublished } = req.body;

    if (!categoryId) {
      res.status(400).json({
        success: false,
        message: 'Validasi gagal: Parameter categoryId wajib diisi.',
      });
      return;
    }

    if (typeof isPublished !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'Validasi gagal: Payload isPublished harus berupa boolean (true / false).',
      });
      return;
    }

    const { error } = await supabase
      .from('categories')
      .update({ is_published: isPublished })
      .eq('id', categoryId);

    if (error) {
      console.error('Supabase DB error updating publish status:', error.message);
      res.status(500).json({
        success: false,
        message: `Gagal memperbarui status publikasi: ${error.message}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: isPublished
        ? 'Pengumuman Juara berhasil DIPUBLIKASIKAN ke Portal Publik Peserta! 🚀'
        : 'Status Penilaian berhasil DITUTUP / DITERKUNCI untuk Publik. 🔒',
      data: { isPublished },
    });
  } catch (err: any) {
    next(err);
  }
};
