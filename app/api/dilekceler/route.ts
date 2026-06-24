import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('areena_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  
  if (payload.id === 'admin-id' || payload.kullaniciAdi === 'admin') {
    return await prisma.personel.findFirst({
      where: { kullaniciAdi: 'admin' }
    });
  }
  
  return await prisma.personel.findUnique({
    where: { id: payload.id }
  });
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Oturum açılması gereklidir.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const kisisel = searchParams.get('kisisel') === 'true';

    let dilekceler;
    const isManager = user.rol === 'SUPER_ADMIN' && !kisisel;

    if (isManager) {
      if (user.rol === 'SUPER_ADMIN') {
        // Super Admins and Managers see all petitions
        dilekceler = await prisma.dilekce.findMany({
          include: {
            personel: {
              select: { adSoyad: true, kullaniciAdi: true }
            },
            onaylayan: {
              select: { adSoyad: true, kullaniciAdi: true }
            }
          },
          orderBy: { tarih: 'desc' },
        });
      } else {
        // Managers only see petitions in departments they are authorized for
        const managerWithBirimler = await prisma.personel.findUnique({
          where: { id: user.id },
          include: { yetkiliBirimler: { select: { id: true } } }
        });
        const birimIds = managerWithBirimler?.yetkiliBirimler.map((b: { id: string }) => b.id) || [];
        
        dilekceler = await prisma.dilekce.findMany({
          where: {
            OR: [
              { personelId: user.id },
              { personel: { birimId: { in: birimIds } } }
            ]
          },
          include: {
            personel: {
              select: { adSoyad: true, kullaniciAdi: true }
            },
            onaylayan: {
              select: { adSoyad: true, kullaniciAdi: true }
            }
          },
          orderBy: { tarih: 'desc' },
        });
      }
    } else {
      // Normal employees see only their own
      dilekceler = await prisma.dilekce.findMany({
        where: { personelId: user.id },
        include: {
          personel: {
            select: { adSoyad: true, kullaniciAdi: true }
          },
          onaylayan: {
            select: { adSoyad: true, kullaniciAdi: true }
          }
        },
        orderBy: { tarih: 'desc' },
      });
    }

    return NextResponse.json(dilekceler);
  } catch (error) {
    console.error('Dilekçeler getirilirken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Oturum açılması gereklidir.' }, { status: 401 });
    }

    const { tur, izinTuru, konu, icerik } = await req.json();
    if (!tur || !konu || !icerik) {
      return NextResponse.json({ error: 'Dilekçe türü, konu ve içerik zorunludur.' }, { status: 400 });
    }

    const yeniDilekce = await prisma.dilekce.create({
      data: {
        personelId: user.id,
        tur,
        izinTuru: tur === 'IZIN' ? izinTuru : null,
        konu,
        icerik,
        onayDurumu: 'BEKLIYOR'
      }
    });

    return NextResponse.json(yeniDilekce, { status: 201 });
  } catch (error) {
    console.error('Dilekçe oluşturulurken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

// PUT is used by managers to approve/reject petitions
export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.rol !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için genel müdür yetkisi gereklidir.' }, { status: 403 });
    }

    const { id, onayDurumu, redNedeni } = await req.json();
    if (!id || !onayDurumu) {
      return NextResponse.json({ error: 'Dilekçe ID ve onay durumu zorunludur.' }, { status: 400 });
    }

    if (onayDurumu !== 'ONAYLANDI' && onayDurumu !== 'REDDEDILDI' && onayDurumu !== 'BEKLIYOR') {
      return NextResponse.json({ error: 'Geçersiz onay durumu.' }, { status: 400 });
    }

    const guncelDilekce = await prisma.dilekce.update({
      where: { id },
      data: { 
        onayDurumu, 
        onaylayanId: user.id,
        redNedeni: onayDurumu === 'REDDEDILDI' ? (redNedeni || null) : null
      }
    });

    // Bildirim oluştur
    await prisma.bildirim.create({
      data: {
        personelId: guncelDilekce.personelId,
        baslik: `Dilekçeniz ${onayDurumu === 'ONAYLANDI' ? 'Onaylandı' : 'Reddedildi'}`,
        mesaj: `Konu: ${guncelDilekce.konu}${onayDurumu === 'REDDEDILDI' && redNedeni ? `. Neden: ${redNedeni}` : ''}`
      }
    }).catch((err: any) => console.error("Bildirim oluşturulamadı:", err));

    return NextResponse.json(guncelDilekce);
  } catch (error) {
    console.error('Dilekçe güncellenirken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
