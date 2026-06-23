"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface Kullanici {
  id: string;
  adSoyad: string;
  kullaniciAdi: string;
  rol: string;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.kullanici) setKullanici(d.kullanici); })
      .catch(() => {});
  }, [pathname]);

  // Rol bazlı sayfa erişim kontrolü
  useEffect(() => {
    if (!kullanici) return;

    const rol = kullanici.rol;
    
    // Genel (PERSONEL) yetkisi: Sadece Dilekçe/Tutanak ve PDKS ekranlarına erişebilir
    if (rol === 'PERSONEL') {
      const allowedPaths = ['/dilekceler', '/pdks', '/login', '/'];
      const isAllowed = allowedPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
      if (!isAllowed) {
        router.push('/');
      }
    }

    // İnsan Kaynakları (INSAN_KAYNAKLARI) yetkisi: Dilekçe/Tutanak, PDKS ve Personel Ayarları (ayarlar) açık
    if (rol === 'INSAN_KAYNAKLARI') {
      const allowedPaths = ['/dilekceler', '/pdks', '/login', '/', '/ayarlar'];
      const isAllowed = allowedPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
      if (!isAllowed) {
        router.push('/');
      }
    }
    
    // Vezne (VEZNE) yetkisi: Dilekçeleri görme (yonetici), Personel Ayarları, Genel Ayarlar hariç açık
    if (rol === 'VEZNE') {
      const restrictedPaths = ['/ayarlar', '/genel-ayarlar', '/dilekceler/yonetici', '/admin'];
      const isRestricted = restrictedPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
      if (isRestricted) {
        router.push('/');
      }
    }

    // Müdür (YONETICI) yetkisi: Anlık Sistem, admin, personel-kasa, ayarlar ve genel-ayarlar hariç açık
    if (rol === 'YONETICI') {
      const restrictedPaths = [
        '/sistemler',
        '/admin',
        '/personel-kasa',
        '/ayarlar',
        '/genel-ayarlar'
      ];
      const isRestricted = restrictedPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
      if (isRestricted) {
        router.push('/');
      }
    }
  }, [kullanici, pathname, router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // Login sayfasında Sidebar ve Topbar gösterilmemeli
  if (pathname === "/login") {
    return (
      <div className="min-h-screen bg-slate-950">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} kullanici={kullanici} />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full">
        <Topbar
          onMenuClick={() => setIsSidebarOpen(true)}
          kullanici={kullanici}
          onLogout={handleLogout}
        />
        <main className="flex-1 p-4 md:p-6 relative z-10 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
