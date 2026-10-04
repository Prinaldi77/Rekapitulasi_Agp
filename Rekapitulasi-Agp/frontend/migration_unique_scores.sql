-- ============================================================
-- MIGRATION: Tambah Unique Constraint pada Tabel Scores
-- Tujuan: Mencegah duplikasi nilai juri untuk peserta + 
--         kriteria yang sama, meskipun 2 operator menginput
--         data yang identik secara bersamaan.
-- ============================================================

-- Langkah 1: Hapus terlebih dahulu data duplikat yang mungkin
-- sudah ada sebelum constraint diterapkan (jaga-jaga)
DELETE FROM scores
WHERE id NOT IN (
  SELECT DISTINCT ON (participant_id, criterion_id) id
  FROM scores
  ORDER BY participant_id, criterion_id, created_at DESC
);

-- Langkah 2: Tambahkan Unique Constraint
ALTER TABLE scores
ADD CONSTRAINT unique_score_per_participant_criterion
UNIQUE (participant_id, criterion_id);

-- Verifikasi: Tampilkan constraint yang berhasil ditambahkan
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE
  tc.table_name = 'scores'
  AND tc.constraint_type = 'UNIQUE';
