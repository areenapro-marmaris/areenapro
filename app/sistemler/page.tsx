"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, TrendingUp, Users, ArrowUpRight, Wifi, WifiOff, Clock } from "lucide-react";

interface PersonelSatis {
  adSoyad: string;
  departman: string;
  satis: number;
  masaSayisi: number;
}

interface RaporData {
  tarih: string;
  toplamSatis: number;
  dunkuSatis?: number;
  gecenHaftaSatis?: number;
  personelListesi: PersonelSatis[];
  sonGuncelleme: string;
  source: 'elektraweb' | 'mock' | 'cache';
  cacheAge?: string;
  mesaj?: string;
}

export default function SistemlerPage() {
  const [data, setData] = useState<RaporData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const [prevSales, setPrevSales] = useState<number | null>(null);
  const [salesDiff, setSalesDiff] = useState<number | null>(null);
  const [timeDiffText, setTimeDiffText] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/elektraweb${forceRefresh ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Sunucu hatası: ' + res.status);
      const json = await res.json();
      if (json.error) throw new Error(json.detay || json.error);
      
      setData((currentData) => {
        if (currentData) {
          const oldSales = currentData.toplamSatis;
          const newSales = json.toplamSatis;
          const diff = newSales - oldSales;
          setSalesDiff(diff);
          setPrevSales(oldSales);
        }
        return json;
      });

      setLastRefresh((prevDate) => {
        const now = new Date();
        if (prevDate) {
          const elapsedMs = now.getTime() - prevDate.getTime();
          const elapsedMin = Math.round(elapsedMs / 1000 / 60);
          if (elapsedMin <= 0) {
            const elapsedSec = Math.round(elapsedMs / 1000);
            setTimeDiffText(`${elapsedSec} saniye`);
          } else {
            setTimeDiffText(`${elapsedMin} dakika`);
          }
        }
        return now;
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Her 5 dakikada bir otomatik yenile
    const interval = setInterval(() => fetchData(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toplamSatis = data?.toplamSatis || 0;
  const dunkuSatis = data?.dunkuSatis || 0;
  const gecenHaftaSatis = data?.gecenHaftaSatis || 0;
  const personeller = data?.personelListesi || [];
  const isMock = data?.source === 'mock';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-400" /> Anlık Sistem
          </h1>
          <p className="text-slate-400 mt-2">ElektraWeb entegrasyonu ile garson satışları</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Bağlantı Durumu */}
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${isMock ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
            {isMock ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            {isMock ? 'Demo Veri (ElektraWeb Bağlantısı Yok)' : 'ElektraWeb Bağlı ✓'}
          </div>

          {/* Son Güncelleme */}
          {lastRefresh && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              {lastRefresh.toLocaleTimeString('tr-TR')}
            </div>
          )}

          {/* Yenile Butonu */}
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm transition-colors border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Yükleniyor...' : 'Yenile'}
          </button>
        </div>
      </div>

      {/* Mock uyarı */}
      {isMock && data?.mesaj && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-400 text-sm flex items-start gap-3">
          <WifiOff className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">ElektraWeb bağlantısı henüz kurulmadı</p>
            <p className="text-amber-400/70 mt-1">
              Gerçek verileri görmek için <code className="bg-amber-500/20 px-1 rounded">.env</code> dosyasındaki <code className="bg-amber-500/20 px-1 rounded">ELEKTRAWEB_URL</code>, <code className="bg-amber-500/20 px-1 rounded">ELEKTRAWEB_USER</code> ve <code className="bg-amber-500/20 px-1 rounded">ELEKTRAWEB_PASS</code> alanlarını doldurun.
            </p>
          </div>
        </div>
      )}

      {/* Hata mesajı */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          <p className="font-semibold">Veri çekilemedi:</p>
          <p className="mt-1 text-red-400/70">{error}</p>
        </div>
      )}

      {/* Dünkü ve Geçen Haftaki Ciro Karşılaştırma Uyarısı */}
      {!loading && (dunkuSatis > 0 || gecenHaftaSatis > 0) && (() => {
        const gunler = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
        const gunAdi = data?.tarih ? gunler[new Date(data.tarih).getDay()] : "Perşembe";
        return (
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 space-y-3 shadow-lg">
            {/* Üst Satır: Dünkü Ciro Karşılaştırması */}
            {dunkuSatis > 0 && (() => {
              const fark = toplamSatis - dunkuSatis;
              return (
                <div className="flex items-center gap-3 text-sm">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${fark < 0 ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${fark < 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                  </span>
                  <div className={`font-semibold ${fark < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    Dünkü ciroya göre <span className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">₺{Math.abs(fark).toLocaleString('tr-TR')}</span> {fark < 0 ? 'geridesiniz' : 'öndesiniz'}
                  </div>
                </div>
              );
            })()}

            {/* Alt Satır: Geçen Haftaki Ciro Karşılaştırması */}
            {gecenHaftaSatis > 0 && (() => {
              const farkHaftalik = toplamSatis - gecenHaftaSatis;
              return (
                <div className="flex items-center gap-3 text-sm pt-3 border-t border-slate-800">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${farkHaftalik < 0 ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${farkHaftalik < 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                  </span>
                  <div className={`font-semibold ${farkHaftalik < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    Geçen hafta {gunAdi} cirosuna göre <span className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">₺{Math.abs(farkHaftalik).toLocaleString('tr-TR')}</span> {farkHaftalik < 0 ? 'geridesiniz' : 'öndesiniz'}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400 uppercase font-semibold">Toplam Satış</p>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {loading ? <span className="animate-pulse text-slate-600">₺—</span> : `₺${toplamSatis.toLocaleString('tr-TR')}`}
          </p>
          <div className="flex flex-col gap-0.5 mt-1">
            <p className="text-xs text-slate-500">{data?.cacheAge || `Son: ${data?.sonGuncelleme || '—'}`}</p>
            {salesDiff !== null && (
              <p className={`text-xs font-semibold flex items-center gap-1 ${salesDiff > 0 ? 'text-emerald-400' : salesDiff < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {salesDiff > 0 ? `+₺${salesDiff.toLocaleString('tr-TR')}` : salesDiff < 0 ? `-₺${Math.abs(salesDiff).toLocaleString('tr-TR')}` : 'Değişim yok'}
                {timeDiffText && <span className="text-[10px] text-slate-500 font-normal">({timeDiffText} önceki yenilemeye göre)</span>}
              </p>
            )}
          </div>
        </div>
        <div className="glass-panel p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400 uppercase font-semibold">Aktif Garson</p>
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {loading ? <span className="animate-pulse text-slate-600">—</span> : personeller.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Satış girilen personel</p>
        </div>
        <div className="glass-panel p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400 uppercase font-semibold">Ortalama Satış</p>
            <ArrowUpRight className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {loading ? <span className="animate-pulse text-slate-600">₺—</span> : `₺${personeller.length ? Math.round(toplamSatis / personeller.length).toLocaleString('tr-TR') : '0'}`}
          </p>
          <p className="text-xs text-slate-500 mt-1">Personel başı ortalama</p>
        </div>
      </div>

      {/* Garson Satış Tablosu */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Garson / Personel Anlık Satış Listesi</h3>
            <p className="text-xs text-slate-400 mt-0.5">{isMock ? 'Demo veri gösteriliyor' : 'ElektraWeb\'ten çekilen canlı veriler'}</p>
          </div>
          {data?.tarih && <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">{new Date(data.tarih).toLocaleDateString('tr-TR')}</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800/80 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Sıra</th>
                <th className="px-6 py-4 font-semibold">Personel</th>
                <th className="px-6 py-4 font-semibold text-center">Ürün Adeti</th>
                <th className="px-6 py-4 font-semibold text-right">Satış Tutarı</th>
                <th className="px-6 py-4 font-semibold text-right">Pay %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-7 h-7 bg-slate-700 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-32" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-700 rounded w-8 mx-auto" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-700 rounded w-24 ml-auto" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-700 rounded w-12 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                [...personeller].sort((a, b) => b.satis - a.satis).map((p, i) => (
                  <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-400 text-slate-900' : i === 1 ? 'bg-slate-400 text-slate-900' : i === 2 ? 'bg-orange-700 text-white' : 'bg-slate-700 text-slate-300'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {p.adSoyad.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        {p.adSoyad}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-white font-medium">{p.masaSayisi}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-400">₺{p.satis.toLocaleString('tr-TR')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden hidden md:block">
                          <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${toplamSatis ? (p.satis / toplamSatis) * 100 : 0}%` }} />
                        </div>
                        <span className="text-slate-400 text-xs font-mono">%{toplamSatis ? ((p.satis / toplamSatis) * 100).toFixed(1) : '0.0'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && personeller.length > 0 && (
              <tfoot className="bg-slate-800/50 border-t-2 border-slate-700">
                <tr>
                  <td colSpan={3} className="px-6 py-4 font-bold text-white">TOPLAM</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-400 text-lg">₺{toplamSatis.toLocaleString('tr-TR')}</td>
                  <td className="px-6 py-4 text-right text-slate-400 font-mono">%100</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
