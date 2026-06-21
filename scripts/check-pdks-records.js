require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkRecords() {
    try {
        const records = await prisma.pdksKayit.findMany({
            include: {
                personel: {
                    select: {
                        adSoyad: true,
                        kullaniciAdi: true
                    }
                }
            }
        });
        
        console.log("=== CLOUD VERİTABANINDAKİ PDKS KAYITLARI ===");
        if (records.length === 0) {
            console.log("Kayıt bulunamadı.");
        } else {
            records.forEach(r => {
                console.log(`Personel: ${r.personel.adSoyad} (${r.personel.kullaniciAdi}), Giriş Zamanı: ${r.girisZamani.toISOString()}, Çıkış Zamanı: ${r.cikisZamani ? r.cikisZamani.toISOString() : 'Mevcut Değil'}`);
            });
        }
        console.log("============================================");
    } catch (e) {
        console.error("Hata:", e.message);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

checkRecords();
