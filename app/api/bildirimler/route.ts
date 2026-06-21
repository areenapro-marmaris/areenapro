import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('areena_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  // Resolve mock admin-id to real database admin ID
  if (payload.id === 'admin-id') {
    const realAdmin = await prisma.personel.findUnique({
      where: { kullaniciAdi: 'admin' }
    });
    if (realAdmin) {
      payload.id = realAdmin.id;
    }
  }
  return payload;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Oturum açılması gereklidir.' }, { status: 401 });
    }

    const bildirimler = await prisma.bildirim.findMany({
      where: { personelId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({ bildirimler });
  } catch (error) {
    console.error('Bildirimler getirilirken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Oturum açılması gereklidir.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id } = body;

    if (id) {
      await prisma.bildirim.updateMany({
        where: { id, personelId: user.id },
        data: { okundu: true }
      });
    } else {
      await prisma.bildirim.updateMany({
        where: { personelId: user.id, okundu: false },
        data: { okundu: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bildirim güncellenirken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
