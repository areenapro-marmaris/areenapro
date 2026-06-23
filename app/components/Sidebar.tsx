import Link from 'next/link';
import {
  Activity,
  Briefcase,
  Calendar,
  CreditCard,
  FileText,
  Home,
  Settings,
  Users,
  X,
  ShieldCheck,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

interface Kullanici {
  id: string;
  adSoyad: string;
  kullaniciAdi: string;
  rol: string;
}

const navItems = [
  { name: 'Anlık Sistem', href: '/sistemler', icon: Activity },
  { name: 'Vezne Yönetimi', href: '/vezne', icon: CreditCard },
  { name: 'PDKS', href: '/pdks', icon: Calendar },
  { name: 'Personel Kasa', href: '/personel-kasa', icon: Briefcase },
  { name: 'Personel Ayarları', href: '/ayarlar', icon: Users },
  { name: 'Dilekçe & Tutanak', href: '/dilekceler', icon: FileText },
  { name: 'Genel Ayarlar', href: '/genel-ayarlar', icon: Settings },
];

const rolEtiket: Record<string, string> = {
  SUPER_ADMIN: 'Genel Müdür',
  YONETICI: 'Müdür',
  VEZNE: 'Vezne',
  MUHASEBE: 'Muhasebe',
  INSAN_KAYNAKLARI: 'İnsan Kaynakları',
  PERSONEL: 'Genel',
};

export default function Sidebar({
  isOpen,
  setIsOpen,
  kullanici,
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  kullanici: Kullanici | null;
}) {
  const pathname = usePathname();

  return (
    <div
      className={`w-64 glass flex flex-col h-screen fixed left-0 top-0 text-slate-300 z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-700/50">
        <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Club Areena
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <Link
          href="/"
          onClick={() => setIsOpen(false)}
          className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all group ${pathname === '/' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-slate-800/80'}`}
        >
          <Home className={`w-5 h-5 transition-colors ${pathname === '/' ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`} />
          <span className={`font-medium transition-colors ${pathname === '/' ? 'text-blue-400' : 'group-hover:text-white'}`}>Ana Sayfa</span>
        </Link>

        <div className="pt-4 pb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">Modüller</p>
        </div>

        {navItems.map((item) => {
          // Rol bazlı menü filtreleme
          const rol = kullanici?.rol;
          if (rol === 'YONETICI' && (
            item.href === '/sistemler' ||
            item.href === '/personel-kasa' ||
            item.href === '/ayarlar' ||
            item.href === '/genel-ayarlar'
          )) return null;
          if (rol === 'VEZNE' && (item.href === '/ayarlar' || item.href === '/genel-ayarlar')) return null;
          if (rol === 'INSAN_KAYNAKLARI' && item.href !== '/pdks' && item.href !== '/dilekceler' && item.href !== '/ayarlar' && item.href !== '/genel-ayarlar') return null;
          if (rol === 'PERSONEL' && item.href !== '/pdks' && item.href !== '/dilekceler') return null;

           const isYoneticiPath = pathname.startsWith('/dilekceler/yonetici');
          const isPersonelListPath = pathname.startsWith('/ayarlar/personel-listesi');
          const isActive = (isYoneticiPath || isPersonelListPath) ? false : (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)));
          
          const linkEl = (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all group ${isActive ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-slate-800/80'}`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`} />
              <span className={`font-medium transition-colors ${isActive ? 'text-blue-400' : 'group-hover:text-white'}`}>{item.name}</span>
            </Link>
          );

          const isManager = kullanici?.rol === 'SUPER_ADMIN' || kullanici?.rol === 'YONETICI';
          if (item.href === '/dilekceler' && isManager) {
            return (
              <div key="dilekce-group" className="space-y-1">
                {linkEl}
                <Link
                  href="/dilekceler/yonetici"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 pl-8 pr-3 py-2 rounded-lg transition-all group ${isYoneticiPath ? 'bg-indigo-500/20 text-indigo-400 font-bold border-l-2 border-indigo-500' : 'hover:bg-slate-800/80'}`}
                >
                  <ShieldCheck className={`w-4 h-4 transition-colors ${isYoneticiPath ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                  <span className={`text-sm font-medium transition-colors ${isYoneticiPath ? 'text-indigo-400' : 'group-hover:text-white'}`}>Tutanaklar Yönetici</span>
                </Link>
              </div>
            );
          }

          if (item.href === '/ayarlar' && (rol === 'SUPER_ADMIN' || rol === 'INSAN_KAYNAKLARI')) {
            return (
              <div key="ayarlar-group" className="space-y-1">
                {linkEl}
                <Link
                  href="/ayarlar/personel-listesi"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 pl-8 pr-3 py-2 rounded-lg transition-all group ${isPersonelListPath ? 'bg-indigo-500/20 text-indigo-400 font-bold border-l-2 border-indigo-500' : 'hover:bg-slate-800/80'}`}
                >
                  <Users className={`w-4 h-4 transition-colors ${isPersonelListPath ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                  <span className={`text-sm font-medium transition-colors ${isPersonelListPath ? 'text-indigo-400' : 'group-hover:text-white'}`}>Personel Listesi</span>
                </Link>
              </div>
            );
          }

          return linkEl;
        })}

        {/* Süper Admin veya İnsan Kaynakları Paneli */}
        {(kullanici?.rol === 'SUPER_ADMIN' || kullanici?.rol === 'INSAN_KAYNAKLARI') && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-xs font-semibold text-amber-500/70 uppercase tracking-wider px-3">Yönetim</p>
            </div>
            <Link
              href="/admin/kullanicilar"
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all group ${pathname.startsWith('/admin') ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-slate-800/80'}`}
            >
              <ShieldCheck className={`w-5 h-5 transition-colors ${pathname.startsWith('/admin') ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
              <span className={`font-medium transition-colors ${pathname.startsWith('/admin') ? 'text-amber-400' : 'group-hover:text-white'}`}>Kullanıcı Yönetimi</span>
            </Link>
          </>
        )}
      </div>

      {/* Kullanıcı */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shrink-0 text-xs">
            {kullanici ? kullanici.adSoyad.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '??'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{kullanici?.adSoyad || 'Yükleniyor...'}</p>
            <p className="text-xs text-slate-400">{kullanici ? (rolEtiket[kullanici.rol] || kullanici.rol) : ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
