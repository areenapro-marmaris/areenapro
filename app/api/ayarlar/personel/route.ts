import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const personel = await prisma.personel.findMany({
      include: {
        birim: true,
        sirket: true,
        sigortaSirketi: true,
      },
      orderBy: { adSoyad: 'asc' },
    });
    return NextResponse.json(personel);
  } catch (error) {
    console.error('Personel listelenirken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      kullaniciAdi,
      sifre,
      adSoyad,
      rol,
      birimId,
      sirketId,
      sigortaSirketiId,
      tabanMaas,
      aktif,
      elektraId,
      pdksId,
      gorev,
      iseGirisTarihi,
      istenCikisTarihi,
      iban,
    } = body;

    if (!kullaniciAdi || !sifre || !adSoyad) {
      return NextResponse.json({ error: 'Kullanıcı adı, şifre ve ad soyad zorunludur.' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(sifre, salt);

    const yeniPersonel = await prisma.personel.create({
      data: {
        kullaniciAdi,
        sifre: hashedPassword,
        adSoyad,
        rol: rol || 'PERSONEL',
        birimId: birimId || null,
        sirketId: sirketId || null,
        sigortaSirketiId: sigortaSirketiId || null,
        tabanMaas: parseFloat(tabanMaas) || 0,
        aktif: aktif !== undefined ? aktif : true,
        elektraId: elektraId || null,
        pdksId: pdksId || null,
        gorev: gorev || null,
        iseGirisTarihi: iseGirisTarihi ? new Date(iseGirisTarihi) : null,
        istenCikisTarihi: istenCikisTarihi ? new Date(istenCikisTarihi) : null,
        iban: iban || null,
      },
    });

    return NextResponse.json(yeniPersonel, { status: 201 });
  } catch (error: any) {
    console.error('Personel eklenirken hata:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Bu kullanıcı adı zaten kullanılıyor.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      kullaniciAdi,
      sifre,
      adSoyad,
      rol,
      birimId,
      sirketId,
      sigortaSirketiId,
      tabanMaas,
      aktif,
      elektraId,
      pdksId,
      gorev,
      iseGirisTarihi,
      istenCikisTarihi,
      iban,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Personel ID gereklidir.' }, { status: 400 });
    }

    const updateData: any = {
      kullaniciAdi,
      adSoyad,
      rol,
      birimId: birimId || null,
      sirketId: sirketId || null,
      sigortaSirketiId: sigortaSirketiId || null,
      tabanMaas: parseFloat(tabanMaas) || 0,
      aktif: aktif !== undefined ? aktif : true,
      elektraId: elektraId || null,
      pdksId: pdksId || null,
      gorev: gorev || null,
      iseGirisTarihi: iseGirisTarihi ? new Date(iseGirisTarihi) : null,
      istenCikisTarihi: istenCikisTarihi ? new Date(istenCikisTarihi) : null,
      iban: iban || null,
    };

    // Only update password if a new one is provided
    if (sifre) {
      const salt = await bcrypt.genSalt(10);
      updateData.sifre = await bcrypt.hash(sifre, salt);
    }

    const guncelPersonel = await prisma.personel.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(guncelPersonel);
  } catch (error: any) {
    console.error('Personel güncellenirken hata:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Bu kullanıcı adı zaten kullanılıyor.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Personel ID gereklidir.' }, { status: 400 });
    }

    await prisma.personel.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Personel silinirken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
