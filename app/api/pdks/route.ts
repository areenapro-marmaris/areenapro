import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function getAuthenticatedUser(req: NextRequest) {
  const token = req.cookies.get('areena_token')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

// PDKS listesini belirli operasyon tarihine göre çek
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tarih = searchParams.get('tarih'); // Format: YYYY-MM (örnek: 2026-06) veya YYYY-MM-DD

  if (!tarih) {
    return NextResponse.json({ error: 'Tarih parametresi zorunludur.' }, { status: 400 });
  }

  try {
    let baslangicTarihi: Date;
    let bitisTarihi: Date;

    // Eğer tarih formatı YYYY-MM ise (Aylık filtreleme)
    if (tarih.length === 7) {
      baslangicTarihi = new Date(tarih + '-01T09:00:00.000Z');
      bitisTarihi = new Date(tarih + '-01T09:00:00.000Z');
      bitisTarihi.setMonth(bitisTarihi.getMonth() + 1);
    } else {
      // Günlük filtreleme (Eski uyumluluk için)
      baslangicTarihi = new Date(tarih + 'T09:00:00.000Z');
      bitisTarihi = new Date(tarih + 'T09:00:00.000Z');
      bitisTarihi.setDate(bitisTarihi.getDate() + 1);
    }

    let targetUserId = user.id;

    // Eğer geliştirme aşamasında geçici admin-id ile giriş yapıldıysa, veritabanındaki asıl admin ID'sini bulalım
    if (targetUserId === 'admin-id') {
      const realAdmin = await prisma.personel.findUnique({
        where: { kullaniciAdi: 'admin' }
      });
      if (realAdmin) {
        targetUserId = realAdmin.id;
      }
    }

    const isManagerOrVezne = user.rol === 'SUPER_ADMIN' || user.rol === 'YONETICI' || user.rol === 'VEZNE';

    const queryCondition: any = {
      girisZamani: {
        gte: baslangicTarihi,
        lt: bitisTarihi
      }
    };

    if (!isManagerOrVezne) {
      queryCondition.personelId = targetUserId;
    }

    const kayitlar = await prisma.pdksKayit.findMany({
      where: queryCondition,
      include: {
        personel: {
          select: {
            adSoyad: true,
            rol: true,
            birim: {
              select: {
                ad: true
              }
            }
          }
        }
      },
      orderBy: {
        girisZamani: 'desc'
      }
    });

    // Türkiye saati ve günü için şimdiki zamanı alalım
    const now = new Date();
    const tzHourFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Istanbul',
      hour: 'numeric',
      hour12: false
    });
    const tzDateFormatter = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const currentLocalHour = parseInt(tzHourFormatter.format(now), 10);
    const currentOperationalDate = new Date(now);
    if (currentLocalHour < 9) {
      currentOperationalDate.setDate(currentOperationalDate.getDate() - 1);
    }
    const currentOperationalDateStr = tzDateFormatter.format(currentOperationalDate);

    // Approved leaves query
    const leafQuery: any = {
      tur: 'IZIN',
      onayDurumu: 'ONAYLANDI'
    };
    if (!isManagerOrVezne) {
      leafQuery.personelId = targetUserId;
    }

    const onayliIzinler = await prisma.dilekce.findMany({
      where: leafQuery
    });

    const approvedLeaveKeys = new Set(
      onayliIzinler.map((d: any) => `${d.personelId}_${tzDateFormatter.format(new Date(d.tarih))}`)
    );

    // Arayüzün beklediği formata dönüştür ve Türkiye Saat Dilimine (Europe/Istanbul) göre formatla
    const list = kayitlar.map((k: any) => {
      // Türkiye saati ile Giriş/Çıkış saatlerini alıyoruz
      const girisFormat = k.girisZamani.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/Istanbul' 
      });
      const cikisFormat = k.cikisZamani 
        ? k.cikisZamani.toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'Europe/Istanbul' 
          }) 
        : null;

      // Kaydın operasyonel gününü belirle (Türkiye saatine göre sabah 09:00'dan önce ise bir önceki güne aittir)
      const localHour = parseInt(tzHourFormatter.format(k.girisZamani), 10);
      const operasyonTarihi = new Date(k.girisZamani);
      if (localHour < 9) {
        operasyonTarihi.setDate(operasyonTarihi.getDate() - 1);
      }

      // Operasyon tarihini YYYY-MM-DD olarak formatla
      const operasyonTarihiStr = tzDateFormatter.format(operasyonTarihi);

      // Gün geçtiyse (operasyon günü bugünden eskiyse) ve çıkış basılmadıysa kural dışı (cezalı) kabul et
      const isDayPassed = operasyonTarihiStr < currentOperationalDateStr;
      const isMissingExit = !k.cikisZamani;

      // Çıkış saati kontrolü (Türkiye saatine göre normal aralık: 04:15 - 09:00)
      let isEarlyExit = false;
      if (k.cikisZamani) {
        const exitParts = k.cikisZamani.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: 'numeric', 
          hour12: false, 
          timeZone: 'Europe/Istanbul' 
        }).split(':');
        const localExitHour = parseInt(exitParts[0], 10);
        const localExitMinute = parseInt(exitParts[1], 10);
        
        const isWithinNormalWindow = (localExitHour > 4 || (localExitHour === 4 && localExitMinute >= 15)) && localExitHour < 9;
        isEarlyExit = !isWithinNormalWindow;
      }

      // Check if there is an approved leave for this date and employee
      const hasApprovedLeave = approvedLeaveKeys.has(`${k.personelId}_${operasyonTarihiStr}`);

      const kuralDisiState = !hasApprovedLeave && (k.kuralDisi || (isDayPassed && isMissingExit) || isEarlyExit);

      return {
        id: k.id,
        adSoyad: k.personel.adSoyad,
        departman: k.personel.birim?.ad || 'Belirtilmemiş',
        giris: girisFormat,
        cikis: cikisFormat,
        kuralDisi: kuralDisiState,
        kesinti: hasApprovedLeave ? 0 : k.kesintiOrani,
        tarih: operasyonTarihiStr,
        eksikCikis: isDayPassed && isMissingExit,
        erkenCikis: isEarlyExit && !hasApprovedLeave,
        izinliOk: hasApprovedLeave
      };
    });

    return NextResponse.json({ kayitlar: list });

  } catch (error) {
    console.error('PDKS listesi çekilirken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
