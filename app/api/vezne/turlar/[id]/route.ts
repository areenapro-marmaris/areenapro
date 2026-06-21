import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function getAuthenticatedUser(req: NextRequest) {
  const token = req.cookies.get('areena_token')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

// Tur güncelle (Müdür Onayı, Ödeme Onayı veya Bilgileri Düzenleme)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { mudurOnaylandi, odendiMi, firma, rehberVeyaOtobus, kisiSayisi, kisiBasiTutar, tip } = body;

    // Mevcut kaydı bulalım
    const mevcutTur = await prisma.turOtobus.findUnique({
      where: { id }
    });

    if (!mevcutTur) {
      return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 });
    }

    const updateData: any = {};

    // 1. Müdür Onayı güncellemesi
    if (mudurOnaylandi !== undefined) {
      updateData.mudurOnaylandi = mudurOnaylandi;
    }

    // 2. Ödeme Onayı güncellemesi (ve Kasa Defterine Gider Ekleme)
    if (odendiMi !== undefined && odendiMi !== mevcutTur.odendiMi) {
      updateData.odendiMi = odendiMi;
      if (odendiMi) {
        updateData.odemeTarihi = new Date();
        
        // Ödeme onaylandığında Kasa Defterine (KasaHareket) otomatik gider olarak işle
        await prisma.kasaHareket.create({
          data: {
            tur: 'GIDER',
            miktar: mevcutTur.tutar,
            aciklama: `${mevcutTur.firma} - ${mevcutTur.rehberVeyaOtobus} ödemesi (${mevcutTur.tip})`,
            veznedarId: user.id, // İşlemi yapan veznedar / yönetici
            tarih: new Date(),
          }
        });
      } else {
        updateData.odemeTarihi = null;
        // Eğer ödeme iptal edilirse kasa hareketlerinden bu kaydı silmek veya ters kayıt girmek gerekebilir,
        // ancak basitlik ve güvenlik açısından burası sadece işaretlemeyi geri alır.
      }
    }

    // 3. Genel Alan Düzenleme (Yönetici yetkisi gerekir veya serbest)
    if (firma !== undefined) updateData.firma = firma;
    if (rehberVeyaOtobus !== undefined) updateData.rehberVeyaOtobus = rehberVeyaOtobus;
    if (tip !== undefined) updateData.tip = tip;
    
    if (kisiSayisi !== undefined || kisiBasiTutar !== undefined) {
      const kisi = kisiSayisi !== undefined ? parseInt(kisiSayisi) : mevcutTur.kisiSayisi;
      const birimTutar = kisiBasiTutar !== undefined ? parseFloat(kisiBasiTutar) : mevcutTur.kisiBasiTutar;
      updateData.kisiSayisi = kisi;
      updateData.kisiBasiTutar = birimTutar;
      updateData.tutar = kisi * birimTutar;
    }

    const guncelTur = await prisma.turOtobus.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, tur: guncelTur });
  } catch (error) {
    console.error('Tur güncellenirken hata:', error);
    return NextResponse.json({ error: 'Kayıt güncellenemedi.' }, { status: 500 });
  }
}

// Tur sil
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(req);
  if (!user || user.rol !== 'SUPER_ADMIN' && user.rol !== 'YONETICI') {
    return NextResponse.json({ error: 'Yetkisiz erişim. Sadece yöneticiler silebilir.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.turOtobus.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tur silinirken hata:', error);
    return NextResponse.json({ error: 'Kayıt silinemedi.' }, { status: 500 });
  }
}
