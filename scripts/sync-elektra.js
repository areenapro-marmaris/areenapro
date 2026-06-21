require('dotenv').config();
const pg = require('pg');
const { chromium } = require('playwright');

const ELEKTRAWEB_URL = process.env.ELEKTRAWEB_URL || '';
const ELEKTRAWEB_TENANT = process.env.ELEKTRAWEB_TENANT || '';
const ELEKTRAWEB_USER = process.env.ELEKTRAWEB_USER || '';
const ELEKTRAWEB_PASS = process.env.ELEKTRAWEB_PASS || '';
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set in .env file!');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

async function scrapeElektraWeb() {
  if (!ELEKTRAWEB_URL) {
    throw new Error('ELEKTRAWEB_URL is not set in .env file!');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  try {
    console.log('ElektraWeb giriş sayfasına gidiliyor...');
    await page.goto(ELEKTRAWEB_URL, { waitUntil: 'networkidle', timeout: 30000 });

    console.log('Giriş bilgileri dolduruluyor...');
    await page.fill('[name="tenant"], [name="domain"], #tenant', ELEKTRAWEB_TENANT);
    await page.fill('[name="username"], [name="usercode"], #username', ELEKTRAWEB_USER);
    await page.fill('[name="password"], #password', ELEKTRAWEB_PASS);
    await page.click('[type="submit"], button:has-text("Giriş"), button:has-text("Login")');

    console.log('Giriş sonrası sayfa bekleniyor...');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    console.log('Satış tablosundan veriler okunuyor...');
    const personelListesi = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tr:not(:first-child)');
      const result = [];
      
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
      
      return result.filter(p => p.adSoyad);
    });

    const toplamSatis = personelListesi.reduce((acc, p) => acc + p.satis, 0);
    const tarih = new Date().toISOString().split('T')[0];

    return {
      tarih,
      toplamSatis,
      personelListesi
    };

  } finally {
    await context.close();
    await browser.close();
  }
}

async function runSync() {
  console.log(`[${new Date().toLocaleTimeString('tr-TR')}] ElektraWeb senkronizasyonu başlatıldı...`);
  
  try {
    // 1. ElektraWeb'den canlı verileri çek
    const data = await scrapeElektraWeb();
    console.log(`Canlı veriler başarıyla çekildi. Toplam Satış: ₺${data.toplamSatis}`);

    // 2. Neon bulut veritabanına doğrudan SQL ile yaz
    const query = `
      INSERT INTO "ElektraSatis" (id, tarih, "toplamSatis", "personelListesi", "sonGuncelleme")
      VALUES (gen_random_uuid(), $1, $2, $3, NOW())
      ON CONFLICT (tarih) DO UPDATE
      SET "toplamSatis" = EXCLUDED."toplamSatis",
          "personelListesi" = EXCLUDED."personelListesi",
          "sonGuncelleme" = NOW();
    `;

    const values = [
      data.tarih,
      data.toplamSatis,
      JSON.stringify(data.personelListesi)
    ];

    await pool.query(query, values);
    console.log('✅ Gerçek ciro verileri başarıyla bulut veritabanına (Neon) yazıldı!');

  } catch (error) {
    console.error('❌ Senkronizasyon hatası:', error.message);
  }
}

// İlk çalıştırma
runSync();

// Her 10 dakikada bir otomatik çalıştır (10 * 60 * 1000 ms)
const INTERVAL_MS = 10 * 60 * 1000;
setInterval(runSync, INTERVAL_MS);
console.log(`ElektraWeb Arka Plan Senkronizasyon Servisi aktif. Her 10 dakikada bir çalışacak.`);
