import { NextRequest, NextResponse } from 'next/server';
import { elektraWebSatisRaporuCek } from '@/lib/elektraweb-scraper';

// Cache: aynı veriyi tekrar tekrar çekmemek için bellekte tutuyoruz
let cachedData: any = null;
let cacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 dakika (ms)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tarih = searchParams.get('tarih') || undefined;
  const forceRefresh = searchParams.get('refresh') === 'true';

  // Eğer cache geçerliyse ve zorla yenileme istenmiyorsa cache'den döndür
  const now = Date.now();
  if (!forceRefresh && cachedData && (now - cacheTime) < CACHE_TTL) {
    return NextResponse.json({ 
      ...cachedData, 
      source: 'cache',
      cacheAge: Math.round((now - cacheTime) / 1000) + ' saniye önce güncellendi'
    });
  }

  // ElektraWeb bağlantı bilgileri .env'de yoksa mock veri dön
  if (!process.env.ELEKTRAWEB_URL) {
    return NextResponse.json({
      tarih: tarih || new Date().toISOString().split('T')[0],
      toplamSatis: 54550,
      personelListesi: [
        { adSoyad: 'Ahmet Yılmaz', departman: 'Garson', satis: 15200, masaSayisi: 11 },
        { adSoyad: 'Seda Arslan', departman: 'Bar', satis: 11300, masaSayisi: 7 },
        { adSoyad: 'Fatma Kaya', departman: 'Bar', satis: 8900, masaSayisi: 5 },
        { adSoyad: 'Can Öz', departman: 'Garson', satis: 6700, masaSayisi: 4 },
        { adSoyad: 'Ahmet Yılmaz', departman: 'Garson', satis: 12450, masaSayisi: 8 },
      ],
      sonGuncelleme: new Date().toLocaleTimeString('tr-TR'),
      source: 'mock',
      mesaj: 'ELEKTRAWEB_URL .env dosyasında tanımlı değil. Mock veri gösteriliyor.'
    });
  }

  try {
    const data = await elektraWebSatisRaporuCek(tarih);
    
    // Cache'e kaydet
    cachedData = data;
    cacheTime = Date.now();
    
    return NextResponse.json({ ...data, source: 'elektraweb' });
  } catch (error) {
    return NextResponse.json(
      { error: 'ElektraWeb verisi çekilemedi.', detay: (error as Error).message },
      { status: 500 }
    );
  }
}
