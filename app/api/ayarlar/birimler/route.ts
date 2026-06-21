import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const birimler = await prisma.birim.findMany({
      include: {
        yetkililer: {
          select: { id: true, adSoyad: true }
        }
      },
      orderBy: { ad: 'asc' },
    });
    return NextResponse.json(birimler);
  } catch (error) {
    console.error('Birimler listelenirken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ad, yetkiliIds } = await req.json();
    if (!ad) {
      return NextResponse.json({ error: 'Birim adı zorunludur.' }, { status: 400 });
    }

    const data: any = { ad };
    if (yetkiliIds && Array.isArray(yetkiliIds)) {
      data.yetkililer = {
        connect: yetkiliIds.map((uid: string) => ({ id: uid }))
      };
    }

    const yeniBirim = await prisma.birim.create({
      data,
      include: { yetkililer: { select: { id: true, adSoyad: true } } }
    });
    return NextResponse.json(yeniBirim, { status: 201 });
  } catch (error: any) {
    console.error('Birim eklenirken hata:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Bu birim zaten eklenmiş.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ad, yetkiliIds } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Birim ID zorunludur.' }, { status: 400 });
    }

    const updateData: any = {};
    if (ad !== undefined) updateData.ad = ad;
    if (yetkiliIds && Array.isArray(yetkiliIds)) {
      updateData.yetkililer = {
        set: yetkiliIds.map((uid: string) => ({ id: uid }))
      };
    }

    const guncelBirim = await prisma.birim.update({
      where: { id },
      data: updateData,
      include: { yetkililer: { select: { id: true, adSoyad: true } } }
    });
    return NextResponse.json(guncelBirim);
  } catch (error) {
    console.error('Birim güncellenirken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Birim ID gereklidir.' }, { status: 400 });
    }

    await prisma.birim.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Birim silinirken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
