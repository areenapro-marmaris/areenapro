require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function listUsers() {
    try {
        const users = await prisma.personel.findMany();
        console.log("=== CLOUD VERİTABANINDAKİ PERSONELLER ===");
        if (users.length === 0) {
            console.log("Kayıtlı personel bulunamadı.");
        } else {
            users.forEach(u => {
                console.log(`Ad Soyad: ${u.adSoyad}, Mevcut Kullanıcı Adı (kullaniciAdi): "${u.kullaniciAdi}" (ID: ${u.id})`);
            });
        }
        console.log("====================================");
    } catch (e) {
        console.error("Hata:", e.message);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

listUsers();
