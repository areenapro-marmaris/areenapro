import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('areena_token')?.value;
  if (!token) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });

  let userId = payload.id;
  if (userId === 'admin-id') {
    const realAdmin = await prisma.personel.findUnique({
      where: { kullaniciAdi: 'admin' }
    });
    if (realAdmin) {
      userId = realAdmin.id;
    }
  }

  const dbUser = await prisma.personel.findUnique({
    where: { id: userId },
    select: { id: true, adSoyad: true, kullaniciAdi: true, rol: true, aktif: true }
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
  }

  return NextResponse.json({ kullanici: dbUser });
}
