import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found in env, using Local Dev Simulation Mode for OCR Scanner');
      
      const body = await req.json().catch(() => ({}));
      const criteriaNames: string[] = body?.criteriaNames || ['BERSAF KUMPUL', 'SIKAP SEMPURNA', 'ISTIRAHAT DI TEMPAT', 'PARADE PERIKSA KERAPIHAN', 'BERHITUNG', 'HORMAT'];
      
      const simulatedScores = criteriaNames.map((name) => ({
        criteriaName: name,
        value: Math.floor(Math.random() * 10) + 15, // Generate realistic simulated score
      }));

      return NextResponse.json({
        success: true,
        data: {
          scores: simulatedScores,
          confidence: 'HIGH',
          notes: '⚡ SIMULASI LOKAL: Gemini AI Key belum terpasang di .env.local. Ini adalah hasil simulasi pembacaan foto lembar nilai.',
        },
      });
    }

    const body = await req.json();
    const { imageBase64, mimeType, criteriaNames } = body;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Data gambar tidak lengkap.' }, { status: 400 });
    }

    const criteriaContext = criteriaNames?.length
      ? `Daftar kriteria penilaian yang ada di lembar nilai ini adalah:\n${criteriaNames.map((n: string, i: number) => `${i + 1}. ${n}`).join('\n')}`
      : 'Baca semua kriteria dan nilainya dari kertas tersebut.';

    const prompt = `Kamu adalah sistem OCR cerdas untuk kompetisi lomba sekolah di Indonesia.

Tugas kamu: Baca lembar penilaian juri dari gambar ini dan ekstrak SEMUA nilai/skor yang tertulis.

${criteriaContext}

Instruksi penting:
1. Baca setiap baris kriteria dan nilai numeriknya.
2. Jika ada coretan atau angka yang tidak jelas, tebak angka yang paling masuk akal (0-100).
3. Kembalikan hasil HANYA dalam format JSON berikut tanpa tambahan teks apapun:

{
  "scores": [
    { "criteriaName": "Nama Kriteria", "value": 85 },
    { "criteriaName": "Nama Kriteria 2", "value": 90 }
  ],
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "notes": "Catatan jika ada nilai yang meragukan atau tidak terbaca dengan jelas"
}`;

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API Error:', errText);
      return NextResponse.json(
        { error: `Gemini API gagal: ${geminiResponse.status} - ${errText}` },
        { status: geminiResponse.status }
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip markdown json fences if present
    const cleanText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanText);
    } catch {
      return NextResponse.json({ error: 'Gagal memparse hasil Gemini.', raw: rawText }, { status: 422 });
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('OCR API Error:', err);
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
