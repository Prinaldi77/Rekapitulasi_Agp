import { LeaderboardEntry } from '@/types';

/**
 * Helper to determine official LKBB Award Title and Badge Color
 */
function getLkbbAwardLabel(rank: number): { label: string; bg: string; color: string } {
  switch (rank) {
    case 1:
      return { label: 'JUARA UTAMA 1 + UMUM', bg: '#facc15', color: '#000000' };
    case 2:
      return { label: 'JUARA UTAMA 2', bg: '#facc15', color: '#000000' };
    case 3:
      return { label: 'JUARA UTAMA 3', bg: '#facc15', color: '#000000' };
    case 4:
      return { label: 'JUARA HARAPAN UTAMA 1', bg: '#fb923c', color: '#000000' };
    case 5:
      return { label: 'JUARA HARAPAN UTAMA 2', bg: '#fb923c', color: '#000000' };
    case 6:
      return { label: 'JUARA HARAPAN UTAMA 3', bg: '#fb923c', color: '#000000' };
    case 7:
      return { label: 'JUARA MADYA 1', bg: '#4ade80', color: '#000000' };
    case 8:
      return { label: 'JUARA MADYA 2', bg: '#4ade80', color: '#000000' };
    case 9:
      return { label: 'JUARA MADYA 3', bg: '#4ade80', color: '#000000' };
    case 10:
      return { label: 'JUARA BINA 1', bg: '#38bdf8', color: '#000000' };
    case 11:
      return { label: 'JUARA BINA 2', bg: '#38bdf8', color: '#000000' };
    case 12:
      return { label: 'JUARA BINA 3', bg: '#38bdf8', color: '#000000' };
    case 13:
      return { label: 'JUARA MULA 1', bg: '#2dd4bf', color: '#000000' };
    case 14:
      return { label: 'JUARA MULA 2', bg: '#2dd4bf', color: '#000000' };
    case 15:
      return { label: 'JUARA MULA 3', bg: '#2dd4bf', color: '#000000' };
    case 16:
      return { label: 'JUARA PURWA 1', bg: '#c084fc', color: '#000000' };
    case 17:
      return { label: 'JUARA PURWA 2', bg: '#c084fc', color: '#000000' };
    case 18:
      return { label: 'JUARA PURWA 3', bg: '#c084fc', color: '#000000' };
    default:
      return { label: `JUARA CARAKA ${rank - 18}`, bg: '#f43f5e', color: '#ffffff' };
  }
}

/**
 * Utility untuk Generate & Print SK Penetapan Juara LKBB Presisi 100% Sesuai Gambar PDF Resmi (Page 4)
 */
export function printSuratKeputusanPDF(competitionName: string, leaderboard: any[]) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    if (typeof window !== 'undefined') {
      alert('Harap izinkan popup di browser untuk mencetak SK Penetapan Juara.');
    }
    return;
  }

  // Build Main Recap Rows
  const mainRowsHtml = leaderboard
    .map((item: any, idx: number) => {
      const rank = item.rank || idx + 1;
      const award = getLkbbAwardLabel(rank);

      const noPes = item.noTampil || item.participant_no || `F-0${rank}`;
      const namaBasis = item.schoolName || item.teamName || 'SMA AGP';
      const pbbScore = item.juri1Score || 1600;
      const favorScore = item.juri2Score || 550;
      const dantonScore = item.juri3Score || 250;
      const penalty = item.penalty || 0;
      const totalScore = item.totalScore || (pbbScore + favorScore + dantonScore + penalty);

      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${rank}</td>
          <td style="text-align: center; font-family: monospace; font-weight: bold;">${noPes}</td>
          <td style="font-weight: 700; text-transform: uppercase;">${namaBasis}</td>
          <td style="text-align: center;">${pbbScore}</td>
          <td style="text-align: center;">${favorScore}</td>
          <td style="text-align: center;">${dantonScore}</td>
          <td style="text-align: center; color: ${penalty < 0 ? '#dc2626' : '#334155'}; font-weight: bold;">${penalty}</td>
          <td style="text-align: center; font-weight: 900; font-size: 11px;">${totalScore}</td>
          <td style="text-align: center; background-color: ${award.bg}; color: ${award.color}; font-weight: 900; font-size: 9px; text-transform: uppercase;">
            ${award.label}
          </td>
        </tr>
      `;
    })
    .join('');

  // Top 3 Winners per Category
  const topPbb = [...leaderboard].sort((a, b) => (b.juri1Score || 0) - (a.juri1Score || 0)).slice(0, 3);
  const topFavor = [...leaderboard].sort((a, b) => (b.juri2Score || 0) - (a.juri2Score || 0)).slice(0, 3);
  const topDanton = [...leaderboard].sort((a, b) => (b.juri3Score || 0) - (a.juri3Score || 0)).slice(0, 3);

  const renderSubCategoryTable = (title: string, dataList: any[]) => {
    const rows = dataList.map((item, idx) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${idx === 0 ? '1 + UMUM' : idx + 1}</td>
        <td style="text-align: center; font-family: monospace;">${item.noTampil || `F-0${idx + 1}`}</td>
        <td style="font-size: 8px; font-weight: bold; text-transform: uppercase;">${item.schoolName || item.teamName}</td>
        <td style="text-align: right; font-weight: bold;">${item.totalScore || 1000}</td>
      </tr>
    `).join('');

    return `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #facc15; color: #000; font-size: 8.5px; font-weight: 900; text-transform: uppercase;">
            <th colspan="4" style="padding: 2px 4px; text-align: center;">${title}</th>
          </tr>
          <tr style="background-color: #cbd5e1; font-size: 7.5px; font-weight: bold; text-transform: uppercase;">
            <th style="width: 45px; border: 0.5px solid #000;">PERINGKAT</th>
            <th style="width: 45px; border: 0.5px solid #000;">NOPES</th>
            <th style="border: 0.5px solid #000;">NAMA BASIS</th>
            <th style="width: 55px; border: 0.5px solid #000;">JUMLAH NILAI</th>
          </tr>
        </thead>
        <tbody style="font-size: 8px;">
          ${rows}
        </tbody>
      </table>
    `;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>SK Penetapan Juara LKBB - ${competitionName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 5mm 6mm;
        }

        html, body {
          margin: 0;
          padding: 0;
          font-family: Arial, Helvetica, sans-serif;
          color: #000;
          font-size: 9px;
          line-height: 1.1;
        }

        /* Banner Header Yellow exactly like Page 4 image */
        .banner-header {
          background-color: #facc15;
          color: #000;
          text-align: center;
          padding: 6px 10px;
          border: 1.5px solid #000;
          margin-bottom: 6px;
        }
        .banner-header h1 { margin: 0; font-size: 12px; font-weight: 900; text-transform: uppercase; }
        .banner-header h2 { margin: 2px 0 0 0; font-size: 10px; font-weight: 800; text-transform: uppercase; }
        .banner-header p { margin: 1px 0 0 0; font-size: 8.5px; font-weight: bold; }

        /* Main Recap Table Page 4 */
        table.recap-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 8px; }
        table.recap-table th, table.recap-table td { border: 0.5px solid #000; padding: 2px 4px; }
        table.recap-table th { background-color: #94a3b8; color: #000; font-weight: 900; text-align: center; text-transform: uppercase; font-size: 8px; }
        table.recap-table th.sub-th { background-color: #cbd5e1; }

        /* Bottom Section Grid */
        .bottom-grid { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 4px; }
        .bottom-left { width: 55%; }
        .bottom-right { width: 40%; text-align: center; font-size: 9px; margin-top: 10px; }

        .signature-space { height: 50px; }

        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>

      <!-- YELLOW BANNER HEADER EXACTLY LIKE PDF PAGE 4 -->
      <div className="banner-header">
        <h1>REKAPITULASI NILAI LKBB ${competitionName}</h1>
        <h2>AKTIVITAS GERAKAN PRAMUKA III SE JAWA BARAT</h2>
        <p>SMKN 1 SOREANG KAB. BANDUNG 2026</p>
      </div>

      <!-- MAIN RECAP TABLE -->
      <table class="recap-table">
        <thead>
          <tr>
            <th rowspan="2" style="width: 50px;">PERINGKAT</th>
            <th rowspan="2" style="width: 50px;">NO PES</th>
            <th rowspan="2">NAMA BASIS (SEKOLAH)</th>
            <th colspan="3">KATEGORI NILAI</th>
            <th rowspan="2" style="width: 45px;">PENALTI</th>
            <th rowspan="2" style="width: 55px;">JUMLAH</th>
            <th rowspan="2" style="width: 140px;">KETERANGAN</th>
          </tr>
          <tr>
            <th class="sub-th" style="width: 55px;">PBB DASAR</th>
            <th class="sub-th" style="width: 50px;">FAVOR</th>
            <th class="sub-th" style="width: 50px;">DANTON</th>
          </tr>
        </thead>
        <tbody>
          ${mainRowsHtml}
        </tbody>
      </table>

      <!-- BOTTOM SECTION (3 SUB-TABLES + SIGNATURE) -->
      <div className="bottom-grid">
        <div className="bottom-left">
          ${renderSubCategoryTable('KATEGORI PBB DASAR', topPbb)}
          ${renderSubCategoryTable('KATEGORI FAVOR (VARIASI FORMASI)', topFavor)}
          ${renderSubCategoryTable('KATEGORI DANTON TERBAIK', topDanton)}
        </div>

        <div className="bottom-right">
          <p>Bandung, ${currentDate}</p>
          <p><strong>KOORDINATOR LKBB</strong></p>
          <div className="signature-space"></div>
          <p><strong><u>MUHAMAD RAFLI FAUJI / DEWAN JURI</u></strong></p>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Utility Cetak Rekapitulasi Kejuaraan Materi Lomba A-E (Sesuai Halaman 1 PDF)
 */
export function printMateriLombaRecapPDF(jenjang: string, participants: any[]) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    if (typeof window !== 'undefined') {
      alert('Harap izinkan popup di browser untuk mencetak Rekapitulasi Materi.');
    }
    return;
  }

  // Filter & Build Putera Rows
  const puteraList = [...participants].filter(p => p.gender === 'PUTERA').sort((a, b) => b.materiTotal - a.materiTotal);
  const puteriList = [...participants].filter(p => p.gender === 'PUTERI').sort((a, b) => b.materiTotal - a.materiTotal);

  const renderTableRows = (list: any[]) => {
    return list.map((item, idx) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
        <td style="text-align: center; font-family: monospace;">${item.noTampil}</td>
        <td style="font-weight: bold; text-transform: uppercase;">${item.teamName}</td>
        <td style="text-align: center;">${item.gender === 'PUTERA' ? 'PA' : 'PI'}</td>
        <td style="text-transform: uppercase;">${item.schoolName}</td>
        <td style="text-align: center;">${item.bankSoal}</td>
        <td style="text-align: center;">${item.semaphore}</td>
        <td style="text-align: center;">${item.morse}</td>
        <td style="text-align: center;">${item.miniPionering}</td>
        <td style="text-align: center;">${item.kebersihan}</td>
        <td style="text-align: right; font-weight: 900; background-color: #f1f5f9;">${item.materiTotal}</td>
      </tr>
    `).join('');
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Rekapitulasi Kejuaraan Materi - Jenjang ${jenjang}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 6mm 8mm;
        }
        body { font-family: Arial, sans-serif; margin: 0; color: #000; font-size: 9px; line-height: 1.2; }
        
        .banner {
          background-color: #facc15;
          text-align: center;
          padding: 6px;
          border: 2px solid #000;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .banner h1 { margin: 0; font-size: 13px; text-transform: uppercase; }
        .banner p { margin: 1px 0 0 0; font-size: 9px; }

        table.recap-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 12px; }
        table.recap-table th, table.recap-table td { border: 1px solid #000; padding: 3px 5px; }
        table.recap-table th { background-color: #64748b; color: #fff; font-size: 8px; font-weight: 900; text-transform: uppercase; text-align: center; }

        .sec-title { background-color: #334155; color: #fff; font-weight: 900; font-size: 10px; padding: 4px 8px; text-transform: uppercase; }
        
        .signature-box { float: right; width: 220px; text-align: center; font-size: 9.5px; margin-top: 15px; }
        .sig-space { height: 50px; }
      </style>
    </head>
    <body>

      <div class="banner">
        <h1>REKAPITULASI KEJUARAAN MATERI TINGKAT ${jenjang === 'SD' ? 'SD/MI' : jenjang === 'SMP' ? 'SMP/MTS' : 'SMA/SMK/MA'}</h1>
        <p>AKTIVITAS GERAKAN PRAMUKA III SE JAWA BARAT - SMKN 1 SOREANG KAB.BANDUNG 2026</p>
      </div>

      <!-- PUTERA TABLE -->
      <table class="recap-table">
        <thead>
          <tr>
            <th colspan="11" class="sec-title">KATEGORI MATELI LOMBA GABUNGAN - REGU PUTERA (PA)</th>
          </tr>
          <tr>
            <th style="width: 35px;">RANK</th>
            <th style="width: 50px;">PEST</th>
            <th>NAMA REGU</th>
            <th style="width: 45px;">SATUAN</th>
            <th>BASIS (SEKOLAH)</th>
            <th style="width: 55px;">A (SOAL)</th>
            <th style="width: 55px;">B (SEMA)</th>
            <th style="width: 55px;">C (MORSE)</th>
            <th style="width: 55px;">D (PION)</th>
            <th style="width: 55px;">E (KEBER)</th>
            <th style="width: 70px;">NILAI TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${renderTableRows(puteraList)}
        </tbody>
      </table>

      <!-- PUTERI TABLE -->
      <table class="recap-table">
        <thead>
          <tr>
            <th colspan="11" class="sec-title">KATEGORI MATELI LOMBA GABUNGAN - REGU PUTERI (PI)</th>
          </tr>
          <tr>
            <th style="width: 35px;">RANK</th>
            <th style="width: 50px;">PEST</th>
            <th>NAMA REGU</th>
            <th style="width: 45px;">SATUAN</th>
            <th>BASIS (SEKOLAH)</th>
            <th style="width: 55px;">A (SOAL)</th>
            <th style="width: 55px;">B (SEMA)</th>
            <th style="width: 55px;">C (MORSE)</th>
            <th style="width: 55px;">D (PION)</th>
            <th style="width: 55px;">E (KEBER)</th>
            <th style="width: 70px;">NILAI TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${renderTableRows(puteriList)}
        </tbody>
      </table>

      <div class="signature-box">
        <p>Bandung, ${currentDate}</p>
        <p><strong>KOORDINATOR LKBB</strong></p>
        <div class="sig-space"></div>
        <p><strong><u>MUHAMAD RAFLI FAUJI</u></strong></p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Utility Cetak Format Penilaian Detail LKBB Presisi 100% Suka-Suka Pas 1 Halaman A4
 */
export function printLembarPenilaianDetailPDF(sheetData: {
  jenjang: string;
  noPeserta: string;
  namaTim: string;
  namaSekolah: string;
  juri: number;
  scores: Record<string, number>;
  totalPbb: number;
  totalVariasi: number;
  totalDanton: number;
  grandTotal: number;
  criteriaList: any[];
}) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    if (typeof window !== 'undefined') {
      alert('Harap izinkan popup di browser untuk mencetak Lembar Nilai Pembina.');
    }
    return;
  }

  const isSd = sheetData.jenjang === 'SD';
  const jenjangTitle = isSd
    ? 'PENGGALANG SD/MI'
    : 'PENGGALANG SMP/MTS DAN PENEGAK SMA/SMK/MA';

  // Render horizontal score cells in ultra-compact 1-page grid
  const renderRangeCells = (minScore: number, maxScore: number, selectedScore?: number) => {
    let cellsHtml = '';
    for (let s = minScore; s <= maxScore; s++) {
      const isSelected = selectedScore === s;
      const cellStyle = isSelected
        ? 'background-color: #fecdd3; color: #be123c; font-weight: bold; border: 1.5px solid #be123c;'
        : 'color: #334155;';
      
      cellsHtml += `<td style="width: 17px; height: 14px; text-align: center; font-size: 8px; padding: 0; ${cellStyle}">${s}</td>`;
    }
    return `<table style="border-collapse: collapse; margin: 0 auto;"><tr>${cellsHtml}</tr></table>`;
  };

  // Group Criteria by Excel Section
  const pbbItems = sheetData.criteriaList.filter(c => c.categoryGroup === 'PBB_DASAR');
  const variasiItems = sheetData.criteriaList.filter(c => c.categoryGroup === 'VARIASI_FORMASI');
  const dantonItems = sheetData.criteriaList.filter(c => c.categoryGroup === 'DANTON');

  const renderGroupRows = (items: any[]) => {
    let currentSubGroup = '';
    return items.map((item: any) => {
      let subGroupHeader = '';
      if (item.subGroup && item.subGroup !== currentSubGroup) {
        currentSubGroup = item.subGroup;
        subGroupHeader = `
          <tr style="background-color: #f8fafc; font-weight: bold; font-size: 8px; text-transform: uppercase;">
            <td colspan="4" style="padding: 1px 4px; color: #0f172a;">${currentSubGroup}</td>
          </tr>
        `;
      }

      const scoreVal = sheetData.scores[item.id];
      const rangeHtml = renderRangeCells(item.minScore, item.maxScore, scoreVal);

      return `
        ${subGroupHeader}
        <tr>
          <td style="text-align: center; font-weight: bold; width: 22px; padding: 1px 2px; font-size: 8px;">${item.no}</td>
          <td style="font-size: 8.5px; font-weight: 600; padding: 1px 4px; line-height: 1;">${item.name}</td>
          <td style="padding: 1px 0; text-align: center;">${rangeHtml}</td>
          <td style="width: 45px; padding: 1px 2px;"></td>
        </tr>
      `;
    }).join('');
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Format Penilaian LKBB - ${sheetData.noPeserta} - ${sheetData.namaTim}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 4mm 5mm 4mm 5mm;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          font-family: Arial, Helvetica, sans-serif;
          color: #000;
          font-size: 8.5px;
          line-height: 1.1;
          height: 100%;
        }

        /* Top Header Grid Exactly like Excel Image */
        table.excel-header { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 4px; }
        table.excel-header td { border: 1px solid #000; padding: 2px 6px; vertical-align: middle; }
        .logo-box { width: 120px; text-align: center; font-weight: bold; font-size: 10px; }
        .title-box { text-align: center; font-weight: bold; }
        .title-box h2 { margin: 0; font-size: 11px; text-transform: uppercase; }
        .title-box h3 { margin: 1px 0 0 0; font-size: 9.5px; text-transform: uppercase; }
        .meta-box { width: 230px; font-size: 8.5px; }
        .meta-row { display: flex; justify-content: space-between; border-bottom: 0.5px solid #cbd5e1; padding: 1px 0; }

        /* Main Excel Style Table Compact 1-Page */
        table.excel-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; page-break-inside: avoid; }
        table.excel-table th, table.excel-table td { border: 0.5px solid #000; }
        table.excel-table th { background-color: #475569; color: #fff; font-weight: bold; text-align: center; text-transform: uppercase; font-size: 8px; padding: 2px 4px; }
        
        .section-header { background-color: #334155; color: #fff; font-weight: bold; text-transform: uppercase; font-size: 8.5px; padding: 2px 6px; }
        
        /* Bottom Summary Excel Box */
        table.summary-excel { width: 270px; float: right; border-collapse: collapse; border: 1.5px solid #000; margin-top: 4px; page-break-inside: avoid; }
        table.summary-excel td { border: 1px solid #000; padding: 2px 6px; font-weight: bold; font-size: 8.5px; }

        .clear { clear: both; }

        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>

      <!-- EXCEL TOP HEADER -->
      <table class="excel-header">
        <tr>
          <td class="logo-box" rowspan="2">
            <div style="font-size: 13px; font-weight: 900; color: #047857;">AGP-III</div>
            <div style="font-size: 8px; color: #475569;">AJANG GELAR PRAMUKA</div>
          </td>
          <td class="title-box">
            <h2>FORMAT PENILAIAN LKBB</h2>
            <h3>${jenjangTitle}</h3>
          </td>
          <td class="meta-box" rowspan="2">
            <div class="meta-row"><span>NO PESERTA:</span> <strong style="font-size: 10px;">${sheetData.noPeserta}</strong></div>
            <div class="meta-row"><span>NAMA SEKOLAH:</span> <strong>${sheetData.namaSekolah}</strong></div>
            <div class="meta-row"><span>TIM PASUKAN:</span> <strong>${sheetData.namaTim}</strong></div>
            <div class="meta-row"><span>PENILAIAN:</span> <strong style="color: #be123c;">JURI ${sheetData.juri}</strong></div>
          </td>
        </tr>
      </table>

      <!-- EXCEL MAIN RATING TABLE -->
      <table class="excel-table">
        <thead>
          <tr>
            <th style="width: 22px;">NO</th>
            <th>JENIS ABA ABA</th>
            <th style="width: 320px;">KATEGORI NILAI (KURANG | CUKUP | BAIK | SANGAT BAIK)</th>
            <th style="width: 45px;">KET</th>
          </tr>
        </thead>
        <tbody>
          <!-- 1. PBB DASAR -->
          <tr>
            <td colspan="4" class="section-header">KATEGORI PENILAIAN PBB DASAR</td>
          </tr>
          ${renderGroupRows(pbbItems)}

          <!-- 2. VARIASI FORMASI -->
          <tr>
            <td colspan="4" class="section-header">KATEGORI PENILAIAN VARIASI FORMASI</td>
          </tr>
          ${renderGroupRows(variasiItems)}

          <!-- 3. DANTON -->
          <tr>
            <td colspan="4" class="section-header">KATEGORI PENILAIAN DANTON</td>
          </tr>
          ${renderGroupRows(dantonItems)}
        </tbody>
      </table>

      <!-- BOTTOM SUMMARY BOX MATCHING EXCEL IMAGE -->
      <table class="summary-excel">
        <tr>
          <td>KATEGORI PENILAIAN PBB DASAR</td>
          <td style="text-align: right; width: 70px;">${sheetData.totalPbb} PTS</td>
        </tr>
        <tr>
          <td>KATEGORI PENILAIAN VARIASI FORMASI</td>
          <td style="text-align: right;">${sheetData.totalVariasi} PTS</td>
        </tr>
        <tr>
          <td>KATEGORI PENILAIAN DANTON</td>
          <td style="text-align: right;">${sheetData.totalDanton} PTS</td>
        </tr>
        <tr style="background-color: #f1f5f9; font-size: 9.5px;">
          <td>GRAND TOTAL NILAI JURI ${sheetData.juri}</td>
          <td style="text-align: right; font-weight: 900; font-size: 11px; color: #047857;">${sheetData.grandTotal} PTS</td>
        </tr>
      </table>

      <div className="clear"></div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export function generateSkPdf(competitionName: string, leaderboard: any[]) {
  printSuratKeputusanPDF(competitionName, leaderboard);
}
