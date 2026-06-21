require('dotenv').config();
const ADODB = require('node-adodb');
const axios = require('axios');

// 64-bit veya 32-bit Windows uyumluluğu için debug modunu kapatıyoruz
ADODB.debug = false;

const ONLINE_API_URL = process.env.ONLINE_API_URL;
const PDKS_API_KEY = process.env.PDKS_API_KEY;

// Perkotek Access veritabanı (.mdb) dosya yolu
// Cihazınızın veritabanı yoluna göre burayı güncelleyin.
const dbPath = 'C:\\Program Files (x86)\\Perkotek\\Database\\PDKS.mdb';
const connectionString = `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${dbPath};`;
const connection = ADODB.open(connectionString);

async function startSync() {
    try {
        console.log("PDKS Access veritabanı taranıyor...");

        // Son 10 dakika içindeki geçiş hareketlerini çek
        // Access veritabanındaki tablo ve sütun isimlerine göre sorguyu düzenleyin.
        // Örn: SELECT SicilNo, Zaman, IslemTipi FROM GecisLoglari WHERE Zaman > Now() - 10/1440
        const query = `
            SELECT SicilNo, Zaman, IslemTipi 
            FROM GecisLoglari 
            WHERE Zaman > DateAdd('n', -10, Now())
        `;

        const logs = await connection.query(query);
        console.log(`Son 10 dakikada toplam ${logs.length} adet geçiş logu bulundu.`);

        for (const log of logs) {
            const data = {
                kullaniciAdi: log.SicilNo, 
                islemTipi: log.IslemTipi === 1 ? "GIRIS" : "CIKIS", 
                zaman: new Date(log.Zaman).toISOString()
            };

            try {
                const res = await axios.post(ONLINE_API_URL, data, {
                    headers: {
                        'x-api-key': PDKS_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });
                if (res.data.success) {
                    console.log(`✅ ${data.kullaniciAdi} için ${data.islemTipi} kaydı gönderildi.`);
                }
            } catch (postErr) {
                console.error(`❌ Gönderim hatası (${data.kullaniciAdi}):`, postErr.message);
            }
        }

    } catch (err) {
        console.error("❌ Hata oluştu:", err.message);
    }
}

startSync();
