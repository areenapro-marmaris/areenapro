"use client";

import { useState, useEffect } from "react";
import { 
  ClipboardCheck, ClipboardList, Plus, History, 
  Download, CheckCircle2, ChevronRight, User, Calendar, 
  ShieldAlert, FileText, BarChart3, TrendingUp, AlertTriangle, Check, Info 
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

const SECENEKLER = [
  { value: "KOTU", label: "Kötü", color: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 active:bg-red-500/30" },
  { value: "NORMAL", label: "Normal", color: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 active:bg-amber-500/30" },
  { value: "IYI", label: "İyi", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 active:bg-emerald-500/30" }
];

export default function ChefChecklistPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [personeller, setPersoneller] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"yeni" | "gecmis" | "rapor">("yeni");
  
  // Form State
  const [selectedPersonelId, setSelectedPersonelId] = useState("");
  const [checklistDate, setChecklistDate] = useState(new Date().toISOString().split("T")[0]);
  const [answers, setAnswers] = useState<Record<string, string>>({
    isletmeHijyen: "NORMAL",
    personelUniforma: "NORMAL",
    masaSetup: "NORMAL",
    komiTasima: "NORMAL",
    garsonServis: "NORMAL",
    personelDevamlilik: "NORMAL",
    hesapTahsilat: "NORMAL",
    satisTaktik: "NORMAL",
    garsonPortfoy: "NORMAL",
    musteriMemnuniyeti: "NORMAL"
  });

  // Report Filters
  const [reportPersonelId, setReportPersonelId] = useState("");
  const [reportTimeframe, setReportTimeframe] = useState<"haftalik" | "aylik" | "tumu">("aylik");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      const [resMe, resP, resC] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/ayarlar/personel"),
        fetch("/api/chef-checklist")
      ]);

      if (resMe.ok) {
        const dMe = await resMe.json();
        setCurrentUser(dMe.kullanici);
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
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAnswerSelect = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonelId) {
      setError("Lütfen değerlendirilecek personeli seçin.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/chef-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personelId: selectedPersonelId,
          tarih: checklistDate,
          ...answers
        })
      });

      if (res.ok) {
        setSuccess("Şef checklist kaydı başarıyla oluşturuldu.");
        setSelectedPersonelId("");
        setAnswers({
          isletmeHijyen: "NORMAL",
          personelUniforma: "NORMAL",
          masaSetup: "NORMAL",
          komiTasima: "NORMAL",
          garsonServis: "NORMAL",
          personelDevamlilik: "NORMAL",
          hesapTahsilat: "NORMAL",
          satisTaktik: "NORMAL",
          garsonPortfoy: "NORMAL",
          musteriMemnuniyeti: "NORMAL"
        });
        fetchData();
        setActiveTab("gecmis");
      } else {
        const data = await res.json();
        setError(data.error || "Bir hata oluştu.");
      }
    } catch (err) {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPDF = (checklist: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const getOptionSymbol = (val: string, currentVal: string) => {
      return val === currentVal ? "✓" : " ";
    };

    printWindow.document.write(`
      <html>
        <head>
          <title>Chef Checklist - ${checklist.personel.adSoyad}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap');
            body {
              font-family: 'Outfit', sans-serif;
              color: #1e293b;
              margin: 40px;
              padding: 0;
              line-height: 1.4;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              margin: 0;
            }
            .title span {
              color: #d97706;
            }
            .date-badge {
              font-size: 16px;
              font-weight: bold;
            }
            .meta-info {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 25px;
              font-size: 14px;
            }
            .question-item {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .question-label {
              font-size: 15px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .options-row {
              display: flex;
              gap: 20px;
            }
            .option-box {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 14px;
            }
            .check-square {
              width: 16px;
              height: 16px;
              border: 2px solid #1e293b;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: bold;
            }
            .footer-row {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              font-weight: bold;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
              page-break-inside: avoid;
            }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h1 class="title">Club Areena <span>Chef Checklist</span></h1>
            <div class="date-badge">TARIH : ${formatDate(checklist.tarih)}</div>
          </div>

          <div class="meta-info">
            <strong>DEĞERLENDİRİLEN PERSONEL:</strong> ${checklist.personel.adSoyad} (${checklist.personel.gorev || "Belirtilmemiş"})<br/>
            <strong>DEĞERLENDİREN ŞEF:</strong> ${checklist.sef.adSoyad}
          </div>

          <div>
            ${SORULAR.map((q, idx) => {
              const currentVal = checklist[q.key];
              return `
                <div class="question-item">
                  <div class="question-label">${idx + 1}. ${q.label}</div>
                  <div class="options-row">
                    <div class="option-box">
                      <span class="check-square">${getOptionSymbol("KOTU", currentVal)}</span> Kotu
                    </div>
                    <div class="option-box">
                      <span class="check-square">${getOptionSymbol("NORMAL", currentVal)}</span> Normal
                    </div>
                    <div class="option-box">
                      <span class="check-square">${getOptionSymbol("IYI", currentVal)}</span> Iyi
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>

          <div class="footer-row">
            <div>ŞEF AD SOYAD: ${checklist.sef.adSoyad}</div>
            <div>İMZA: _________________</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getOptionLabel = (val: string) => {
    if (val === "KOTU") return "Kötü";
    if (val === "NORMAL") return "Normal";
    return "İyi";
  };

  const getOptionBadgeColor = (val: string) => {
    if (val === "KOTU") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (val === "NORMAL") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  };

  // Aggregated Report Calculations
  const getFilteredChecklists = () => {
    const now = new Date();
    return checklists.filter((chk) => {
      // 1. Employee Filter
      if (reportPersonelId && chk.personelId !== reportPersonelId) return false;

      // 2. Date/Timeframe Filter
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-amber-400" />
            Şef Checklist
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Günlük personel hijyen, masa düzeni ve hizmet kalitesi kontrol listesi.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap bg-slate-900/60 p-1 rounded-lg border border-slate-800/80 gap-1 self-start">
          <button
            onClick={() => setActiveTab("yeni")}
            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all ${
              activeTab === "yeni" 
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Plus className="w-4 h-4" />
            Yeni Checklist
          </button>
          <button
            onClick={() => setActiveTab("gecmis")}
            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all ${
              activeTab === "gecmis" 
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            Geçmiş Kayıtlar ({checklists.length})
          </button>
          <button
            onClick={() => setActiveTab("rapor")}
            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all ${
              activeTab === "rapor" 
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Raporlama / Analiz
          </button>
        </div>
      </div>

      {activeTab === "yeni" && (
        <form onSubmit={handleSubmit} className="glass border border-slate-800/60 rounded-xl p-4 md:p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {/* Top Form Meta Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Değerlendirilecek Personel
              </label>
              <select
                value={selectedPersonelId}
                onChange={(e) => setSelectedPersonelId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm"
                required
              >
                <option value="">Personel Seçin...</option>
                {personeller.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.adSoyad} {p.gorev ? `(${p.gorev})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Değerlendirme Tarihi
              </label>
              <input
                type="date"
                value={checklistDate}
                onChange={(e) => setChecklistDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm"
                required
              />
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-5">
            <h3 className="text-slate-200 font-bold mb-4 flex items-center gap-2 text-md">
              <ClipboardList className="w-5 h-5 text-amber-400" />
              Değerlendirme Kriterleri
            </h3>
            
            <div className="space-y-6">
              {SORULAR.map((q, idx) => (
                <div key={q.key} className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-4 space-y-3">
                  <div className="text-slate-200 text-sm md:text-base font-semibold leading-relaxed">
                    <span className="text-amber-400 mr-1.5">{idx + 1}.</span> {q.label}
                  </div>
                  
                  {/* Radio Card Group */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    {SECENEKLER.map((opt) => {
                      const isSelected = answers[q.key] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleAnswerSelect(q.key, opt.value)}
                          className={`border rounded-lg py-2.5 px-2 text-center text-xs md:text-sm font-medium transition-all ${
                            isSelected 
                              ? "border-amber-500 bg-amber-500/20 text-amber-400 shadow-md shadow-amber-500/5 scale-[1.02]" 
                              : "border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-white"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold py-3 px-6 rounded-lg transition-all transform hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base mt-8"
          >
            <CheckCircle2 className="w-5 h-5" />
            {loading ? "Kaydediliyor..." : "Onaylıyorum Gönder"}
          </button>
        </form>
      )}

      {activeTab === "gecmis" && (
        <div className="space-y-4">
          {checklists.length === 0 ? (
            <div className="glass border border-slate-800/60 rounded-xl p-8 text-center text-slate-400">
              <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              Kayıtlı geçmiş checklist bulunmamaktadır.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checklists.map((chk) => (
                <div key={chk.id} className="glass border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(chk.tarih).toLocaleDateString("tr-TR")}
                      </span>
                      <span className="text-xs font-semibold bg-slate-800 text-amber-400 px-2.5 py-0.5 rounded-full">
                        Şef: {chk.sef.adSoyad}
                      </span>
                    </div>
                    
                    <h3 className="text-slate-200 font-bold text-base flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      {chk.personel.adSoyad}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium bg-slate-900/50 px-2 py-1 rounded inline-block">
                      Görev: {chk.personel.gorev || "Belirtilmemiş"}
                    </p>
                  </div>

                  {/* Summary of Scores */}
                  <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-800/60 py-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Genel Hijyen:</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getOptionBadgeColor(chk.isletmeHijyen)}`}>
                        {getOptionLabel(chk.isletmeHijyen)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Masa Düzeni:</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getOptionBadgeColor(chk.masaSetup)}`}>
                        {getOptionLabel(chk.masaSetup)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Pers. Hijyen:</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getOptionBadgeColor(chk.personelUniforma)}`}>
                        {getOptionLabel(chk.personelUniforma)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Memnuniyet:</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getOptionBadgeColor(chk.musteriMemnuniyeti)}`}>
                        {getOptionLabel(chk.musteriMemnuniyeti)}
                      </span>
                    </div>
                  </div>

                  {/* PDF Export Button */}
                  <button
                    onClick={() => handlePrintPDF(chk)}
                    className="w-full bg-slate-800 hover:bg-slate-700 active:bg-slate-650 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-xs md:text-sm border border-slate-700/50 transition-colors"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    PDF İndir / Yazdır
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "rapor" && (
        <div className="space-y-6">
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
                {personeller
                  .filter((p) => checklists.some((chk) => chk.personelId === p.id))
                  .map((p) => (
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
      )}
    </div>
  );
}
