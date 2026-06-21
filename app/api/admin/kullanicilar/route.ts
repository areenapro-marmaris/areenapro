import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';

async function getSuperAdmin(req: NextRequest) {
  const token = req.cookies.get('areena_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.rol !== 'SUPER_ADMIN') return null;
  return payload;
}

// Tüm kullanıcıları listele
export async function GET(req: NextRequest) {
  if (!await getSuperAdmin(req)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
  }
  if (!prisma) {
    // Veritabanı bağlı değilse mock admin dön
    return NextResponse.json({
      kullanicilar: [
        {
          id: 'admin-id',
          adSoyad: 'Oguzhan Kaya (Lokal)',
          kullaniciAdi: 'admin',
          rol: 'SUPER_ADMIN',
          aktif: true,
          createdAt: new Date().toISOString()
        }
      ]
    });
  }

  try {
    const kullanicilar = await prisma.personel.findMany({
      select: { id: true, adSoyad: true, kullaniciAdi: true, rol: true, aktif: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ kullanicilar });
  } catch (err) {
    return NextResponse.json({
      kullanicilar: [
        {
          id: 'admin-id',
          adSoyad: 'Oguzhan Kaya (Lokal)',
          kullaniciAdi: 'admin',
          rol: 'SUPER_ADMIN',
          aktif: true,
          createdAt: new Date().toISOString()
        }
      ]
    });
  }
}

// Yeni kullanıcı oluştur
export async function POST(req: NextRequest) {
  if (!await getSuperAdmin(req)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
  }

  const { adSoyad, kullaniciAdi, sifre, rol } = await req.json();

  if (!adSoyad || !kullaniciAdi || !sifre) {
    return NextResponse.json({ error: 'Tüm alanlar zorunludur.' }, { status: 400 });
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Veritabanı bağlantısı yok (Lokal mod)' }, { status: 503 });
  }

  try {
    const mevcutMu = await prisma.personel.findUnique({ where: { kullaniciAdi } });
    if (mevcutMu) {
      return NextResponse.json({ error: 'Bu kullanıcı adı zaten kullanılıyor.' }, { status: 409 });
    }

    const hashedSifre = await bcrypt.hash(sifre, 12);

    const yeniKullanici = await prisma.personel.create({
      data: { adSoyad, kullaniciAdi, sifre: hashedSifre, rol: rol || 'PERSONEL' },
    });

    return NextResponse.json({ success: true, id: yeniKullanici.id });
  } catch (err) {
    return NextResponse.json({ error: 'Veritabanı hatası.' }, { status: 500 });
  }
}
