'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button, Badge } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';

interface OcrScore {
  criteriaName: string;
  value: number;
}

interface OcrResult {
  scores: OcrScore[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}

interface ScoreOcrUploaderProps {
  criteriaNames?: string[];
  onConfirm: (scores: OcrScore[]) => void;
  onClose: () => void;
}

const confidenceConfig = {
  HIGH:   { label: 'Kepercayaan Tinggi', emoji: '✅', cls: 'bg-green-50 border-green-200 text-green-700' },
  MEDIUM: { label: 'Perlu Diperiksa',    emoji: '⚠️', cls: 'bg-amber-50 border-amber-200 text-amber-700' },
  LOW:    { label: 'Banyak Nilai Meragukan', emoji: '❌', cls: 'bg-red-50 border-red-200 text-red-700' },
};

export default function ScoreOcrUploader({ criteriaNames = [], onConfirm, onClose }: ScoreOcrUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType]       = useState<string>('image/jpeg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult]     = useState<OcrResult | null>(null);
  const [editedScores, setEditedScores] = useState<OcrScore[]>([]);
  const [error, setError]             = useState<string | null>(null);
  const [isDragging, setIsDragging]   = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { setError('File harus berupa gambar (JPG, PNG, WEBP).'); return; }
    if (file.size > 10 * 1024 * 1024)   { setError('Ukuran gambar maksimal 10 MB.'); return; }
    setError(null); setOcrResult(null); setEditedScores([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      setImageBase64(result.split(',')[1]);
      setMimeType(file.type);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleScan = async () => {
    if (!imageBase64) return;
    setIsProcessing(true); setError(null); setOcrResult(null);
    try {
      const res  = await fetch('/api/ocr-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType, criteriaNames }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Gagal memproses gambar.');
      const result: OcrResult = json.data;
      setOcrResult(result);
      setEditedScores(result.scores.map(s => ({ ...s })));
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScoreEdit = (index: number, val: string) => {
    const num = parseFloat(val);
    setEditedScores(prev => prev.map((s, i) => i === index ? { ...s, value: isNaN(num) ? 0 : num } : s));
  };

  const handleConfirm = () => { onConfirm(editedScores); onClose(); };
  const confidenceInfo = ocrResult ? confidenceConfig[ocrResult.confidence] : null;

  return (
    <div className="flex flex-col gap-5 max-h-[80vh] overflow-y-auto pr-1">

      {/* Step 1 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="primary" className="text-[9px] font-black">LANGKAH 1</Badge>
          <span className="text-xs font-bold text-green-800">Foto / Unggah Lembar Nilai Juri</span>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 py-8 ${
            isDragging ? 'border-green-500 bg-green-50' : 'border-green-200 hover:border-green-400 bg-green-50/30'
          }`}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="max-h-64 rounded-lg object-contain shadow" />
          ) : (
            <>
              <span className="text-4xl">📷</span>
              <div className="text-center">
                <p className="text-sm font-bold text-green-800">Klik atau seret foto ke sini</p>
                <p className="text-xs text-green-600/60 mt-1">JPG, PNG, WEBP — Maksimal 10 MB</p>
              </div>
            </>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
        {previewUrl && (
          <button onClick={() => { setPreviewUrl(null); setImageBase64(null); setOcrResult(null); setEditedScores([]); setError(null); }}
            className="mt-2 text-xs text-red-500 hover:text-red-700 font-semibold">
            🗑️ Hapus & Upload Ulang
          </button>
        )}
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
          ❌ {error}
        </motion.div>
      )}

      {/* Step 2 */}
      {imageBase64 && !ocrResult && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="warning" className="text-[9px] font-black">LANGKAH 2</Badge>
            <span className="text-xs font-bold text-green-800">Scan & Ekstrak Nilai Otomatis</span>
          </div>
          <Button variant="primary" onClick={handleScan} isLoading={isProcessing} className="w-full font-black text-sm">
            {isProcessing ? '🤖 Gemini AI sedang membaca lembar nilai...' : '🤖 Scan Lembar Nilai dengan AI'}
          </Button>
          {isProcessing && (
            <p className="text-[11px] text-green-600/70 text-center mt-2 animate-pulse">
              Proses ini membutuhkan waktu 5–15 detik...
            </p>
          )}
        </motion.div>
      )}

      {/* Step 3 */}
      <AnimatePresence>
        {ocrResult && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-[9px] font-black">LANGKAH 3</Badge>
              <span className="text-xs font-bold text-green-800">Verifikasi & Koreksi Nilai</span>
            </div>

            {confidenceInfo && (
              <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${confidenceInfo.cls}`}>
                <span>{confidenceInfo.emoji}</span>
                <span>Tingkat Kepercayaan AI: <strong>{confidenceInfo.label}</strong></span>
              </div>
            )}

            {ocrResult.notes && (
              <p className="text-[11px] text-green-700/80 bg-green-50 rounded-lg px-3 py-2 border border-green-100">
                💬 Catatan AI: {ocrResult.notes}
              </p>
            )}

            <div className="space-y-2">
              {editedScores.map((score, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-green-50/60 border border-green-100 hover:border-green-200 transition-colors">
                  <span className="flex-1 text-xs font-semibold text-green-900 truncate">{score.criteriaName}</span>
                  <input
                    type="number" min={0} max={100} value={score.value}
                    onChange={e => handleScoreEdit(idx, e.target.value)}
                    className="w-20 text-center px-2 py-1.5 rounded-lg bg-white border border-green-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-green-900 text-sm font-black transition-all"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2 border-t border-green-100">
              <Button variant="outline" size="sm" onClick={onClose} className="flex-1 text-xs font-bold">Batal</Button>
              <Button variant="primary" size="sm" onClick={handleConfirm} className="flex-1 text-xs font-bold">✅ Konfirmasi & Terapkan</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
