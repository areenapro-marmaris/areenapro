import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PDKS Cihazından / Perkotek yazılımından gelen verileri karşılayan uç nokta
// Örnek Gönderim Body:
// {
//   "kullaniciAdi": "ahmet.yilmaz",
//   "islemTipi": "GIRIS" | "CIKIS",
//   "zaman": "2026-06-08T21:10:00.000Z"
// }
// Yardımcı Fonksiyon: Türkiye saatiyle Giriş saati kontrolü
function isLateCheckIn(zamanDate: Date): boolean {
  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Istanbul',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const parts = tzFormatter.format(zamanDate).split(':');
  const localHour = parseInt(parts[0], 10);
  const localMinute = parseInt(parts[1], 10);

  // Operasyon sabah 09:00'da başlar. 20:30'a kadar normal giriş, 20:31 ve sonrası (veya ertesi sabah 09:00'a kadar) cezalıdır.
  if (localHour > 20 || (localHour === 20 && localMinute >= 31)) {
    return true; // 20:31 ve sonrası geç giriş
  }
  if (localHour < 9) {
    return true; // Gece yarısından sabah 09:00'a kadar olan girişler de geçtir
  }
  return false;
}

// Yardımcı Fonksiyon: Türkiye saatiyle Çıkış saati kontrolü
function isEarlyCheckOut(zamanDate: Date): boolean {
  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Istanbul',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const parts = tzFormatter.format(zamanDate).split(':');
  const localHour = parseInt(parts[0], 10);
  const localMinute = parseInt(parts[1], 10);

  // Normal çıkış aralığı sadece sabah 04:15 ile 09:00 arasıdır.
  // Bu saat aralığının dışındaki tüm çıkışlar (örneğin akşam 20:00, gece 23:00 veya gece yarısı 02:00) erken/hatalı çıkıştır.
  const isWithinNormalWindow = (localHour > 4 || (localHour === 4 && localMinute >= 15)) && localHour < 9;
  
  return !isWithinNormalWindow; // Normal aralıkta değilse erken/hatalı çıkıştır
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (process.env.PDKS_API_KEY && apiKey !== process.env.PDKS_API_KEY) {
      return NextResponse.json({ error: 'Yetkisiz PDKS istemcisi.' }, { status: 401 });
    }

    const body = await req.json();

    // --- TOPLU GÖNDERİM DESTEĞİ (ARRAY) ---
    if (Array.isArray(body)) {
      console.log(`PDKS: ${body.length} adet toplu kayıt işleniyor...`);
      const sonuclar = [];

      for (const item of body) {
        const { kullaniciAdi, islemTipi, zaman } = item;
        if (!kullaniciAdi || !islemTipi || !zaman) continue;

        try {
          const personel = await prisma.personel.findFirst({
            where: { pdksId: kullaniciAdi }
          });

          if (!personel) continue;

          const islemZamani = new Date(zaman);
          let operasyonTarihi = new Date(islemZamani);
          if (islemZamani.getHours() < 9) {
            operasyonTarihi.setDate(operasyonTarihi.getDate() - 1);
          }
          const tarihStr = operasyonTarihi.toISOString().split('T')[0];

          const baslangicTarihi = new Date(tarihStr + 'T09:00:00.000Z');
          const bitisTarihi = new Date(tarihStr + 'T09:00:00.000Z');
          bitisTarihi.setDate(bitisTarihi.getDate() + 1);

          const mevcutKayit = await prisma.pdksKayit.findFirst({
            where: {
              personelId: personel.id,
              girisZamani: {
                gte: baslangicTarihi,
                lt: bitisTarihi
              }
            }
          });

          if (islemTipi === 'GIRIS') {
            if (!mevcutKayit) {
              const kuralDisi = isLateCheckIn(islemZamani);
              const kesintiOrani = kuralDisi ? 10 : 0; // Geç giriş yapanın hakedişinden %10 ceza kesintisi

              const yeniKayit = await prisma.pdksKayit.create({
                data: {
                  personelId: personel.id,
                  girisZamani: islemZamani,
                  kuralDisi,
                  kesintiOrani
                }
              });
              sonuclar.push({ personelId: kullaniciAdi, islem: 'GIRIS', status: 'KAYDEDILDI' });
            } else {
              sonuclar.push({ personelId: kullaniciAdi, islem: 'GIRIS', status: 'ZATEN_VAR' });
            }
          } 
          
          if (islemTipi === 'CIKIS') {
            if (mevcutKayit) {
              if (!mevcutKayit.cikisZamani) {
                const kuralDisiExit = isEarlyCheckOut(islemZamani);
                
                await prisma.pdksKayit.update({
                  where: { id: mevcutKayit.id },
                  data: { 
                    cikisZamani: islemZamani,
                    // Giriş zamanında zaten cezalıysa veya çıkış zamanında erken çıktıysa kural dışı olur
                    kuralDisi: mevcutKayit.kuralDisi || kuralDisiExit
                  }
                });
                sonuclar.push({ personelId: kullaniciAdi, islem: 'CIKIS', status: 'KAYDEDILDI' });
              } else {
                sonuclar.push({ personelId: kullaniciAdi, islem: 'CIKIS', status: 'ZATEN_VAR' });
              }
            } else {
              sonuclar.push({ personelId: kullaniciAdi, islem: 'CIKIS', status: 'GIRIS_KAYDI_YOK' });
            }
          }
        } catch (itemErr) {
          console.error(`PDKS toplu kayıt satır hatası (${kullaniciAdi}):`, itemErr);
        }
      }

      return NextResponse.json({ success: true, processedCount: sonuclar.length, details: sonuclar });
    }

    // --- TEKLİ GÖNDERİM DESTEĞİ ---
    const { kullaniciAdi, islemTipi, zaman } = body;

    if (!kullaniciAdi || !islemTipi || !zaman) {
      return NextResponse.json({ error: 'Eksik parametreler.' }, { status: 400 });
    }

    const personel = await prisma.personel.findFirst({
      where: { pdksId: kullaniciAdi }
    });

    if (!personel) {
      return NextResponse.json({ error: 'Personel bulunamadı.' }, { status: 404 });
    }

    const islemZamani = new Date(zaman);
    let operasyonTarihi = new Date(islemZamani);
    if (islemZamani.getHours() < 9) {
      operasyonTarihi.setDate(operasyonTarihi.getDate() - 1);
    }
    const tarihStr = operasyonTarihi.toISOString().split('T')[0];

    const baslangicTarihi = new Date(tarihStr + 'T09:00:00.000Z');
    const bitisTarihi = new Date(tarihStr + 'T09:00:00.000Z');
    bitisTarihi.setDate(bitisTarihi.getDate() + 1);

    const mevcutKayit = await prisma.pdksKayit.findFirst({
      where: {
        personelId: personel.id,
        girisZamani: {
          gte: baslangicTarihi,
          lt: bitisTarihi
        }
      }
    });

    if (islemTipi === 'GIRIS') {
      if (mevcutKayit) {
        return NextResponse.json({ message: 'Zaten giriş kaydı mevcut.', kayit: mevcutKayit });
      }

      const kuralDisi = isLateCheckIn(islemZamani);
      const kesintiOrani = kuralDisi ? 10 : 0;

      const yeniKayit = await prisma.pdksKayit.create({
        data: {
          personelId: personel.id,
          girisZamani: islemZamani,
          kuralDisi,
          kesintiOrani,
        }
      });

      return NextResponse.json({ success: true, action: 'GIRIS_KAYDEDILDI', kayit: yeniKayit });
    } 
    
    if (islemTipi === 'CIKIS') {
      if (!mevcutKayit) {
        return NextResponse.json({ error: 'Giriş kaydı bulunamadığı için çıkış yapılamaz.' }, { status: 400 });
      }

      const kuralDisiExit = isEarlyCheckOut(islemZamani);

      const guncelKayit = await prisma.pdksKayit.update({
        where: { id: mevcutKayit.id },
        data: {
          cikisZamani: islemZamani,
          kuralDisi: mevcutKayit.kuralDisi || kuralDisiExit
        }
      });

      return NextResponse.json({ success: true, action: 'CIKIS_KAYDEDILDI', kayit: guncelKayit });
    }

    return NextResponse.json({ error: 'Geçersiz işlem tipi.' }, { status: 400 });

  } catch (error) {
    console.error('PDKS kayıt hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
