import { Bell, Search, Menu, LogOut, ChevronDown, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Kullanici {
  id: string;
  adSoyad: string;
  kullaniciAdi: string;
  rol: string;
}

interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  okundu: boolean;
  createdAt: string;
}

const rolEtiket: Record<string, string> = {
  SUPER_ADMIN: 'Genel Müdür',
  YONETICI: 'Müdür',
  VEZNE: 'Vezne',
  MUHASEBE: 'Muhasebe',
  PERSONEL: 'Genel',
};

export default function Topbar({
  onMenuClick,
  kullanici,
  onLogout,
}: {
  onMenuClick: () => void;
  kullanici: Kullanici | null;
  onLogout: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);

  const fetchBildirimler = async () => {
    try {
      const res = await fetch('/api/bildirimler');
      const data = await res.json();
      if (data.bildirimler) {
        setBildirimler(data.bildirimler);
      }
    } catch (e) {
      console.error("Bildirimler yüklenirken hata:", e);
    }
  };

  useEffect(() => {
    if (kullanici) {
      fetchBildirimler();
      // 30 saniyede bir bildirimleri arka planda yenile
      const interval = setInterval(fetchBildirimler, 30000);
      return () => clearInterval(interval);
    }
  }, [kullanici]);

  const unreadCount = bildirimler.filter(b => !b.okundu).length;

  const markAllAsRead = async () => {
    try {
      await fetch('/api/bildirimler/oku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      setBildirimler(prev => prev.map(b => ({ ...b, okundu: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/bildirimler/oku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setBildirimler(prev => prev.map(b => b.id === id ? { ...b, okundu: true } : b));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-16 glass sticky top-0 z-40 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-400 hover:text-white mr-4 p-1 rounded-md hover:bg-slate-800/80 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Arama yap..."
            className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-64"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Bildirim Zili ve Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowMenu(false); }}
            className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800/80"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1 min-w-[16px] h-[16px] bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white border border-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 glass border border-slate-700/50 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
                  <span className="text-sm font-semibold text-white">Bildirimler ({unreadCount})</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Tümünü Oku
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-700/50">
                  {bildirimler.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-500">
                      Yeni bir bildirim bulunmuyor.
                    </div>
                  ) : (
                    bildirimler.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => markAsRead(b.id)}
                        className={`px-4 py-3 text-left transition-colors cursor-pointer hover:bg-slate-800/50 ${!b.okundu ? 'bg-blue-500/5 border-l-2 border-blue-500' : ''}`}
                      >
                        <p className={`text-xs font-semibold text-white ${!b.okundu ? 'text-blue-400' : ''}`}>{b.baslik}</p>
                        <p className="text-xs text-slate-300 mt-1">{b.mesaj}</p>
                        <span className="text-[10px] text-slate-500 block mt-1.5">
                          {new Date(b.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Kullanıcı menüsü */}
        {kullanici && (
          <div className="relative">
            <button
              onClick={() => { setShowMenu(!showMenu); setShowNotifications(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/80 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {kullanici.adSoyad.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white leading-tight">{kullanici.adSoyad}</p>
                <p className="text-xs text-slate-400">{rolEtiket[kullanici.rol] || kullanici.rol}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 glass border border-slate-700/50 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700/50">
                    <p className="text-sm font-medium text-white">{kullanici.adSoyad}</p>
                    <p className="text-xs text-slate-400">{rolEtiket[kullanici.rol] || kullanici.rol}</p>
                  </div>
                  <button
                    onClick={() => { setShowMenu(false); onLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Çıkış Yap
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
