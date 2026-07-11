require('dotenv').config();
const pg = require('pg');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

const ELEKTRAWEB_URL = process.env.ELEKTRAWEB_URL || 'https://pos.elektraweb.com/';
const ELEKTRAWEB_TENANT = process.env.ELEKTRAWEB_TENANT || '';
const ELEKTRAWEB_USER = process.env.ELEKTRAWEB_USER || '';
const ELEKTRAWEB_PASS = process.env.ELEKTRAWEB_PASS || '';
const ELEKTRAWEB_GARSON_PASS = process.env.ELEKTRAWEB_GARSON_PASS || '47994799';
const ELEKTRAWEB_RAPOR_PASS = process.env.ELEKTRAWEB_RAPOR_PASS || '155148';
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set in .env file!');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

async function scrapeElektraWeb() {
  console.log('🤖 ElektraWeb botu başlatılıyor...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  let pdfBuffer = null;
  const tempFilePath = path.join(process.cwd(), 'temp_rapor.pdf');

  page.on('response', async (res) => {
    const contentType = res.headers()['content-type'] || '';
    if (contentType.includes('pdf') || res.url().toLowerCase().includes('.pdf')) {
      try { pdfBuffer = await res.body(); } catch (e) {}
    }
  });

  page.on('download', async (download) => {
    try {
      await download.saveAs(tempFilePath);
      pdfBuffer = fs.readFileSync(tempFilePath);
    } catch (e) {}
  });

  context.on('page', async (newPage) => {
    newPage.on('response', async (res) => {
      const contentType = res.headers()['content-type'] || '';
      if (contentType.includes('pdf') || res.url().toLowerCase().includes('.pdf')) {
        try { pdfBuffer = await res.body(); } catch (e) {}
      }
    });
    newPage.on('download', async (download) => {
      try {
        await download.saveAs(tempFilePath);
        pdfBuffer = fs.readFileSync(tempFilePath);
        console.log('✅ Yeni sekmeden indirme yakalandı!');
      } catch (e) {}
    });
    try {
      await newPage.waitForLoadState('networkidle', { timeout: 15000 });
      const pdfBtn = newPage.locator('button, a, [role="button"]').filter({ hasText: /PDF/i }).first();
      if (await pdfBtn.isVisible()) await pdfBtn.click();
    } catch (e) {}
  });

  try {
    console.log('📍 Giriş sayfasına gidiliyor...');
    await page.goto(ELEKTRAWEB_URL, { waitUntil: 'networkidle', timeout: 30000 });

    console.log('🔑 Giriş bilgileri dolduruluyor...');
    await page.waitForSelector('input[name="tenantNo"]', { timeout: 10000 });
    await page.fill('input[name="tenantNo"]', ELEKTRAWEB_TENANT);
    await page.fill('input[name="userCode"]', ELEKTRAWEB_USER);
    await page.fill('input[name="hotelPassword"]', ELEKTRAWEB_PASS);
    await page.click('button.login-btn');

    console.log('🔢 Garson PIN kodu giriliyor...');
    await page.waitForSelector('input[name="waiterPassword"]', { timeout: 10000 });
    await page.fill('input[name="waiterPassword"]', ELEKTRAWEB_GARSON_PASS);
    await page.click('button.w-login-btn');

    console.log('🏢 Arn1 deposu seçiliyor...');
    await page.waitForTimeout(3000);
    await page.getByText('Arn1', { exact: false }).first().click();
    await page.waitForTimeout(4000);

    console.log('📊 Menü açılıyor...');
    await page.locator('mat-icon').filter({ hasText: 'more_vert' }).first().click();
    await page.waitForTimeout(1000);

    console.log('📑 Raporlar seçiliyor...');
    await page.getByText('Raporlar', { exact: true }).first().click();
    await page.waitForTimeout(1500);

    console.log('📑 Genel X Raporu tıklanıyor...');
    await page.getByRole('button', { name: 'Genel X Raporu', exact: true }).first().click();
    await page.waitForTimeout(1500);

    console.log('🔐 Şifre giriliyor...');
    const pwdInputs = await page.$$('input[type="password"]');
    if (pwdInputs.length > 0) {
      await pwdInputs[0].fill(ELEKTRAWEB_RAPOR_PASS);
      await page.waitForTimeout(500);
      console.log('🔓 Aç butonuna basılıyor...');
      await page.getByRole('button', { name: 'Aç', exact: true }).click();
    }
    await page.waitForTimeout(2000);

    console.log('📥 Raporla butonuna basılıyor...');
    await page.getByRole('button', { name: 'Raporla', exact: true }).click();

    console.log('⏳ PDF bekleniyor (Max 30 saniye)...');
    for (let i = 0; i < 30; i++) {
      if (pdfBuffer) break;
      await page.waitForTimeout(1000);
    }

    if (!pdfBuffer) throw new Error('PDF yakalanamadı!');

    console.log('📖 PDF okunuyor...');
    const textRaw = await new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);
      pdfParser.on('pdfParser_dataError', (e) => reject(e.parserError));
      pdfParser.on('pdfParser_dataReady', () => resolve(pdfParser.getRawTextContent()));
      pdfParser.parseBuffer(pdfBuffer);
    });

    let text = '';
    try { text = decodeURIComponent(textRaw); } catch (e) { text = textRaw; }

    const satirlar = text.split('\n').map(s => s.trim()).filter(s => s.length > 0);

    const personelListesi = [];
    let toplamSatis = 0;

    const baslikIndex = satirlar.findIndex(s => s.match(/^Garson\s+Adet\s+Toplam/i));

    if (baslikIndex !== -1) {
      let listeBasi = 0;
      for (let i = baslikIndex - 1; i >= 0; i--) {
        if (satirlar[i].match(/^Toplam\s/i)) {
          listeBasi = i + 1;
          break;
        }
      }

      for (let i = listeBasi; i < baslikIndex; i++) {
        const satir = satirlar[i];
        const match = satir.match(/^(.+?)\s+([-\d,]+\.\d{2})\s+([-\d,]+\.\d{2})$/);
        if (match) {
          const adSoyad = match[1].trim();
          const adetSiparis = parseFloat(match[2].replace(/,/g, ''));
          const ciro = parseFloat(match[3].replace(/,/g, ''));
          personelListesi.push({
            adSoyad,
            departman: 'Arn1',
            satis: ciro,
            masaSayisi: adetSiparis
          });
        }
      }

      const garsonAnaliziIndex = satirlar.findIndex(s => s.includes('Garson Analizi'));
      if (garsonAnaliziIndex !== -1) {
        for (let i = garsonAnaliziIndex + 1; i < satirlar.length; i++) {
          const toplamMatch = satirlar[i].match(/^Toplam\s+([-\d,]+\.\d{2})\s+([-\d,]+\.\d{2})/i);
          if (toplamMatch) {
            toplamSatis = parseFloat(toplamMatch[2].replace(/,/g, ''));
            break;
          }
        }
      }
    }

    personelListesi.sort((a, b) => b.satis - a.satis);
    console.log(`✅ ${personelListesi.length} garsonun verisi alındı! Toplam: ${toplamSatis} TL`);

    // Türkiye saatine göre tarihi hesapla. Eğer saat sabah 05:00'ten önceyse bir önceki günü ver
    const dateInTurkey = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
    if (dateInTurkey.getHours() < 5) {
      dateInTurkey.setDate(dateInTurkey.getDate() - 1);
    }
    const yyyy = dateInTurkey.getFullYear();
    const mm = String(dateInTurkey.getMonth() + 1).padStart(2, '0');
    const dd = String(dateInTurkey.getDate()).padStart(2, '0');
    const targetTarih = `${yyyy}-${mm}-${dd}`;

    return {
      tarih: targetTarih,
      toplamSatis,
      personelListesi
    };

  } finally {
    if (fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
    await browser.close();
  }
}

async function runSync() {
  console.log(`[${new Date().toLocaleTimeString('tr-TR')}] ElektraWeb senkronizasyonu başlatıldı...`);
  
  try {
    // 1. ElektraWeb'den canlı verileri çek ve PDF raporunu oku
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
