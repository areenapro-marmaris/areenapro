import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function verifyAdminOrYonetici(req: NextRequest) {
  const token = req.cookies.get('areena_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || (payload.rol !== 'SUPER_ADMIN' && payload.rol !== 'YONETICI')) return null;
  return payload;
}

export async function GET(req: NextRequest) {
  if (!await verifyAdminOrYonetici(req)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
  }

  if (!prisma) {
    return NextResponse.json({ logs: [] });
  }

  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { tarih: 'desc' },
      take: 150, // En güncel 150 giriş logunu çek
    });
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('AuditLog çekme hatası:', error);
    return NextResponse.json({ error: 'Loglar okunamadı.' }, { status: 500 });
  }
}
