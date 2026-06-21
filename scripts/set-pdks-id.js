require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function setPdksId() {
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
            data: { pdksId: "359" } // Perkotek'teki ID'yi tanımlıyoruz
        });

        console.log(`✅ BAŞARILI! "${updated.adSoyad}" kullanıcısının:`);
        console.log(`- Giriş Kullanıcı Adı (kullaniciAdi): "${updated.kullaniciAdi}" (admin olarak kaldı)`);
        console.log(`- Perkotek PDKS ID (pdksId): "${updated.pdksId}" (yeni atandı)`);
    } catch (e) {
        console.error("Hata:", e.message);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

setPdksId();
