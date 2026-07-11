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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdminOrYonetici(req)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Veritabanı bağlantısı yok.' }, { status: 500 });
  }

  try {
    const { id } = await params;
    await prisma.auditLog.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('AuditLog silme hatası:', error);
    return NextResponse.json({ error: 'Log silinemedi.' }, { status: 500 });
  }
}
