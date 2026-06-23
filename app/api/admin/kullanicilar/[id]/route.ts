import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';

async function getSuperAdmin(req: NextRequest) {
  const token = req.cookies.get('areena_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || (payload.rol !== 'SUPER_ADMIN' && payload.rol !== 'INSAN_KAYNAKLARI')) return null;
  return payload;
}

// Kullanıcı güncelle
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSuperAdmin(req)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
  }
  if (!prisma) {
    return NextResponse.json({ error: 'Veritabanı bağlantısı yok (Lokal mod)' }, { status: 503 });
  }

  const { id } = await params;

  try {
    const { adSoyad, kullaniciAdi, sifre, rol, aktif } = await req.json();

    const data: any = {};
    if (adSoyad !== undefined) data.adSoyad = adSoyad;
    if (kullaniciAdi !== undefined) data.kullaniciAdi = kullaniciAdi;
    if (rol !== undefined) data.rol = rol;
    if (aktif !== undefined) data.aktif = aktif;
    if (sifre && sifre.trim().length > 0) {
      data.sifre = await bcrypt.hash(sifre, 12);
    }

    await prisma.personel.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Veritabanı hatası.' }, { status: 500 });
  }
}

// Kullanıcı sil
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSuperAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });

  const { id } = await params;

  // Kendi kendini silemez
  if (admin.id === id) {
    return NextResponse.json({ error: 'Kendi hesabınızı silemezsiniz.' }, { status: 400 });
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Veritabanı bağlantısı yok (Lokal mod)' }, { status: 503 });
  }

  try {
    await prisma.personel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Veritabanı hatası.' }, { status: 500 });
  }
}
