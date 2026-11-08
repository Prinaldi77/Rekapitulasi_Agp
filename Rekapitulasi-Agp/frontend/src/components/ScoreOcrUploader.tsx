'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button, Badge } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Trash2, ScanLine, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

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
  HIGH: {
    label: 'Kepercayaan Tinggi',
    icon: <CheckCircle2 className="w-4 h-4 text-[#E3EF26] shrink-0" />,
    cls: 'bg-[#061C18] border-[#E3EF26]/40 text-[#E3EF26]',
  },
  MEDIUM: {
    label: 'Perlu Diperiksa',
    icon: <AlertTriangle className="w-4 h-4 text-[#ffd166] shrink-0" />,
    cls: 'bg-[#076653] border-[#ffd166]/40 text-[#ffd166]',
  },
  LOW: {
    label: 'Banyak Nilai Meragukan',
    icon: <XCircle className="w-4 h-4 text-[#E3EF26] shrink-0" />,
    cls: 'bg-[#076653] border-[#E3EF26]/40 text-[#E3EF26]',
  },
};

export default function ScoreOcrUploader({ criteriaNames = [], onConfirm, onClose }: ScoreOcrUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [editedScores, setEditedScores] = useState<OcrScore[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 10 MB.');
      return;
    }
    setError(null);
    setOcrResult(null);
    setEditedScores([]);
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
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleScan = async () => {
    if (!imageBase64) return;
    setIsProcessing(true);
    setError(null);
    setOcrResult(null);
    try {
      const res = await fetch('/api/ocr-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType, criteriaNames }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Gagal memproses gambar.');
      const result: OcrResult = json.data;
      setOcrResult(result);
      setEditedScores(result.scores.map((s) => ({ ...s })));
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScoreEdit = (index: number, val: string) => {
    const num = parseFloat(val);
    setEditedScores((prev) => prev.map((s, i) => (i === index ? { ...s, value: isNaN(num) ? 0 : num } : s)));
  };

  const handleConfirm = () => {
    onConfirm(editedScores);
    onClose();
  };
  const confidenceInfo = ocrResult ? confidenceConfig[ocrResult.confidence] : null;

  return (
    <div className="flex flex-col gap-5 max-h-[80vh] overflow-y-auto pr-1">
      {/* Step 1 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="primary">LANGKAH 01</Badge>
          <span className="text-xs font-medium text-[#ffffff]">Foto / Unggah Lembar Nilai Juri</span>
        </div>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full rounded-[12px] border border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 py-8 ${
            isDragging
              ? 'border-[#E3EF26] bg-[#076653]/30'
              : 'border-[#076653] hover:border-[#B8D8D0] bg-[#061C18]'
          }`}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Preview Lembar Nilai" className="max-h-64 rounded-[8px] object-contain" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-[#076653] border border-[#076653] flex items-center justify-center text-[#E3EF26]">
                <Camera className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#ffffff]">Klik atau seret foto lembar nilai ke sini</p>
                <p className="text-xs font-mono text-[#7AA89C] mt-1">JPG, PNG, WEBP — MAKS 10 MB</p>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
        {previewUrl && (
          <button
            type="button"
            onClick={() => {
              setPreviewUrl(null);
              setImageBase64(null);
              setOcrResult(null);
              setEditedScores([]);
              setError(null);
            }}
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-mono text-[#E3EF26] hover:underline cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Hapus &amp; Unggah Ulang
          </button>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-[8px] bg-[#076653] border border-[#E3EF26]/40 text-[#E3EF26] text-xs font-medium"
        >
          {error}
        </motion.div>
      )}

      {/* Step 2 */}
      {imageBase64 && !ocrResult && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="danger">LANGKAH 02</Badge>
            <span className="text-xs font-medium text-[#ffffff]">Ekstrak Angka Nilai Otomatis</span>
          </div>
          <Button variant="primary" onClick={handleScan} isLoading={isProcessing} className="w-full gap-2">
            <ScanLine className="w-4 h-4" />
            <span>{isProcessing ? 'Sistem sedang memproses lembar nilai...' : 'Scan & Ekstrak Nilai OCR'}</span>
          </Button>
        </motion.div>
      )}

      {/* Step 3 */}
      <AnimatePresence>
        {ocrResult && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <Badge variant="success">LANGKAH 03</Badge>
              <span className="text-xs font-medium text-[#ffffff]">Verifikasi &amp; Koreksi Nilai</span>
            </div>

            {confidenceInfo && (
              <div className={`p-3 rounded-[8px] border text-xs font-medium flex items-center gap-2 ${confidenceInfo.cls}`}>
                {confidenceInfo.icon}
                <span>
                  Tingkat Akurasi AI: <strong>{confidenceInfo.label}</strong>
                </span>
              </div>
            )}

            {ocrResult.notes && (
              <p className="text-xs text-[#B8D8D0] bg-[#061C18] rounded-[8px] px-3.5 py-2.5 border border-[#076653]">
                Catatan AI: {ocrResult.notes}
              </p>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {editedScores.map((score, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-[8px] bg-[#061C18] border border-[#076653]"
                >
                  <span className="flex-1 text-xs font-medium text-[#ffffff] truncate">{score.criteriaName}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={score.value}
                    onChange={(e) => handleScoreEdit(idx, e.target.value)}
                    className="w-20 text-center px-2 py-1.5 rounded-[6px] bg-[#082620] border border-[#076653] focus:border-[#E3EF26] outline-none text-[#ffffff] text-sm font-mono font-bold"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#076653]">
              <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
                Batal
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirm} className="flex-1">
                Konfirmasi &amp; Terapkan Skor
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
