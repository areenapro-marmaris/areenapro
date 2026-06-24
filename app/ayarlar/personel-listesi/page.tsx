"use client";

import { useState, useEffect } from "react";
import { Users, FileSpreadsheet, Search, RefreshCw, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

const rolEtiketleri: Record<string, string> = {
  SUPER_ADMIN: "Genel Müdür",
  YONETICI: "Müdür",
  VEZNE: "Vezne",
  MUHASEBE: "Muhasebe",
  INSAN_KAYNAKLARI: "İnsan Kaynakları",
  PERSONEL: "Genel",
  SEF: "Şef",
};

const rolRenk: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-400 border-red-500/20",
  YONETICI: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  MUHASEBE: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  VEZNE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  INSAN_KAYNAKLARI: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  PERSONEL: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  SEF: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

export default function PersonelListesiPage() {
  const [personeller, setPersoneller] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resMe = await fetch("/api/auth/me");
      if (resMe.ok) {
        const dMe = await resMe.json();
        setCurrentUser(dMe.kullanici);
      }

      const res = await fetch("/api/ayarlar/personel");
      if (res.ok) {
        const data = await res.json();
        // Only list active personnel as requested: "aktif personelleri ve yaninda gorevleri yazsin"
        setPersoneller(data.filter((p: any) => p.aktif));
      }
    } catch (err) {
      console.error("Personel listesi yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter list
  const filteredPersonel = personeller.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.adSoyad.toLowerCase().includes(searchLower) ||
      (p.birim?.ad || "").toLowerCase().includes(searchLower) ||
      (p.gorev || "").toLowerCase().includes(searchLower) ||
      p.kullaniciAdi.toLowerCase().includes(searchLower)
    );
  });

  const exportToExcel = () => {
    const headers = ["Adı Soyadı", "Birim / Departman", "Görevi / Pozisyonu", "IBAN", "PDKS ID"];
    const rows = filteredPersonel.map(p => [
      p.adSoyad,
      p.birim?.ad || 'AREENA',
      p.gorev || '-',
      p.iban || '-',
      p.pdksId || '-'
    ]);

    const csvContent = "\uFEFF" // BOM for UTF-8 compatibility
      + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `personel_listesi_${new Date().toLocaleDateString('tr-TR')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasAccess = currentUser?.rol === "SUPER_ADMIN" || currentUser?.rol === "INSAN_KAYNAKLARI";

  if (loading && !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!hasAccess && !loading) {
    return (
      <div className="glass-panel p-12 text-center text-red-400 font-bold border border-red-500/20">
        Bu sayfaya erişim yetkiniz bulunmamaktadır.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/ayarlar" className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Personel Yönetimi
            </Link>
            <span>/</span>
            <span className="text-slate-200">Personel Listesi</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-400" /> Aktif Personel Listesi
          </h1>
          <p className="text-slate-400 text-sm">Tüm aktif çalışanlar, departmanları ve görevleri.</p>
        </div>
        
        <div className="flex items-center gap-2 self-start md:self-center">
          <button 
            onClick={exportToExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-lg"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel Olarak Dışa Aktar
          </button>
        </div>
      </div>

      {/* Search and stats bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="İsim, birim veya görev ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-sm font-semibold text-slate-300">
          Toplam Aktif Personel: <span className="text-blue-400 text-base">{filteredPersonel.length}</span>
        </div>
      </div>

      {/* Table grid */}
      <div className="glass-panel overflow-hidden border border-slate-700/50 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800/80 text-slate-300 text-xs border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold w-12 text-center">#</th>
                <th className="px-6 py-4 font-semibold">Adı Soyadı</th>
                <th className="px-6 py-4 font-semibold">Birim / Departman</th>
                <th className="px-6 py-4 font-semibold">Görevi / Pozisyonu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredPersonel.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Gösterilecek aktif personel kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredPersonel.map((p, idx) => (
                  <tr key={p.id} className="transition-colors hover:bg-slate-800/30">
                    <td className="px-6 py-3.5 text-slate-500 font-mono text-center">{idx + 1}</td>
                    <td className="px-6 py-3.5 font-bold text-white">{p.adSoyad}</td>
                    <td className="px-6 py-3.5 text-slate-300">
                      {p.birim?.ad || <span className="text-slate-500">Departman Yok</span>}
                    </td>
                    <td className="px-6 py-3.5 text-slate-300">
                      {p.gorev || <span className="text-slate-500">-</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
