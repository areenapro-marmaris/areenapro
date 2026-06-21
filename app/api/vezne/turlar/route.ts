import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function getAuthenticatedUser(req: NextRequest) {
  const token = req.cookies.get('areena_token')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

// Belirli tarihe ait turları listele
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tarih = searchParams.get('tarih');

  if (!tarih) {
    return NextResponse.json({ error: 'Tarih parametresi zorunludur.' }, { status: 400 });
  }

  try {
    const turlar = await prisma.turOtobus.findMany({
      where: { tarih },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ turlar });
  } catch (error) {
    console.error('Turlar listelenirken hata:', error);
    return NextResponse.json({ error: 'Veritabanı hatası.' }, { status: 500 });
  }
}

// Yeni tur ekle
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const { tip, firma, rehberVeyaOtobus, kisiSayisi, kisiBasiTutar, tarih } = await req.json();

    if (!tip || !firma || !rehberVeyaOtobus || kisiSayisi === undefined || kisiBasiTutar === undefined || !tarih) {
      return NextResponse.json({ error: 'Eksik alanlar var.' }, { status: 400 });
    }

    const kisi = parseInt(kisiSayisi) || 0;
    const birimTutar = parseFloat(kisiBasiTutar) || 0;
    const toplamTutar = kisi * birimTutar;

    const yeniTur = await prisma.turOtobus.create({
      data: {
        tip,
        firma,
        rehberVeyaOtobus,
        kisiSayisi: kisi,
        kisiBasiTutar: birimTutar,
        tutar: toplamTutar,
        tarih,
        mudurOnaylandi: false,
        odendiMi: false,
      },
    });

    return NextResponse.json({ success: true, tur: yeniTur });
  } catch (error) {
    console.error('Tur eklenirken hata:', error);
    return NextResponse.json({ error: 'Tur eklenemedi.' }, { status: 500 });
  }
}
