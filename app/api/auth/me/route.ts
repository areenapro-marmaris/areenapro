import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('areena_token')?.value;
  if (!token) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });

  // Resolve mock admin-id to real database admin ID
  if (payload.id === 'admin-id') {
    const realAdmin = await prisma.personel.findUnique({
      where: { kullaniciAdi: 'admin' }
    });
    if (realAdmin) {
      payload.id = realAdmin.id;
    }
  }

  return NextResponse.json({ kullanici: payload });
}
