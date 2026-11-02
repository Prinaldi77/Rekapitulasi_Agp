import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const pdfPath = path.join(process.cwd(), 'public', 'Juklak_AGP_III_SMKN1_Soreang.pdf');
    const fileBuffer = fs.readFileSync(pdfPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Juklak_Resmi_AGP_III_SMKN1_Soreang.pdf"',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving Juklak PDF:', error);
    return NextResponse.json(
      { success: false, message: 'Berkas Juklak PDF tidak ditemukan.' },
      { status: 404 }
    );
  }
}

