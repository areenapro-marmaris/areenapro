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

    if (user.rol !== 'SUPER_ADMIN' && user.rol !== 'SEF') {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz bulunmamaktadır.' }, { status: 403 });
    }

    let checklists;
    if (user.rol === 'SUPER_ADMIN') {
      // General manager can see all checklists
      checklists = await prisma.chefChecklist.findMany({
        include: {
          personel: {
            select: { id: true, adSoyad: true, gorev: true }
          },
          sef: {
            select: { id: true, adSoyad: true }
          }
        },
        orderBy: { tarih: 'desc' }
      });
    } else {
      // Chef can only see checklists they created
      checklists = await prisma.chefChecklist.findMany({
        where: { sefId: user.id },
        include: {
          personel: {
            select: { id: true, adSoyad: true, gorev: true }
          },
          sef: {
            select: { id: true, adSoyad: true }
          }
        },
        orderBy: { tarih: 'desc' }
      });
    }

    return NextResponse.json(checklists);
  } catch (error) {
    console.error('Checklistler yüklenirken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Oturum açılması gereklidir.' }, { status: 401 });
    }

    if (user.rol !== 'SUPER_ADMIN' && user.rol !== 'SEF') {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz bulunmamaktadır.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      personelId,
      tarih,
      isletmeHijyen,
      personelUniforma,
      masaSetup,
      komiTasima,
      garsonServis,
      personelDevamlilik,
      hesapTahsilat,
      satisTaktik,
      garsonPortfoy,
      musteriMemnuniyeti
    } = body;

    if (!personelId) {
      return NextResponse.json({ error: 'Değerlendirilecek personel seçilmelidir.' }, { status: 400 });
    }

    const parseDate = tarih ? new Date(tarih) : new Date();

    const createdChecklist = await prisma.chefChecklist.create({
      data: {
        tarih: parseDate,
        personelId,
        sefId: user.id,
        isletmeHijyen: isletmeHijyen || 'NORMAL',
        personelUniforma: personelUniforma || 'NORMAL',
        masaSetup: masaSetup || 'NORMAL',
        komiTasima: komiTasima || 'NORMAL',
        garsonServis: garsonServis || 'NORMAL',
        personelDevamlilik: personelDevamlilik || 'NORMAL',
        hesapTahsilat: hesapTahsilat || 'NORMAL',
        satisTaktik: satisTaktik || 'NORMAL',
        garsonPortfoy: garsonPortfoy || 'NORMAL',
        musteriMemnuniyeti: musteriMemnuniyeti || 'NORMAL'
      }
    });

    return NextResponse.json(createdChecklist, { status: 201 });
  } catch (error) {
    console.error('Checklist kaydedilirken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
