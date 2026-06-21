/**
 * AREENAPRO - PDKS / Perkotek Yerel Senkronizasyon Şablonu (Node.js)
 * 
 * Bu script, kulüpteki PDKS (parmak izi okuyucu) bilgisayarında arka planda çalışarak
 * yeni parmak izi loglarını okur ve online sisteme (Neon veritabanına) HTTP POST ile gönderir.
 * 
 * Kurulum:
 * 1. PDKS bilgisayarına Node.js kurun.
 * 2. Bir klasör oluşturup bu dosyayı içine kaydedin.
 * 3. Terminalde 'npm install mssql axios dotenv' veya Access için uygun kütüphaneyi kurun.
 * 4. Windows Görev Zamanlayıcı (Task Scheduler) ile her 5 dakikada bir çalışacak şekilde ayarlayın.
 */

const axios = require('axios');
// Eğer PDKS veritabanı MS SQL Server ise 'mssql' paketini kullanabilirsiniz:
// const sql = require('mssql');

// --- AYARLAR ---
const ONLINE_API_URL = "https://[sizin-domain-adresiniz].trycloudflare.com/api/pdks/kayit"; 
const PDKS_API_KEY = "areena_pdks_secret_key_2026"; // Güvenlik anahtarı

// Yerel PDKS veritabanı bağlantı bilgileri (Örn: MS SQL Server)
const dbConfig = {
    user: 'sa',
    password: 'pdks_sifreniz',
    server: 'localhost', 
    database: 'PDKS_DB_ADI',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function syncPdks() {
    console.log("PDKS senkronizasyonu başlatıldı...");
    
    try {
        // 1. Yerel veritabanına bağlan
        // await sql.connect(dbConfig);
        
        // Örnek Sorgu: Son 5 dakikada basılan ve henüz gönderilmemiş parmak izleri
        // const result = await sql.query`
        //     SELECT PersonelKod, IslemTarihi, IslemTipi 
        //     FROM GecisLoglari 
        //     WHERE IslemTarihi > DATEADD(minute, -5, GETDATE())
        // `;
        
        // Simüle edilmiş veri (Cihazdan okunan log örneği)
        const okunanLoglar = [
            {
                kullaniciAdi: "ahmet.yilmaz", // Personelin sistemdeki kullanıcı adı
                islemTipi: "GIRIS", // Veya "CIKIS"
                zaman: new Date().toISOString()
            }
        ];

        // 2. Logları tek tek online sunucuya gönder
        for (const log of okunanLoglar) {
            try {
                const response = await axios.post(ONLINE_API_URL, {
                    kullaniciAdi: log.kullaniciAdi,
                    islemTipi: log.islemTipi,
                    zaman: log.zaman
                }, {
                    headers: {
                        'x-api-key': PDKS_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    console.log(`✅ ${log.kullaniciAdi} için ${log.islemTipi} kaydı başarıyla gönderildi.`);
                }
            } catch (err) {
                console.error(`❌ ${log.kullaniciAdi} kaydı gönderilirken hata:`, err.message);
            }
        }

    } catch (err) {
        console.error("❌ PDKS Yerel DB bağlantı hatası:", err.message);
    } finally {
        // await sql.close();
    }
}

// Senkronizasyonu çalıştır
syncPdks();
