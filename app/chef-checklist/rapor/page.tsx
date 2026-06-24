"use client";

import { useState, useEffect } from "react";
import { 
  ClipboardList, BarChart3, TrendingUp, AlertTriangle, 
  User, Check, Info, ShieldAlert, Calendar
} from "lucide-react";

const SORULAR = [
  { key: "isletmeHijyen", label: "İşletmedeki Genel hijyen durumu" },
  { key: "personelUniforma", label: "İşletmedeki genel personel üniforma ve hijyen durumu" },
  { key: "masaSetup", label: "Masa setup ve düzen durumu" },
  { key: "komiTasima", label: "Komiler ürünlerini zamanında standartlara uygun olarak taşıyorlar mı?" },
  { key: "garsonServis", label: "Garsonlar ürünlerini zamanında standartlara uygun olarak masalarına servis ediyorlar mı?" },
  { key: "personelDevamlilik", label: "Personelin işe devamlılığı nasıl?" },
  { key: "hesapTahsilat", label: "Personel hesap tahsilatı standartlara uygun mu?" },
  { key: "satisTaktik", label: "Satış personeli satış taktikleri uyguluyor mu?" },
  { key: "garsonPortfoy", label: "Garson müşterisiyle portföy oluşturmak için çaba gösteriyor mu?" },
  { key: "musteriMemnuniyeti", label: "Müşteri memnuniyeti ne durumda?" }
];

export default function ChefChecklistRaporPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [personeller, setPersoneller] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [reportPersonelId, setReportPersonelId] = useState("");
  const [reportTimeframe, setReportTimeframe] = useState<"haftalik" | "aylik" | "tumu">("aylik");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resMe, resP, resC] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/ayarlar/personel"),
        fetch("/api/chef-checklist")
      ]);

      if (resMe.ok) {
        const dMe = await resMe.json();
        setCurrentUser(dMe.kullanici);
        if (dMe.kullanici?.rol !== "SUPER_ADMIN") {
          window.location.href = "/";
          return;
        }
      }

      if (resP.ok) {
        const dP = await resP.json();
        setPersoneller(dP.filter((p: any) => p.aktif));
      }

      if (resC.ok) {
        setChecklists(await resC.json());
      }
    } catch (err) {
      console.error("Veriler alınırken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-sm">Yükleniyor...</div>;
  }

  if (currentUser?.rol !== "SUPER_ADMIN") {
    return <div className="text-red-400 text-sm">Yetkisiz erişim.</div>;
  }

  // Aggregated Report Calculations
  const getFilteredChecklists = () => {
    const now = new Date();
    return checklists.filter((chk) => {
      if (reportPersonelId && chk.personelId !== reportPersonelId) return false;

      const chkDate = new Date(chk.tarih);
      if (reportTimeframe === "haftalik") {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (chkDate < oneWeekAgo) return false;
      } else if (reportTimeframe === "aylik") {
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (chkDate < oneMonthAgo) return false;
      }
      return true;
    });
  };

  const filteredData = getFilteredChecklists();

  // Compute Statistics
  const computeStats = () => {
    const totalChecklists = filteredData.length;
    if (totalChecklists === 0) return null;

    let totalIyi = 0;
    let totalNormal = 0;
    let totalKotu = 0;

    const questionStats = SORULAR.map((q) => {
      let iyi = 0;
      let normal = 0;
      let kotu = 0;

      filteredData.forEach((chk) => {
        const val = chk[q.key];
        if (val === "IYI") {
          iyi++;
          totalIyi++;
        } else if (val === "NORMAL") {
          normal++;
          totalNormal++;
        } else if (val === "KOTU") {
          kotu++;
          totalKotu++;
        }
      });

      return {
        key: q.key,
        label: q.label,
        iyi,
        normal,
        kotu,
        total: totalChecklists,
        iyiPct: Math.round((iyi / totalChecklists) * 100),
        normalPct: Math.round((normal / totalChecklists) * 100),
        kotuPct: Math.round((kotu / totalChecklists) * 100),
      };
    });

    const overallTotal = totalIyi + totalNormal + totalKotu;
    const overallIyiPct = overallTotal > 0 ? Math.round((totalIyi / overallTotal) * 100) : 0;
    const overallNormalPct = overallTotal > 0 ? Math.round((totalNormal / overallTotal) * 100) : 0;
    const overallKotuPct = overallTotal > 0 ? Math.round((totalKotu / overallTotal) * 100) : 0;

    return {
      totalChecklists,
      overallIyiPct,
      overallNormalPct,
      overallKotuPct,
      questionStats,
    };
  };

  const stats = computeStats();

  // Filtered personnel list who have checklists
  const reportPersoneller = personeller.filter(p => 
    checklists.some(chk => chk.personelId === p.id)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-amber-400" />
          Checklist Raporlama & Analiz
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Genel Müdür yetkisiyle personellerin haftalık ve aylık şef checklist analiz raporları.
        </p>
      </div>

      {/* Report Filters Card */}
      <div className="glass border border-slate-800/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Personel</label>
          <select
            value={reportPersonelId}
            onChange={(e) => setReportPersonelId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-sm"
          >
            <option value="">Tüm Personel</option>
            {reportPersoneller.map((p) => (
              <option key={p.id} value={p.id}>
                {p.adSoyad} {p.gorev ? `(${p.gorev})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-48 space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Zaman Aralığı</label>
          <select
            value={reportTimeframe}
            onChange={(e) => setReportTimeframe(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-855 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-sm"
          >
            <option value="haftalik">Haftalık (Son 7 Gün)</option>
            <option value="aylik">Aylık (Son 30 Gün)</option>
            <option value="tumu">Tüm Zamanlar</option>
          </select>
        </div>
      </div>

      {!stats ? (
        <div className="glass border border-slate-800/60 rounded-xl p-8 text-center text-slate-400">
          <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          Seçilen kriterlere ve tarih aralığına uygun checklist kaydı bulunamadı.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Aggregated Overall Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 space-y-1">
              <div className="text-xs font-semibold text-slate-500 uppercase">Toplam Kayıt</div>
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-amber-500" />
                {stats.totalChecklists} adet
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Belirtilen döneme ait doldurulan checklist.</div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 space-y-1">
              <div className="text-xs font-semibold text-emerald-500/70 uppercase">İyi Değerlendirme</div>
              <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                <Check className="w-6 h-6 text-emerald-400" />
                %{stats.overallIyiPct}
              </div>
              <div className="text-[10px] text-emerald-500/60 mt-1">Toplam cevapların iyi olma yüzdesi.</div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 space-y-1">
              <div className="text-xs font-semibold text-amber-500/70 uppercase">Normal Değerlendirme</div>
              <div className="text-2xl font-bold text-amber-400 flex items-center gap-2">
                <Info className="w-6 h-6 text-amber-400" />
                %{stats.overallNormalPct}
              </div>
              <div className="text-[10px] text-amber-500/60 mt-1">Toplam cevapların normal olma yüzdesi.</div>
            </div>

            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 space-y-1">
              <div className="text-xs font-semibold text-red-500/70 uppercase">Kötü Değerlendirme</div>
              <div className="text-2xl font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                %{stats.overallKotuPct}
              </div>
              <div className="text-[10px] text-red-500/60 mt-1">Toplam cevapların kötü olma yüzdesi.</div>
            </div>
          </div>

          {/* Warning Area for Low Scores */}
          {stats.questionStats.some(q => q.kotuPct > 20) && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3.5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                Dikkat Edilmesi Gereken Alanlar (%20'den fazla Kötü skoru olanlar)
              </div>
              <ul className="text-xs space-y-1 list-disc pl-5 opacity-90">
                {stats.questionStats
                  .filter(q => q.kotuPct > 20)
                  .map(q => (
                    <li key={q.key}>
                      <strong>{q.label}</strong>: Değerlendirmelerin %{q.kotuPct} kadarı <strong>Kötü</strong> olarak işaretlenmiş.
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Individual Question Stats */}
          <div className="glass border border-slate-800/60 rounded-xl p-4 md:p-6 space-y-5">
            <h3 className="text-slate-200 font-bold flex items-center gap-2 text-md">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              Kriter Dağılım Detayları
            </h3>

            <div className="grid grid-cols-1 gap-5">
              {stats.questionStats.map((q, idx) => (
                <div key={q.key} className="space-y-2 border-b border-slate-900 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-slate-200 font-semibold text-sm">
                      <span className="text-amber-400 mr-1">{idx + 1}.</span>
                      {q.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {q.total} değerlendirmeden
                    </span>
                  </div>

                  {/* Stacked Progress Bar */}
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex">
                    {q.iyiPct > 0 && (
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-500" 
                        style={{ width: `${q.iyiPct}%` }}
                        title={`İyi: %${q.iyiPct}`}
                      />
                    )}
                    {q.normalPct > 0 && (
                      <div 
                        className="bg-amber-500 h-full transition-all duration-500" 
                        style={{ width: `${q.normalPct}%` }}
                        title={`Normal: %${q.normalPct}`}
                      />
                    )}
                    {q.kotuPct > 0 && (
                      <div 
                        className="bg-red-500 h-full transition-all duration-500" 
                        style={{ width: `${q.kotuPct}%` }}
                        title={`Kötü: %${q.kotuPct}`}
                      />
                    )}
                  </div>

                  {/* Text Stats */}
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      İyi: %{q.iyiPct} ({q.iyi})
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                      Normal: %{q.normalPct} ({q.normal})
                    </span>
                    <span className="flex items-center gap-1.5 text-red-400">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                      Kötü: %{q.kotuPct} ({q.kotu})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
