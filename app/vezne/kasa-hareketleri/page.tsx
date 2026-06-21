"use client";

import { useState } from "react";
import { ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Calendar as CalendarIcon, Search } from "lucide-react";

const initialHareketler = [
  { id: "1", tur: "GELIR", aciklama: "Tur Ödemesi - SkyTour (45 kişi)", miktar: 4500, tarih: "2026-06-04", kaynak: "Tur/Otobüs" },
  { id: "2", tur: "GIDER", aciklama: "Manav Ödemesi (Meyve)", miktar: 3500, tarih: "2026-06-04", kaynak: "Ödemeler" },
  { id: "3", tur: "GELIR", aciklama: "Tur Ödemesi - Pegasus Travel (32 kişi)", miktar: 3200, tarih: "2026-06-04", kaynak: "Tur/Otobüs" },
  { id: "4", tur: "GIDER", aciklama: "Tesisatçı (Boru Tamiri)", miktar: 1200, tarih: "2026-06-04", kaynak: "Ödemeler" },
  { id: "5", tur: "GIDER", aciklama: "Taksi Ücreti", miktar: 450, tarih: "2026-06-04", kaynak: "Ödemeler" },
  { id: "6", tur: "GIDER", aciklama: "Cari - Ahmet Korkmaz", miktar: 2500, tarih: "2026-06-04", kaynak: "Cari" },
];

export default function KasaHareketleriPage() {
  const getBusinessDate = () => {
    const now = new Date();
    if (now.getHours() < 9) now.setDate(now.getDate() - 1);
    return now.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getBusinessDate());
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"TUMU" | "GELIR" | "GIDER">("TUMU");

  const filtered = initialHareketler.filter(h =>
    h.tarih === selectedDate &&
    (filter === "TUMU" || h.tur === filter) &&
    (h.aciklama.toLowerCase().includes(searchTerm.toLowerCase()) || h.kaynak.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalGelir = initialHareketler.filter(h => h.tarih === selectedDate && h.tur === "GELIR").reduce((a, h) => a + h.miktar, 0);
  const totalGider = initialHareketler.filter(h => h.tarih === selectedDate && h.tur === "GIDER").reduce((a, h) => a + h.miktar, 0);
  const netBakiye = totalGelir - totalGider;
  const displayDate = new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <ArrowRightLeft className="w-8 h-8 text-emerald-400" /> Kasa Hareketleri
          </h1>
          <p className="text-slate-400 mt-2">Operasyon Gecesi: <strong className="text-white">{displayDate}</strong></p>
        </div>
        <div className="relative bg-slate-800 border-2 border-emerald-500/50 rounded-xl p-2 hover:border-emerald-400 transition-colors group">
          <label className="absolute -top-3 left-3 bg-slate-900 px-2 text-xs font-bold text-emerald-400 uppercase">Tarih Filtresi</label>
          <div className="flex items-center gap-3 px-3 py-1">
            <CalendarIcon className="w-6 h-6 text-emerald-400" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none text-white text-lg font-semibold focus:outline-none p-0 cursor-pointer w-[150px] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
          </div>
        </div>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Toplam Gelir</p>
          <p className="text-2xl font-bold text-emerald-400 flex items-center gap-2"><ArrowUpRight className="w-5 h-5" />₺{totalGelir.toLocaleString('tr-TR')}</p>
        </div>
        <div className="glass-panel p-5 border-l-4 border-l-rose-500">
          <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Toplam Gider</p>
          <p className="text-2xl font-bold text-rose-400 flex items-center gap-2"><ArrowDownLeft className="w-5 h-5" />₺{totalGider.toLocaleString('tr-TR')}</p>
        </div>
        <div className={`glass-panel p-5 border-l-4 ${netBakiye >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
          <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Net Kasa</p>
          <p className={`text-2xl font-bold flex items-center gap-2 ${netBakiye >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
            {netBakiye >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            ₺{Math.abs(netBakiye).toLocaleString('tr-TR')}
          </p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2">
            {(["TUMU", "GELIR", "GIDER"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? (f === "GELIR" ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : f === "GIDER" ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30') : 'text-slate-400 hover:text-white hover:bg-slate-800/80'}`}>
                {f === "TUMU" ? "Tümü" : f === "GELIR" ? "Gelirler" : "Giderler"}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Açıklama veya kaynak ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800/80 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Tür</th>
                <th className="px-6 py-4 font-semibold">Açıklama</th>
                <th className="px-6 py-4 font-semibold">Kaynak</th>
                <th className="px-6 py-4 font-semibold text-right">Miktar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map(h => (
                <tr key={h.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    {h.tur === "GELIR" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Gelir
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20">
                        <ArrowDownLeft className="w-3.5 h-3.5" /> Gider
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{h.aciklama}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded text-xs text-slate-400 bg-slate-700/50">{h.kaynak}</span>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${h.tur === "GELIR" ? "text-emerald-400" : "text-rose-400"}`}>
                    {h.tur === "GELIR" ? "+" : "-"}₺{h.miktar.toLocaleString('tr-TR')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Bu tarih için hareket kaydı bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
