require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function changeUsername() {
    try {
        const user = await prisma.personel.findFirst({
            where: { adSoyad: { contains: "Oguzhan Kaya", mode: 'insensitive' } }
        });
        
        if (!user) {
            console.log("Oguzhan Kaya kullanıcısı bulunamadı.");
            return;
        }

        const updated = await prisma.personel.update({
            where: { id: user.id },
            data: { kullaniciAdi: "359" } // PDKS'deki ID ile eşliyoruz
        });

        console.log(`✅ BAŞARILI! "${updated.adSoyad}" kullanıcısının yeni kullanıcı adı (kullaniciAdi) "${updated.kullaniciAdi}" yapıldı.`);
        console.log(`Not: Panel girişi yaparken artık kullanıcı adı kısmına "admin" yerine "359" yazmalısınız.`);
    } catch (e) {
        console.error("Hata:", e.message);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

changeUsername();
