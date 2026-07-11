import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('areena_token')?.value;
  if (!token) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });

  let userId = payload.id;
  if (userId === 'admin-id') {
    const realAdmin = await prisma.personel.findUnique({
      where: { kullaniciAdi: 'admin' }
    });
    if (realAdmin) {
      userId = realAdmin.id;
    }
  }

  const dbUser = await prisma.personel.findUnique({
    where: { id: userId },
    select: { id: true, adSoyad: true, kullaniciAdi: true, rol: true, aktif: true }
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
  }

  // Otomatik Giriş/Erişim Logu oluşturma mantığı
  try {
    const ipAdresi = req.headers.get('x-forwarded-for') || 'Lokal';
    const tarayici = req.headers.get('user-agent') || 'Bilinmiyor';

    // Son 1 saat içinde aynı kullanıcının giriş logu var mı kontrol et (mükerrer kayıtları engellemek için)
    const birSaatOnce = new Date(Date.now() - 60 * 60 * 1000);
    const varolanLog = await prisma.auditLog.findFirst({
      where: {
        personelId: dbUser.id,
        tarih: { gte: birSaatOnce }
      }
    });

    if (!varolanLog) {
      await prisma.auditLog.create({
        data: {
          personelId: dbUser.id,
          adSoyad: dbUser.adSoyad,
          kullaniciAdi: dbUser.kullaniciAdi,
          rol: dbUser.rol,
          ipAdresi,
          tarayici,
        }
      });
    }
  } catch (logError) {
    console.error('Otomatik giriş AuditLog yazılırken hata:', logError);
  }

  return NextResponse.json({ kullanici: dbUser });
}
