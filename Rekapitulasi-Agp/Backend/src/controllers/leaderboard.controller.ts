import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { ApiResponse, LeaderboardItemResponse, Participant, ParticipantScore, AssessmentItem } from '../types';

/**
 * Controller: GET /api/leaderboard/:categoryId
 * Aggregates participant scores across judges and applies tie-breaker algorithm:
 * 1. Highest Grand Total
 * 2. Tie-Breaker 1: Highest PBB_DASAR Score
 * 3. Tie-Breaker 2: Highest DANTON Score
 */
export const getLeaderboard = async (
  req: Request<{ categoryId: string }>,
  res: Response<ApiResponse<LeaderboardItemResponse[]>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      res.status(400).json({
        success: false,
        message: 'Validasi gagal: Parameter categoryId wajib disi.',
      });
      return;
    }

    // 1. Ambil Data Peserta dalam Kategori
    const { data: participantsData } = await supabase
      .from('participants')
      .select('*')
      .eq('category_id', categoryId)
      .order('show_number', { ascending: true });

    const participants: Participant[] = participantsData || [];

    if (participants.length === 0) {
      res.status(200).json({
        success: true,
        message: 'Belum ada data peserta untuk kategori ini.',
        data: [],
      });
      return;
    }

    // 2. Ambil Assessment Items Kategori untuk Mapping Group Type
    const { data: itemsData } = await supabase
      .from('criteria')
      .select('*')
      .eq('category_id', categoryId);

    const items: AssessmentItem[] = itemsData || [];
    const itemGroupMap = new Map<string, 'PBB_DASAR' | 'VARIASI_FORMASI' | 'DANTON'>(
      items.map((it) => [it.id, it.group_type])
    );

    // 3. Ambil Semua Skor Peserta
    const participantIds = participants.map((p) => p.id);
    const { data: scoresData } = await supabase
      .from('scores')
      .select('*')
      .in('participant_id', participantIds);

    const scores: ParticipantScore[] = scoresData || [];

    // Grouping Skor per Peserta
    const scoresByParticipant = new Map<string, ParticipantScore[]>();
    scores.forEach((sc) => {
      const list = scoresByParticipant.get(sc.participant_id) || [];
      list.push(sc);
      scoresByParticipant.set(sc.participant_id, list);
    });

    // 4. Hitung Total & Group Totals per Peserta
    const rawLeaderboard: Omit<LeaderboardItemResponse, 'rank' | 'badge'>[] = participants.map((p) => {
      const pScores = scoresByParticipant.get(p.id) || [];

      let pbbTotal = 0;
      let variasiTotal = 0;
      let dantonTotal = 0;

      pScores.forEach((sc) => {
        const val = sc.score_value || 0;
        const group = itemGroupMap.get(sc.criterion_id);

        if (group === 'PBB_DASAR') pbbTotal += val;
        else if (group === 'VARIASI_FORMASI') variasiTotal += val;
        else if (group === 'DANTON') dantonTotal += val;
      });

      const grandTotal = pbbTotal + variasiTotal + dantonTotal;

      return {
        participantId: p.id,
        participantNo: p.participant_no,
        teamName: p.team_name,
        schoolName: p.school_name,
        pbbTotal,
        variasiTotal,
        dantonTotal,
        grandTotal,
      };
    });

    // 5. Algoritma Tie-Breaker Sorting:
    // Sort 1: Grand Total -> Sort 2: PBB_DASAR -> Sort 3: DANTON
    rawLeaderboard.sort((a, b) => {
      // Primary: Grand Total Score
      if (b.grandTotal !== a.grandTotal) {
        return b.grandTotal - a.grandTotal;
      }
      // Secondary (Tie-Breaker 1): PBB_DASAR
      if (b.pbbTotal !== a.pbbTotal) {
        (a as any).isTieBroken = true;
        (b as any).isTieBroken = true;
        return b.pbbTotal - a.pbbTotal;
      }
      // Tertiary (Tie-Breaker 2): DANTON
      if (b.dantonTotal !== a.dantonTotal) {
        (a as any).isTieBroken = true;
        (b as any).isTieBroken = true;
        return b.dantonTotal - a.dantonTotal;
      }
      // Quaternary: VARIASI_FORMASI
      return b.variasiTotal - a.variasiTotal;
    });

    // 6. Tetapkan Peringkat & Badge Emas, Perak, Perunggu
    const rankedData: LeaderboardItemResponse[] = rawLeaderboard.map((item, index) => {
      const rank = index + 1;
      let badge: 'Gold' | 'Silver' | 'Bronze' | null = null;
      if (rank === 1) badge = 'Gold';
      else if (rank === 2) badge = 'Silver';
      else if (rank === 3) badge = 'Bronze';

      return {
        ...item,
        rank,
        badge,
      };
    });

    res.status(200).json({
      success: true,
      message: `Papan peringkat berhasil dikalkulasi untuk ${rankedData.length} peserta.`,
      data: rankedData,
    });
  } catch (err: any) {
    next(err);
  }
};
