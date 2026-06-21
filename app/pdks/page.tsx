"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, AlertTriangle, User, Search, CheckCircle, RefreshCw } from "lucide-react";

interface PdksRecord {
  id: string;
  adSoyad: string;
  departman: string;
  giris: string;
  cikis: string | null;
  kuralDisi: boolean;
  kesinti: number;
  tarih: string;
  eksikCikis?: boolean;
  erkenCikis?: boolean;
  izinliOk?: boolean;
}

export default function PdksPage() {
  const getBusinessMonth = () => {
    const now = new Date();
    if (now.getHours() < 9) now.setDate(now.getDate() - 1);
    return now.toISOString().substring(0, 7); // Format: "YYYY-MM"
  };

  const [selectedMonth, setSelectedMonth] = useState(getBusinessMonth());
  const [records, setRecords] = useState<PdksRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPdks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pdks?tarih=${selectedMonth}`);
      const data = await res.json();
      if (data.kayitlar) {
        setRecords(data.kayitlar);
      }
    } catch (error) {
      console.error("PDKS verileri yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchPdks();
  }, [fetchPdks]);

  const kuralDisiSayisi = records.filter(p => p.kuralDisi).length;
  
  // Seçilen ayı Türkçe formatta göster (Örn: Haziran 2026)
  const displayMonth = new Date(selectedMonth + "-02").toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  // Kayıtları tarih bazında gruplayalım
  const groupedRecords: { [key: string]: PdksRecord[] } = {};
  records.forEach(record => {
    if (!groupedRecords[record.tarih]) {
      groupedRecords[record.tarih] = [];
    }
    groupedRecords[record.tarih].push(record);
  });

  // Tarihleri gün gün azalan sırada (en yeniden eskiye) dizelim
  const sortedDates = Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a));

  // Tarih başlıklarını formatlama (Örn: 8 Haziran 2026 Pazartesi)
  const formatHeaderDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="w-8 h-8 text-violet-400" /> PDKS - Giriş/Çıkış Saatlerim
          </h1>
          <p className="text-slate-400 mt-2 flex items-center gap-3">
            Kişisel parmak izi geçiş geçmişiniz. 
            <strong className="text-white">{displayMonth}</strong>
            <button 
              onClick={fetchPdks} 
              disabled={loading}
              className="text-slate-500 hover:text-white transition-colors"
              title="Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </p>
        </div>
        <div className="relative bg-slate-800 border-2 border-violet-500/50 rounded-xl p-2 hover:border-violet-400 transition-colors group">
          <label className="absolute -top-3 left-3 bg-slate-900 px-2 text-xs font-bold text-violet-400 uppercase">Aylık Filtre</label>
          <div className="flex items-center gap-3 px-3 py-1">
            <Calendar className="w-6 h-6 text-violet-400" />
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
              className="bg-transparent border-none text-white text-lg font-semibold focus:outline-none p-0 cursor-pointer w-[150px] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" 
            />
          </div>
        </div>
      </div>

      {/* Kişisel Özet Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 border-l-4 border-l-violet-500">
          <p className="text-xs text-slate-400 uppercase font-semibold">Toplam Çalışma Günü</p>
          <p className="text-2xl font-bold text-white mt-1">{loading ? "..." : records.length}</p>
        </div>
        <div className="glass-panel p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs text-slate-400 uppercase font-semibold">Zamanında Giriş</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{loading ? "..." : records.length - kuralDisiSayisi}</p>
        </div>
        <div className="glass-panel p-4 border-l-4 border-l-red-500">
          <p className="text-xs text-slate-400 uppercase font-semibold">Geç Giriş (Kural Dışı)</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{loading ? "..." : kuralDisiSayisi}</p>
        </div>
        <div className="glass-panel p-4 border-l-4 border-l-amber-500">
          <p className="text-xs text-slate-400 uppercase font-semibold">Aktif/Açık Vardiya</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{loading ? "..." : records.filter(p => !p.cikis && !p.eksikCikis).length}</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800/80 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold w-[35%]">Giriş Saati</th>
                <th className="px-6 py-4 font-semibold w-[35%]">Çıkış Saati</th>
                <th className="px-6 py-4 font-semibold text-center w-[30%]">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-20" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-700 rounded w-16 mx-auto" /></td>
                  </tr>
                ))
              ) : sortedDates.length > 0 ? (
                sortedDates.map((dateStr) => (
                  <tr key={dateStr} className="border-t border-slate-700/50">
                    <td colSpan={3} className="p-0">
                      <table className="w-full text-left text-sm">
                        <tbody>
                          {/* Gün Başlığı Satırı */}
                          <tr className="bg-slate-800/50">
                            <td colSpan={3} className="px-6 py-3 font-bold text-violet-400">
                              {formatHeaderDate(dateStr)}
                            </td>
                          </tr>
                          {/* Günün Kayıtları */}
                          {groupedRecords[dateStr].map((p) => (
                            <tr key={p.id} className={`transition-colors duration-300 ${p.kuralDisi ? 'bg-red-900/10 hover:bg-red-900/20' : 'hover:bg-slate-800/50'} border-t border-slate-700/20`}>
                              <td className="px-6 py-4 w-[35%]">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-slate-400" />
                                  <span className="font-mono text-white bg-slate-700/50 px-2.5 py-1 rounded text-base">{p.giris}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 w-[35%]">
                                {p.cikis ? (
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className={`font-mono px-2.5 py-1 rounded text-base ${p.erkenCikis ? 'text-red-400 bg-red-950/20 border border-red-500/20 font-bold' : 'text-white bg-slate-700/50'}`}>
                                      {p.cikis} {p.erkenCikis && "⚠️"}
                                    </span>
                                  </div>
                                ) : p.eksikCikis ? (
                                  <span className="text-red-400 font-bold text-sm ml-6">⚠️ Eksik Çıkış (Cezalı)</span>
                                ) : (
                                  <span className="text-amber-400 font-medium text-sm animate-pulse ml-6">● Mesai Devam Ediyor</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center w-[30%]">
                                {p.izinliOk ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                                    <CheckCircle className="w-3.5 h-3.5" /> İzinli OK
                                  </span>
                                ) : p.kuralDisi ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                                    <AlertTriangle className="w-3.5 h-3.5" /> {p.eksikCikis ? "Eksik Çıkış (Cezalı)" : p.erkenCikis ? "Erken Çıkış (Cezalı)" : "Geç Giriş (Cezalı)"}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                    <CheckCircle className="w-3.5 h-3.5" /> Normal
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-base">
                    Bu ay için parmak izi geçiş kaydınız bulunmamaktadır.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
