// İlk Süper Admin kullanıcısını oluşturur
// Kullanım: node scripts/create-admin.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("HATA: DATABASE_URL çevre değişkeni bulunamadı!");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const kullaniciAdi = process.argv[2] || 'admin';
  const sifre = process.argv[3] || 'Areena2026!';
  const adSoyad = process.argv[4] || 'Sistem Yöneticisi';

  const mevcutMu = await prisma.personel.findUnique({ where: { kullaniciAdi } });
  if (mevcutMu) {
    console.log(`✅ Kullanıcı "${kullaniciAdi}" zaten mevcut.`);
    console.log(`   Rol: ${mevcutMu.rol}`);
    return;
  }

  const hashedSifre = await bcrypt.hash(sifre, 12);

  const admin = await prisma.personel.create({
    data: {
      kullaniciAdi,
      sifre: hashedSifre,
      adSoyad,
      rol: 'SUPER_ADMIN',
      aktif: true,
    },
  });

  console.log('🎉 Süper Admin başarıyla oluşturuldu!');
  console.log(`   Kullanıcı Adı : ${kullaniciAdi}`);
  console.log(`   Şifre         : ${sifre}`);
  console.log(`   Ad Soyad      : ${adSoyad}`);
  console.log(`   ID            : ${admin.id}`);
  console.log('');
  console.log('⚠️  Güvenlik için ilk girişte şifrenizi değiştirin!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
