import { chromium, Browser, Page } from 'playwright';

// ElektraWeb scraper servisi
// Bu servis, görünmez (headless) bir Chrome tarayıcısı açarak
// ElektraWeb'e giriş yapar ve satış raporunu çeker.

const ELEKTRAWEB_URL = process.env.ELEKTRAWEB_URL || ''; // .env dosyasına yazın
const ELEKTRAWEB_TENANT = process.env.ELEKTRAWEB_TENANT || ''; // Otel/Kurum kodu
const ELEKTRAWEB_USER = process.env.ELEKTRAWEB_USER || '';
const ELEKTRAWEB_PASS = process.env.ELEKTRAWEB_PASS || '';

export interface PersonelSatis {
  adSoyad: string;
  departman: string;
  satis: number;
  masaSayisi: number;
}

export interface ElektraWebRapor {
  tarih: string;
  toplamSatis: number;
  personelListesi: PersonelSatis[];
  sonGuncelleme: string;
}

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true, // true = görünmez çalışır, false = tarayıcı açılır (debug için)
    });
  }
  return browser;
}

export async function elektraWebSatisRaporuCek(tarih?: string): Promise<ElektraWebRapor> {
  const b = await getBrowser();
  const context = await b.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  try {
    // 1. Giriş Sayfasına Git
    await page.goto(ELEKTRAWEB_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // 2. Giriş Formunu Doldur
    // NOT: Selector'lar ElektraWeb'in gerçek giriş sayfasına göre ayarlanmalıdır.
    // Bunları öğrenmek için tarayıcıda F12'ye basıp input alanlarına sağ tıklayıp "İncele" yapın.
    await page.fill('[name="tenant"], [name="domain"], #tenant', ELEKTRAWEB_TENANT);
    await page.fill('[name="username"], [name="usercode"], #username', ELEKTRAWEB_USER);
    await page.fill('[name="password"], #password', ELEKTRAWEB_PASS);
    await page.click('[type="submit"], button:has-text("Giriş"), button:has-text("Login")');

    // 3. Giriş sonrası ana sayfanın yüklenmesini bekle
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // 4. Satış Raporu Sayfasına Git
    // NOT: Bu URL ElektraWeb'in raporlar bölümüne göre değiştirilmeli
    // await page.goto(`${ELEKTRAWEB_URL}/reports/sales`, { waitUntil: 'networkidle' });

    // 5. Tarih varsa filtre uygula
    // if (tarih) {
    //   await page.fill('#date-input', tarih);
    //   await page.click('#apply-filter');
    //   await page.waitForLoadState('networkidle');
    // }

    // 6. Tablodan veri çek
    // NOT: Bu selector'lar gerçek sayfa yapısına göre güncellenmeli
    const personelListesi: PersonelSatis[] = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tr:not(:first-child)'); // Başlık hariç
      const result: PersonelSatis[] = [];
      
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          result.push({
            adSoyad: cells[0]?.textContent?.trim() || '',
            departman: cells[1]?.textContent?.trim() || '',
            satis: parseFloat(cells[2]?.textContent?.replace(/[^\d.]/g, '') || '0'),
            masaSayisi: parseInt(cells[3]?.textContent?.trim() || '0'),
          });
        }
      });
      
      return result.filter(p => p.adSoyad); // Boş satırları filtrele
    });

    const toplamSatis = personelListesi.reduce((acc, p) => acc + p.satis, 0);

    return {
      tarih: tarih || new Date().toISOString().split('T')[0],
      toplamSatis,
      personelListesi,
      sonGuncelleme: new Date().toLocaleTimeString('tr-TR'),
    };

  } catch (error) {
    console.error('[ElektraWeb Scraper] Hata:', error);
    throw new Error(`ElektraWeb verileri çekilemedi: ${(error as Error).message}`);
  } finally {
    await context.close();
  }
}
