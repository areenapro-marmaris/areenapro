"use client";

import { useEffect, useState, useCallback } from 'react';
import { Activity, CreditCard, Users, TrendingUp, RefreshCw, Wifi, WifiOff, Clock, ArrowUpRight } from 'lucide-react';

interface PersonelSatis {
  adSoyad: string;
  departman: string;
  satis: number;
  masaSayisi: number;
}

interface RaporData {
  tarih: string;
  toplamSatis: number;
  personelListesi: PersonelSatis[];
  sonGuncelleme: string;
  source: 'elektraweb' | 'mock' | 'cache';
  cacheAge?: string;
}

export default function Home() {
  const [data, setData] = useState<RaporData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/elektraweb');
      if (!res.ok) return;
      const json = await res.json();
      if (!json.error) {
        setData(json);
        setLastRefresh(new Date());
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toplamSatis = data?.toplamSatis || 0;
  const personeller = data?.personelListesi || [];
  const aktifGarson = personeller.filter(p => p.satis > 0).length;
  const ortSatis = aktifGarson > 0 ? Math.round(toplamSatis / aktifGarson) : 0;
  const isMock = data?.source === 'mock';
  const isElektra = data?.source === 'elektraweb' || data?.source === 'cache';

  const enYuksek = personeller.length > 0 ? [...personeller].sort((a, b) => b.satis - a.satis)[0] : null;

  const stats = [
    {
      title: "Anlık Ciro",
      value: loading ? '—' : `₺${toplamSatis.toLocaleString('tr-TR')}`,
      sub: isElektra ? 'ElektraWeb Canlı ✓' : 'Demo Veri',
      icon: Activity,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-l-blue-500"
    },
    {
      title: "Aktif Garson",
      value: loading ? '—' : `${aktifGarson}`,
      sub: loading ? '' : `${personeller.length} personel toplamda`,
      icon: Users,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-l-indigo-500"
    },
    {
      title: "Ortalama Satış",
      value: loading ? '—' : `₺${ortSatis.toLocaleString('tr-TR')}`,
      sub: "Garson başına",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-l-emerald-500"
    },
    {
      title: "En Yüksek Satış",
      value: loading ? '—' : (enYuksek ? `₺${enYuksek.satis.toLocaleString('tr-TR')}` : '—'),
      sub: loading ? '' : (enYuksek ? enYuksek.adSoyad : '—'),
      icon: ArrowUpRight,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-l-amber-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Yönetim Özeti</h1>
          <p className="text-slate-400 mt-2">Club Areena genel durum ve anlık veriler.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Bağlantı durumu */}
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${isMock ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
            {isMock ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            {isMock ? 'Demo Veri' : 'ElektraWeb Bağlı ✓'}
          </div>
          {lastRefresh && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              {lastRefresh.toLocaleTimeString('tr-TR')}
            </div>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm transition-colors border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Yükleniyor...' : 'Yenile'}
          </button>
        </div>
      </div>

      {/* 4 Stat Kart */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className={`glass-panel p-6 flex flex-col justify-between border-l-4 ${stat.border} group hover:bg-slate-800/80 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">{stat.title}</p>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className={`text-3xl font-bold text-white ${loading ? 'animate-pulse text-slate-600' : ''}`}>{stat.value}</h3>
              <p className="text-xs text-slate-500 mt-2">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alt Alan: Garson Listesi + Sağ Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Garson Satış Tablosu */}
        <div className="lg:col-span-2 glass-panel overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Garson Anlık Satış Sıralaması</h3>
              <p className="text-xs text-slate-400 mt-0.5">{isMock ? 'Demo veri' : 'ElektraWeb canlı verisi'}</p>
            </div>
            {data?.tarih && (
              <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                {new Date(data.tarih).toLocaleDateString('tr-TR')}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">Personel</th>
                  <th className="px-5 py-3 font-medium text-center">Masa</th>
                  <th className="px-5 py-3 font-medium text-right">Satış</th>
                  <th className="px-5 py-3 font-medium text-right">Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-3"><div className="w-6 h-6 bg-slate-700 rounded-full" /></td>
                      <td className="px-5 py-3"><div className="h-4 bg-slate-700 rounded w-28" /></td>
                      <td className="px-5 py-3"><div className="h-4 bg-slate-700 rounded w-8 mx-auto" /></td>
                      <td className="px-5 py-3"><div className="h-4 bg-slate-700 rounded w-20 ml-auto" /></td>
                      <td className="px-5 py-3"><div className="h-4 bg-slate-700 rounded w-10 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  [...personeller].sort((a, b) => b.satis - a.satis).map((p, i) => (
                    <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-400 text-slate-900' : i === 1 ? 'bg-slate-400 text-slate-900' : i === 2 ? 'bg-orange-700 text-white' : 'bg-slate-700 text-slate-300'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {p.adSoyad.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{p.adSoyad}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center text-slate-300">{p.masaSayisi}</td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-400">₺{p.satis.toLocaleString('tr-TR')}</td>
                      <td className="px-5 py-3 text-right text-slate-400 text-xs font-mono">
                        %{toplamSatis ? ((p.satis / toplamSatis) * 100).toFixed(1) : '0.0'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {!loading && personeller.length > 0 && (
                <tfoot className="bg-slate-800/50 border-t-2 border-slate-700">
                  <tr>
                    <td colSpan={3} className="px-5 py-3 font-bold text-white">TOPLAM</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-400 text-base">₺{toplamSatis.toLocaleString('tr-TR')}</td>
                    <td className="px-5 py-3 text-right text-slate-400 font-mono">%100</td>
                  </tr>
                </tfoot>
              )}
            </table>
            {!loading && personeller.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Henüz veri yok veya sistem bağlantısı kurulamadı.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sağ Panel */}
        <div className="space-y-4">
          {/* Kaynak bilgisi */}
          <div className="glass-panel p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Veri Kaynağı</h3>
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${isMock ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {isMock ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              <span>{isMock ? 'Demo Mod' : data?.source === 'cache' ? `Cache (${data.cacheAge})` : 'ElektraWeb Canlı'}</span>
            </div>
            {lastRefresh && (
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Son güncelleme: {lastRefresh.toLocaleTimeString('tr-TR')}
              </p>
            )}
            <p className="text-xs text-slate-600 mt-2">Her 5 dakikada otomatik yenilenir</p>
          </div>

          {/* En iyi 3 garson */}
          {!loading && personeller.length > 0 && (
            <div className="glass-panel p-5">
              <h3 className="text-sm font-semibold text-white mb-4">🏆 Bu Gecenin En İyileri</h3>
              <div className="space-y-3">
                {[...personeller].sort((a, b) => b.satis - a.satis).slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : 'text-orange-600'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                      </span>
                      <span className="text-sm text-white truncate max-w-[100px]">{p.adSoyad}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">₺{p.satis.toLocaleString('tr-TR')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diğer modüller linki */}
          <div className="glass-panel p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Diğer Modüller</h3>
            <div className="space-y-2">
              {[
                { name: 'Anlık Sistem', href: '/sistemler', icon: Activity, color: 'text-blue-400' },
                { name: 'PDKS / Vardiya', href: '/pdks', icon: Clock, color: 'text-indigo-400' },
                { name: 'Vezne / Kasa', href: '/vezne', icon: CreditCard, color: 'text-emerald-400' },
                { name: 'Personel & Kasa', href: '/personel-kasa', icon: Users, color: 'text-purple-400' },
              ].map((item, i) => (
                <a key={i} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors group">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{item.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
