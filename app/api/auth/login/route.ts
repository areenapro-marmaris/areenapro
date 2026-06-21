import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { kullaniciAdi, sifre } = await req.json();

    if (!kullaniciAdi || !sifre) {
      return NextResponse.json({ error: 'Kullanıcı adı ve şifre zorunludur.' }, { status: 400 });
    }

    let personel = null;
    let dbConnected = true;

    if (prisma) {
      try {
        personel = await prisma.personel.findUnique({
          where: { kullaniciAdi },
        });
      } catch (dbError) {
        console.warn("Veritabanı bağlantısı kurulamadı, lokal modda çalışılıyor:", dbError);
        dbConnected = false;
      }
    } else {
      dbConnected = false;
    }

    // Eğer veritabanı kapalıysa veya kullanıcı bulunamadıysa varsayılan admin ile giriş yapabilmeyi sağla (Lokal test için)
    if (!dbConnected || !personel) {
      if (kullaniciAdi === 'admin' && sifre === 'Areena2026!') {
        personel = {
          id: 'admin-id',
          kullaniciAdi: 'admin',
          sifre: '', // bypass
          adSoyad: 'Oguzhan Kaya (Lokal)',
          rol: 'SUPER_ADMIN',
          aktif: true,
        };
      }
    }

    if (!personel || !personel.aktif) {
      return NextResponse.json({ error: 'Kullanıcı adı veya şifre hatalı.' }, { status: 401 });
    }

    // Eğer veritabanından geldiyse şifreyi kontrol et, mock ise direkt geç
    if (personel.sifre) {
      const sifreDoğru = await bcrypt.compare(sifre, personel.sifre);
      if (!sifreDoğru) {
        return NextResponse.json({ error: 'Kullanıcı adı veya şifre hatalı.' }, { status: 401 });
      }
    }

    const token = await signToken({
      id: personel.id,
      kullaniciAdi: personel.kullaniciAdi,
      adSoyad: personel.adSoyad,
      rol: personel.rol,
    });

    const response = NextResponse.json({
      success: true,
      kullanici: {
        id: personel.id,
        adSoyad: personel.adSoyad,
        rol: personel.rol,
      },
    });

    response.cookies.set('areena_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 gün
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
