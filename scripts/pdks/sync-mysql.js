require('dotenv').config();
const mysql = require('mysql2/promise');
const axios = require('axios');

const ONLINE_API_URL = process.env.ONLINE_API_URL;
const PDKS_API_KEY = process.env.PDKS_API_KEY;

// MySQL Bağlantı Bilgileri (SQL-Front görüntüsündeki localhost veritabanı)
const dbConfig = {
    host: 'localhost',
    user: 'root', // Genelde varsayılan root'tur, şifre yoksa boş bırakılır
    password: '', // Varsa şifreniz buraya yazılmalı
    database: 'perkotek'
};

async function startSync() {
    let connection;
    try {
        console.log("MySQL PDKS veritabanına bağlanılıyor...");
        connection = await mysql.createConnection(dbConfig);
        
        // Son 24 saatteki geçiş verilerini çek (Giriş ve çıkışları kontrol etmek için)
        const [rows] = await connection.execute(`
            SELECT id, personel_id, tarih, giris_saat, cikis_saat 
            FROM personel_giriscikis 
            WHERE tarih >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        `);

        console.log(`Son 24 saat içinde toplam ${rows.length} kayıt bulundu.`);

        for (const row of rows) {
            const dateStr = row.tarih.toISOString().split('T')[0]; // YYYY-MM-DD
            
            // 1. Giriş Kaydı Gönderimi (Eğer giris_saat doluysa)
            if (row.giris_saat) {
                const zamanGiris = `${dateStr}T${row.giris_saat}Z`; // ISO format
                
                try {
                    const res = await axios.post(ONLINE_API_URL, {
                        kullaniciAdi: String(row.personel_id), // Personel ID'sini kullanıcı adı olarak gönderiyoruz
                        islemTipi: "GIRIS",
                        zaman: zamanGiris
                    }, {
                        headers: {
                            'x-api-key': PDKS_API_KEY,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (res.data.success && res.data.action) {
                        console.log(`✅ Personel ID ${row.personel_id} için Giriş kaydedildi.`);
                    }
                } catch (postErr) {
                    console.error(`❌ Giriş gönderim hatası (ID ${row.personel_id}):`, postErr.message);
                }
            }

            // 2. Çıkış Kaydı Gönderimi (Eğer cikis_saat doluysa)
            if (row.cikis_saat) {
                const zamanCikis = `${dateStr}T${row.cikis_saat}Z`;
                
                try {
                    const res = await axios.post(ONLINE_API_URL, {
                        kullaniciAdi: String(row.personel_id),
                        islemTipi: "CIKIS",
                        zaman: zamanCikis
                    }, {
                        headers: {
                            'x-api-key': PDKS_API_KEY,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (res.data.success && res.data.action) {
                        console.log(`✅ Personel ID ${row.personel_id} için Çıkış kaydedildi.`);
                    }
                } catch (postErr) {
                    console.error(`❌ Çıkış gönderim hatası (ID ${row.personel_id}):`, postErr.message);
                }
            }
        }

    } catch (err) {
        console.error("❌ Hata oluştu:", err.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

startSync();
