import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Helper to authenticate request
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

    let tutanaklar;
    const isManager = (user.rol === 'SUPER_ADMIN' || user.rol === 'YONETICI') && !kisisel;

    if (isManager) {
      if (user.rol === 'SUPER_ADMIN' || user.rol === 'YONETICI') {
        // Super Admins and Managers see all incidents
        tutanaklar = await prisma.tutanak.findMany({
          include: {
            ekleyen: { select: { id: true, adSoyad: true, kullaniciAdi: true } },
            ilgili: { select: { id: true, adSoyad: true, kullaniciAdi: true, birim: { select: { ad: true } } } }
          },
          orderBy: { tarih: 'desc' },
        });
      } else {
        // Managers only see incidents of employees in departments they manage
        const managerWithBirimler = await prisma.personel.findUnique({
          where: { id: user.id },
          include: { yetkiliBirimler: { select: { id: true } } }
        });
        const birimIds = managerWithBirimler?.yetkiliBirimler.map((b: { id: string }) => b.id) || [];
        
        tutanaklar = await prisma.tutanak.findMany({
          where: {
            OR: [
              { ekleyenId: user.id },
              { ilgiliId: user.id },
              { ilgili: { birimId: { in: birimIds } } }
            ]
          },
          include: {
            ekleyen: { select: { id: true, adSoyad: true, kullaniciAdi: true } },
            ilgili: { select: { id: true, adSoyad: true, kullaniciAdi: true, birim: { select: { ad: true } } } }
          },
          orderBy: { tarih: 'desc' },
        });
      }
    } else {
      // Employees see incidents they wrote OR incidents written against them
      tutanaklar = await prisma.tutanak.findMany({
        where: {
          OR: [
            { ekleyenId: user.id },
            { ilgiliId: user.id }
          ]
        },
        include: {
          ekleyen: { select: { id: true, adSoyad: true, kullaniciAdi: true } },
          ilgili: { select: { id: true, adSoyad: true, kullaniciAdi: true, birim: { select: { ad: true } } } }
        },
        orderBy: { tarih: 'desc' },
      });
    }

    // Always mask the issuer if the logged-in user is the subject/target of the incident (ilgiliId === user.id)
    // EXCEPT if the logged-in user is a SUPER_ADMIN (Genel Müdür), who should see everything.
    // ALSO mask for YONETICI so they can see tutanaks but cannot see who held the tutanak against whom.
    const maskedTutanaklar = tutanaklar.map((t: any) => {
      if (user.rol === 'YONETICI') {
        return {
          ...t,
          ekleyenId: 'hidden',
          ekleyen: {
            id: 'hidden',
            adSoyad: 'Areena Personel',
            kullaniciAdi: 'yönetici'
          }
        };
      }
      if (t.ilgiliId === user.id && user.rol !== 'SUPER_ADMIN') {
        return {
          ...t,
          ekleyenId: 'hidden',
          ekleyen: {
            id: 'hidden',
            adSoyad: 'Areena Personel',
            kullaniciAdi: 'yönetici'
          }
        };
      }
      return t;
    });

    return NextResponse.json(maskedTutanaklar);
  } catch (error) {
    console.error('Tutanaklar getirilirken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Oturum açılması gereklidir.' }, { status: 401 });
    }

    const { ilgiliId, konu, icerik } = await req.json();
    if (!ilgiliId || !konu || !icerik) {
      return NextResponse.json({ error: 'İlgili personel, konu ve içerik zorunludur.' }, { status: 400 });
    }

    const yeniTutanak = await prisma.tutanak.create({
      data: {
        ekleyenId: user.id,
        ilgiliId,
        konu,
        icerik,
        durum: 'YENI'
      }
    });

    // Bildirim oluştur
    await prisma.bildirim.create({
      data: {
        personelId: ilgiliId,
        baslik: 'Hakkınızda Tutanak Düzenlendi',
        mesaj: `Konu: ${konu}`
      }
    }).catch((err: any) => console.error("Bildirim oluşturulamadı:", err));

    return NextResponse.json(yeniTutanak, { status: 201 });
  } catch (error) {
    console.error('Tutanak oluşturulurken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

// PUT handles both Employee submitting defense and Manager making final decision
export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Oturum açılması gereklidir.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, savunma, kararTuru, cezaTutari, kararNotu } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tutanak ID zorunludur.' }, { status: 400 });
    }

    const mevcutTutanak = await prisma.tutanak.findUnique({
      where: { id }
    });

    if (!mevcutTutanak) {
      return NextResponse.json({ error: 'Tutanak bulunamadı.' }, { status: 404 });
    }

    const isManager = user.rol === 'SUPER_ADMIN' || user.rol === 'YONETICI';

    // SCENARIO 1: Employee submitting defense
    if (savunma !== undefined && !isManager) {
      if (mevcutTutanak.ilgiliId !== user.id) {
        return NextResponse.json({ error: 'Sadece hakkında tutanak tutulan personel savunma yazabilir.' }, { status: 403 });
      }
      if (mevcutTutanak.durum !== 'YENI') {
        return NextResponse.json({ error: 'Bu tutanak için zaten savunma yapılmış veya karar verilmiş.' }, { status: 400 });
      }

      const guncel = await prisma.tutanak.update({
        where: { id },
        data: {
          savunma,
          savunmaTarihi: new Date(),
          durum: 'SAVUNMA_YAPILDI'
        }
      });
      return NextResponse.json(guncel);
    }

    // SCENARIO 2: Manager recording defense OR making decision
    if (isManager) {
      const updateData: any = {};
      
      // If manager enters defense directly
      if (savunma !== undefined) {
        updateData.savunma = savunma;
        updateData.savunmaTarihi = new Date();
        if (mevcutTutanak.durum === 'YENI') {
          updateData.durum = 'SAVUNMA_YAPILDI';
        }
      }

      // If manager makes a decision
      if (kararTuru !== undefined) {
        updateData.kararTuru = kararTuru;
        updateData.cezaTutari = kararTuru === 'PARA_CEZASI' ? (parseFloat(cezaTutari) || 0) : 0;
        updateData.kararNotu = kararNotu || null;
        updateData.kararTarihi = new Date();
        updateData.durum = 'KARAR_VERILDI';

        // Tutanak karara bağlandığında bildirim oluştur
        await prisma.bildirim.create({
          data: {
            personelId: mevcutTutanak.ilgiliId,
            baslik: 'Tutanak Karara Bağlandı',
            mesaj: `Hakkınızdaki tutanak karara bağlandı: ${kararTuru === 'UYARI' ? 'Uyarı' : kararTuru === 'PARA_CEZASI' ? 'Para Cezası' : 'Uzaklaştırma'}. Not: ${kararNotu || ''}`
          }
        }).catch((err: any) => console.error("Bildirim oluşturulamadı:", err));
      }

      const guncel = await prisma.tutanak.update({
        where: { id },
        data: updateData
      });
      return NextResponse.json(guncel);
    }

    return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
  } catch (error: any) {
    console.error('Tutanak güncellenirken hata:', error);
    return NextResponse.json({ error: `Sunucu hatası: ${error.message || error}` }, { status: 500 });
  }
}
