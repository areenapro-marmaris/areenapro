require('dotenv').config();
const sql = require('mssql');
const axios = require('axios');

const ONLINE_API_URL = process.env.ONLINE_API_URL;
const PDKS_API_KEY = process.env.PDKS_API_KEY;

// MS SQL Server Bağlantı Ayarları
const dbConfig = {
    user: 'sa', // Genelde varsayılan SQL Server kullanıcısı 'sa' olur
    password: 'PDks_Sifreniz_Buraya', 
    server: 'localhost', // SQL Server yerel bilgisayardaysa localhost
    database: 'PDKS_DB_ADI', // Perkotek veritabanı adı
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function startSync() {
    try {
        console.log("PDKS Veritabanına bağlanılıyor...");
        await sql.connect(dbConfig);
        
        // Son 10 dakika içindeki parmak izi loglarını oku
        // Tablo ve sütun adlarını Perkotek şemasına göre düzenleyin.
        // Örn: SELECT SicilNo, Zaman, IslemTipi FROM GecisLoglari
        const query = `
            SELECT SicilNo, Zaman, IslemTipi 
            FROM GecisLoglari 
            WHERE Zaman > DATEADD(minute, -10, GETDATE())
        `;
        
        const result = await sql.query(query);
        const logs = result.recordset;

        console.log(`Son 10 dakikada toplam ${logs.length} adet geçiş logu bulundu.`);

        for (const log of logs) {
            // Cihazdaki sicil numarasını (veya kart numarasını) veritabanımızdaki 
            // personelin kullanıcı adıyla (kullaniciAdi) veya ID'siyle eşleştirip gönderiyoruz.
            const data = {
                kullaniciAdi: log.SicilNo, 
                islemTipi: log.IslemTipi === 1 ? "GIRIS" : "CIKIS", 
                zaman: log.Zaman
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
    } finally {
        await sql.close();
    }
}

startSync();
