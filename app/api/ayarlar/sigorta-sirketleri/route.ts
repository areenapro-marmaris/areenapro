import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const sirketler = await prisma.sigortaSirketi.findMany({
      orderBy: { ad: 'asc' },
    });
    return NextResponse.json(sirketler);
  } catch (error) {
    console.error('Sigorta şirketleri listelenirken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ad } = await req.json();
    if (!ad) {
      return NextResponse.json({ error: 'Sigorta şirketi adı zorunludur.' }, { status: 400 });
    }

    const yeniSirket = await prisma.sigortaSirketi.create({
      data: { ad },
    });
    return NextResponse.json(yeniSirket, { status: 201 });
  } catch (error: any) {
    console.error('Sigorta şirketi eklenirken hata:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Bu sigorta şirketi zaten eklenmiş.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Sigorta şirketi ID gereklidir.' }, { status: 400 });
    }

    await prisma.sigortaSirketi.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sigorta şirketi silinirken hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
