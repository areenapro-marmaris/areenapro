"use client";

import { useState, useEffect } from "react";
import { 
  FileText, Plus, X, CheckCircle, Clock, AlertTriangle, 
  ChevronRight, ShieldAlert, FileSignature, Users, User, ArrowRight,
  Shield, Check, Ban, AlertCircle, Info, Landmark, ShieldCheck, Filter
} from "lucide-react";

export default function DilekcelerYoneticiPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Tabs & Filters
  const [activeViewTab, setActiveViewTab] = useState<"dilekceler" | "tutanaklar">("tutanaklar"); // default to tutanaklar as requested
  const [dilekceFilter, setDilekceFilter] = useState<"BEKLIYOR" | "SONUCLANAN">("BEKLIYOR");
  const [tutanakFilter, setTutanakFilter] = useState<"YENI" | "SAVUNMA_YAPILDI" | "KARAR_VERILDI">("YENI");
  
  // Custom Top Filters
  const [filterAy, setFilterAy] = useState<string>("Tümü");
  const [filterEkleyen, setFilterEkleyen] = useState<string>("Tümü");
  const [filterIlgili, setFilterIlgili] = useState<string>("Tümü");
  
  // Data States
  const [dilekceler, setDilekceler] = useState<any[]>([]);
  const [tutanaklar, setTutanaklar] = useState<any[]>([]);
  const [personelList, setPersonelList] = useState<any[]>([]);
  
  // Modal States
  const [isDilekceModalOpen, setIsDilekceModalOpen] = useState(false);
  const [isTutanakModalOpen, setIsTutanakModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTutanak, setSelectedTutanak] = useState<any>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingDilekceId, setRejectingDilekceId] = useState<string | null>(null);
  const [redNedeniText, setRedNedeniText] = useState("");

  // Decision Form Inside Detail Modal
  const [decisionForm, setDecisionForm] = useState({
    kararTuru: "UYARI",
    cezaTutari: "",
    kararNotu: ""
  });

  const [tutanakForm, setTutanakForm] = useState({
    ilgiliId: "",
    konu: "",
    icerik: ""
  });

  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const resMe = await fetch("/api/auth/me");
      if (resMe.ok) {
        const dataMe = await resMe.json();
        setCurrentUser(dataMe.kullanici);
      }
      
      const [resD, resT, resP] = await Promise.all([
        fetch("/api/dilekceler"),
        fetch("/api/tutanaklar"),
        fetch("/api/ayarlar/personel"),
      ]);

      if (resD.ok) setDilekceler(await resD.json());
      if (resT.ok) setTutanaklar(await resT.json());
      if (resP.ok) {
        const pData = await resP.json();
        setPersonelList(pData.filter((p: any) => p.aktif));
      }
    } catch (err) {
      console.error("Veriler yüklenirken hata:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isManager = currentUser?.rol === "SUPER_ADMIN";

  // Dilekçe Onayla/Reddet
  const handleDilekceStatus = async (id: string, status: "ONAYLANDI" | "REDDEDILDI") => {
    try {
      const res = await fetch("/api/dilekceler", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, onayDurumu: status })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDilekceId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/dilekceler", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rejectingDilekceId, onayDurumu: "REDDEDILDI", redNedeni: redNedeniText })
      });
      if (res.ok) {
        setIsRejectModalOpen(false);
        setRejectingDilekceId(null);
        setRedNedeniText("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Tutanak Kaydet
  const handleTutanakSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/tutanaklar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tutanakForm)
      });
      if (res.ok) {
        setIsTutanakModalOpen(false);
        setTutanakForm({ ilgiliId: "", konu: "", icerik: "" });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "İşlem başarısız.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Karar Kaydet
  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTutanak) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tutanaklar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: selectedTutanak.id, 
          kararTuru: decisionForm.kararTuru,
          cezaTutari: decisionForm.kararTuru === 'PARA_CEZASI' ? decisionForm.cezaTutari : 0,
          kararNotu: decisionForm.kararNotu
        })
      });
      if (res.ok) {
        setIsDetailModalOpen(false);
        setDecisionForm({ kararTuru: "UYARI", cezaTutari: "", kararNotu: "" });
        setSelectedTutanak(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "İşlem başarısız.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (currentUser && currentUser.rol !== "SUPER_ADMIN") {
    return (
      <div className="glass-panel p-12 text-center text-red-400 font-bold border border-red-500/20">
        Bu sayfaya erişim yetkiniz bulunmamaktadır.
      </div>
    );
  }

  // Month Extractor (Turkish)
  const getTurkishMonth = (dateStr: string) => {
    const months = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    const d = new Date(dateStr);
    return months[d.getMonth()];
  };

  // Unique lists for top dropdowns
  const uniqueEkleyenler = Array.from(new Set(tutanaklar.map(t => t.ekleyen?.adSoyad).filter(Boolean)));
  const uniqueIlgililer = Array.from(new Set(tutanaklar.map(t => t.ilgili?.adSoyad).filter(Boolean)));
  const aylarList = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  // Filter application
  const filteredTutanaklar = tutanaklar.filter(t => {
    // 1. Status Filter
    if (t.durum !== tutanakFilter) return false;
    
    // 2. Month Filter
    if (filterAy !== "Tümü") {
      if (getTurkishMonth(t.tarih) !== filterAy) return false;
    }
    
    // 3. Ekleyen Filter
    if (filterEkleyen !== "Tümü") {
      if (t.ekleyen?.adSoyad !== filterEkleyen) return false;
    }
    
    // 4. Ilgili Filter
    if (filterIlgili !== "Tümü") {
      if (t.ilgili?.adSoyad !== filterIlgili) return false;
    }
    
    return true;
  });

  const filteredDilekceler = dilekceler.filter(d => {
    if (dilekceFilter === "BEKLIYOR") return d.onayDurumu === "BEKLIYOR";
    return d.onayDurumu === "ONAYLANDI" || d.onayDurumu === "REDDEDILDI";
  });

  // Calculate total fine for visible list
  const totalFine = filteredTutanaklar.reduce((acc, t) => acc + (t.cezaTutari || 0), 0);

  const getDilekceBadge = (status: string) => {
    if (status === "ONAYLANDI") {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20"><CheckCircle className="w-3.5 h-3.5" /> Onaylandı</span>;
    }
    if (status === "REDDEDILDI") {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20"><Ban className="w-3.5 h-3.5" /> Reddedildi</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20"><Clock className="w-3.5 h-3.5" /> Bekliyor</span>;
  };

  const getDilekceTur = (tur: string, sub: string | null) => {
    if (tur === 'IZIN') {
      if (sub === 'ERKEN_CIKIS_IZNI') return 'Erken Çıkış İzni';
      if (sub === 'EGITIM_IZNI') return 'Eğitim İzni';
      if (sub === 'IS_IZNI') return 'İş İzni';
      return 'İzin';
    }
    if (tur === 'AVANS_TALEBI') return 'Avans Talebi';
    if (tur === 'ODENEK') return 'Ödenek Talebi';
    return tur;
  };

  return (
    <div className="space-y-6">
      
      {/* Detail Popup Modal (Replicating Tutanak Detayı style) */}
      {isDetailModalOpen && selectedTutanak && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">
            {/* Header Banner (Purple Style from Screenshot) */}
            <div className="bg-[#8e44ad] p-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Tutanak Detayı ( {selectedTutanak.ilgili?.adSoyad} )
              </h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-white hover:opacity-80"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Info Table Layout from Screenshot */}
              <div className="border border-slate-700 rounded-lg overflow-hidden divide-y divide-slate-700">
                <div className="grid grid-cols-4 bg-slate-900/30">
                  <div className="col-span-1 p-3 font-semibold text-slate-300 border-r border-slate-700 bg-slate-900/60">Tarih</div>
                  <div className="col-span-3 p-3 text-slate-200">{new Date(selectedTutanak.tarih).toLocaleString('tr-TR')}</div>
                </div>
                <div className="grid grid-cols-4 bg-slate-900/30">
                  <div className="col-span-1 p-3 font-semibold text-slate-300 border-r border-slate-700 bg-slate-900/60">Ekleyen</div>
                  <div className="col-span-3 p-3 text-slate-200">{selectedTutanak.ekleyen?.adSoyad}</div>
                </div>
                <div className="grid grid-cols-4 bg-slate-900/30">
                  <div className="col-span-1 p-3 font-semibold text-slate-300 border-r border-slate-700 bg-slate-900/60">İlgili</div>
                  <div className="col-span-3 p-3 text-slate-200">{selectedTutanak.ilgili?.adSoyad}</div>
                </div>
                <div className="grid grid-cols-4 bg-slate-900/30">
                  <div className="col-span-1 p-3 font-semibold text-slate-300 border-r border-slate-700 bg-slate-900/60">Konu</div>
                  <div className="col-span-3 p-3 text-slate-200">{selectedTutanak.konu}</div>
                </div>
                <div className="grid grid-cols-4 bg-slate-900/30">
                  <div className="col-span-1 p-3 font-semibold text-slate-300 border-r border-slate-700 bg-slate-900/60">Tutanak İçeriği</div>
                  <div className="col-span-3 p-3">
                    <textarea readOnly rows={4} className="w-full bg-slate-950/50 border border-slate-700 rounded p-2 text-slate-300 resize-none outline-none text-sm leading-relaxed" value={selectedTutanak.icerik} />
                  </div>
                </div>
              </div>

              {/* Blue Subtitle & Defense Block from Screenshot */}
              <div className="space-y-3">
                <div className="bg-[#2980b9] p-2 text-white font-semibold text-sm rounded">
                  Savunması Aşağıdadır
                </div>
                <div className="border border-slate-700 rounded-lg overflow-hidden divide-y divide-slate-700">
                  <div className="grid grid-cols-4 bg-slate-900/30">
                    <div className="col-span-1 p-3 font-semibold text-slate-300 border-r border-slate-700 bg-slate-900/60">Savunma Metni</div>
                    <div className="col-span-3 p-3">
                      <textarea readOnly rows={4} className="w-full bg-slate-950/50 border border-slate-700 rounded p-2 text-slate-300 resize-none outline-none text-sm leading-relaxed" value={selectedTutanak.savunma || "Personel henüz savunma yapmadı / savunma bekleniyor."} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resolution Decision Section (For Managers) */}
              {selectedTutanak.durum === 'SAVUNMA_YAPILDI' && (
                <form onSubmit={handleDecisionSubmit} className="space-y-4 border-t border-slate-700 pt-4">
                  <h4 className="text-base font-bold text-white flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> Karar & Yaptırım Uygula</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Yaptırım Türü *</label>
                      <select value={decisionForm.kararTuru} onChange={(e) => setDecisionForm({ ...decisionForm, kararTuru: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                        <option value="UYARI">Uyarı</option>
                        <option value="PARA_CEZASI">Para Cezası</option>
                        <option value="UZAKLASTIRMA">Uzaklaştırma</option>
                      </select>
                    </div>
                    {decisionForm.kararTuru === "PARA_CEZASI" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Ceza Tutarı (₺) *</label>
                        <input required type="number" min="0" value={decisionForm.cezaTutari} onChange={(e) => setDecisionForm({ ...decisionForm, cezaTutari: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Karar Notu / Açıklama</label>
                    <textarea rows={2} value={decisionForm.kararNotu} onChange={(e) => setDecisionForm({ ...decisionForm, kararNotu: e.target.value })} placeholder="Kararla ilgili ek açıklama yazın..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none text-sm" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">Vazgeç</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors">Kararı Uygula</button>
                  </div>
                </form>
              )}

              {selectedTutanak.durum === 'KARAR_VERILDI' && (
                <div className="bg-emerald-950/20 p-4 rounded-lg border border-emerald-900/30 text-sm space-y-2">
                  <div className="text-emerald-400 font-bold">Verilen Karar & Yaptırım</div>
                  <div><span className="font-semibold text-slate-300">Yaptırım:</span> {selectedTutanak.kararTuru === 'UYARI' ? 'Yazılı Uyarı' : selectedTutanak.kararTuru === 'PARA_CEZASI' ? `Para Cezası (₺${selectedTutanak.cezaTutari})` : 'Uzaklaştırma'}</div>
                  {selectedTutanak.kararNotu && <div><span className="font-semibold text-slate-300">Karar Açıklaması:</span> {selectedTutanak.kararNotu}</div>}
                  <div><span className="font-semibold text-slate-300">Karar Tarihi:</span> {new Date(selectedTutanak.kararTarihi).toLocaleString('tr-TR')}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dilekçe Reddetme Modalı */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><X className="w-5 h-5 text-red-500" /> Dilekçe Red Nedeni</h3>
              <button onClick={() => { setIsRejectModalOpen(false); setRejectingDilekceId(null); setRedNedeniText(""); }} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Reddedilme Gerekçesi / Neden *</label>
                <textarea 
                  required 
                  rows={4} 
                  value={redNedeniText} 
                  onChange={(e) => setRedNedeniText(e.target.value)} 
                  placeholder="Lütfen personelin talebinin neden reddedildiğini açıklayın..." 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 resize-none text-sm leading-relaxed" 
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => { setIsRejectModalOpen(false); setRejectingDilekceId(null); setRedNedeniText(""); }} 
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Vazgeç
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  {loading ? "Reddediliyor..." : "Talebi Reddet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tutanak Tut Modal */}
      {isTutanakModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-red-400" /> Yeni Tutanak Tut</h3>
              <button onClick={() => setIsTutanakModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleTutanakSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Hakkında Tutanak Tutulan Personel *</label>
                <select required value={tutanakForm.ilgiliId} onChange={(e) => setTutanakForm({ ...tutanakForm, ilgiliId: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                  <option value="">Seçiniz...</option>
                  {personelList.map(p => <option key={p.id} value={p.id}>{p.adSoyad}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tutanak Konusu *</label>
                <input required type="text" value={tutanakForm.konu} onChange={(e) => setTutanakForm({ ...tutanakForm, konu: e.target.value })} placeholder="Örn: Mesaiye Geç Kalma / Kural İhlali" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Olay / Tutanak İçeriği *</label>
                <textarea required rows={5} value={tutanakForm.icerik} onChange={(e) => setTutanakForm({ ...tutanakForm, icerik: e.target.value })} placeholder="Olayı yer, saat ve detaylar vererek yazın..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors">
                {loading ? "Tutanak Kaydediliyor..." : "Tutanak Tut"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-400" /> Tutanaklar Yönetici Paneli
          </h1>
          <p className="text-slate-400 mt-2">Tüm personel dilekçelerini onaylayın, tutanakları yönetin ve yaptırım kararları verin.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsTutanakModalOpen(true)} className="flex items-center gap-2 bg-red-600/80 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <ShieldAlert className="w-4 h-4" /> Tutanak Tut
          </button>
        </div>
      </div>

      {/* 3. Module Tabs */}
      <div className="flex border-b border-slate-700">
        <button 
          onClick={() => setActiveViewTab("tutanaklar")} 
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${activeViewTab === "tutanaklar" ? 'text-indigo-400 border-b-indigo-400 font-bold' : 'text-slate-400 border-b-transparent hover:text-white'}`}
        >
          <ShieldAlert className="w-4 h-4" /> Tüm Tutanaklar
        </button>
        <button 
          onClick={() => setActiveViewTab("dilekceler")} 
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${activeViewTab === "dilekceler" ? 'text-indigo-400 border-b-indigo-400 font-bold' : 'text-slate-400 border-b-transparent hover:text-white'}`}
        >
          <FileText className="w-4 h-4" /> Tüm Dilekçeler
        </button>
      </div>

      {/* 4. Content */}
      {activeViewTab === "tutanaklar" ? (
        <div className="space-y-4">
          
          {/* Top Dropdowns Row (Ay, Ekleyen, İlgili, Filtrele) from Screenshot 1 */}
          <div className="glass-panel p-4 border border-slate-700/50 bg-slate-800/20 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Ay</label>
              <select value={filterAy} onChange={(e) => setFilterAy(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                <option value="Tümü">Tümü</option>
                {aylarList.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Ekleyen</label>
              <select value={filterEkleyen} onChange={(e) => setFilterEkleyen(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                <option value="Tümü">Tümü</option>
                {uniqueEkleyenler.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">İlgili</label>
              <select value={filterIlgili} onChange={(e) => setFilterIlgili(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                <option value="Tümü">Tümü</option>
                {uniqueIlgililer.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div>
              <button onClick={fetchData} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-lg">
                <Filter className="w-4 h-4" /> Filtrele
              </button>
            </div>
          </div>

          {/* Red Header Bar & Workflow Badges (Yeni, Savunma Yapıldı, Karar Verildi) from Screenshot 1 */}
          <div className="bg-[#c0392b] p-4 rounded-t-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white font-semibold shadow-lg">
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-white" /> Tutanaklar
            </span>
            <div className="flex border border-red-500/50 rounded-lg p-0.5 bg-red-950/40 gap-1 w-full sm:w-auto">
              <button 
                onClick={() => setTutanakFilter("YENI")} 
                className={`flex-1 sm:flex-none justify-center px-2 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1 ${tutanakFilter === 'YENI' ? 'bg-[#c0392b] text-white shadow' : 'text-red-200 hover:text-white'}`}
              >
                Yeni <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px]">{tutanaklar.filter(t => t.durum === 'YENI').length}</span>
              </button>
              <button 
                onClick={() => setTutanakFilter("SAVUNMA_YAPILDI")} 
                className={`flex-1 sm:flex-none justify-center px-2 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1 ${tutanakFilter === 'SAVUNMA_YAPILDI' ? 'bg-[#2980b9] text-white shadow' : 'text-blue-200 hover:text-white'}`}
              >
                <span className="hidden xs:inline">Savunma Yapıldı</span>
                <span className="xs:hidden">Savunma</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px]">{tutanaklar.filter(t => t.durum === 'SAVUNMA_YAPILDI').length}</span>
              </button>
              <button 
                onClick={() => setTutanakFilter("KARAR_VERILDI")} 
                className={`flex-1 sm:flex-none justify-center px-2 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1 ${tutanakFilter === 'KARAR_VERILDI' ? 'bg-[#27ae60] text-white shadow' : 'text-emerald-200 hover:text-white'}`}
              >
                <span className="hidden xs:inline">Karar Verildi</span>
                <span className="xs:hidden">Karar</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px]">{tutanaklar.filter(t => t.durum === 'KARAR_VERILDI').length}</span>
              </button>
            </div>
          </div>

          {/* Table from Screenshot 1 */}
          <div className="bg-slate-900 border-x border-b border-slate-700/50 rounded-b-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-800 text-slate-300 text-xs border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-bold w-12 text-center">#</th>
                    <th className="px-4 py-3 font-semibold">Birim</th>
                    <th className="px-4 py-3 font-semibold">Tarih</th>
                    <th className="px-4 py-3 font-semibold">Ekleyen</th>
                    <th className="px-4 py-3 font-semibold">Konu</th>
                    <th className="px-4 py-3 font-semibold">İlgili</th>
                    <th className="px-4 py-3 font-semibold">İçerik Özet</th>
                    <th className="px-4 py-3 font-semibold text-center">Detay</th>
                    <th className="px-4 py-3 font-semibold">Yaptırım Türü</th>
                    <th className="px-4 py-3 font-semibold text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredTutanaklar.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                        Gösterilecek tutanak kaydı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredTutanaklar.map((t, idx) => (
                      <tr key={t.id} className="transition-colors hover:bg-slate-800/40 bg-slate-900/60">
                        <td className="px-4 py-3 text-slate-500 font-mono text-center">{idx + 1}</td>
                        <td className="px-4 py-3 text-slate-300">{t.ilgili?.birim?.ad || "AREENA"}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{new Date(t.tarih).toLocaleDateString('tr-TR')} {new Date(t.tarih).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</td>
                        <td className="px-4 py-3 text-slate-200 font-medium">{t.ekleyen?.adSoyad}</td>
                        <td className="px-4 py-3 text-slate-300">{t.konu}</td>
                        <td className="px-4 py-3 text-slate-200 font-medium">{t.ilgili?.adSoyad}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-[200px]" title={t.icerik}>{t.icerik}</td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => { setSelectedTutanak(t); setIsDetailModalOpen(true); }}
                            className="bg-[#d35400] hover:bg-[#e67e22] text-white px-2.5 py-1 rounded text-xs font-bold transition-all shadow-md flex items-center gap-1.5 mx-auto"
                          >
                            Detay <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {t.durum === 'KARAR_VERILDI' ? (
                            t.kararTuru === 'UYARI' ? 'Yazılı Uyarı' : t.kararTuru === 'PARA_CEZASI' ? 'Para Cezası' : 'Uzaklaştırma'
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-200">
                          {t.cezaTutari ? `₺${t.cezaTutari.toLocaleString('tr-TR')}` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Total Fine Row from Screenshot 1 */}
            <div className="bg-slate-900/60 p-4 border-t border-slate-800 flex justify-end">
              <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-lg font-bold text-sm">
                Toplam: ₺{totalFine.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Petitions (Dilekçeler) List for admin/yonetici */}
          <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
            <div className="flex border border-slate-700 rounded-lg p-0.5 bg-slate-900">
              <button 
                onClick={() => setDilekceFilter("BEKLIYOR")} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${dilekceFilter === 'BEKLIYOR' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Onay Bekleyenler ({dilekceler.filter(d => d.onayDurumu === "BEKLIYOR").length})
              </button>
              <button 
                onClick={() => setDilekceFilter("SONUCLANAN")} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${dilekceFilter === 'SONUCLANAN' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Sonuçlananlar
              </button>
            </div>
            <span className="text-xs text-slate-500 font-medium">Toplam {filteredDilekceler.length} dilekçe</span>
          </div>

          <div className="space-y-3">
            {filteredDilekceler.length === 0 ? (
              <div className="glass-panel p-12 text-center text-slate-400">
                Gösterilecek dilekçe bulunamadı.
              </div>
            ) : (
              filteredDilekceler.map(d => (
                <div key={d.id} className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-base">{d.konu}</span>
                      <span className="text-xs px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400 font-semibold">
                        {getDilekceTur(d.tur, d.izinTuru)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 bg-slate-900/40 p-3 rounded border border-slate-700/50 leading-relaxed font-mono whitespace-pre-wrap">{d.icerik}</p>
                    {d.onayDurumu === "REDDEDILDI" && d.redNedeni && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded text-xs">
                        <strong>Red Nedeni:</strong> {d.redNedeni}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="text-slate-300 font-bold">Personel: {d.personel?.adSoyad}</span>
                      <span>•</span>
                      <span>{new Date(d.tarih).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0 self-end md:self-center">
                    {d.onayDurumu === "BEKLIYOR" && isManager ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setRejectingDilekceId(d.id); setIsRejectModalOpen(true); }}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/20 transition-all font-semibold text-xs flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" /> Reddet
                        </button>
                        <button 
                          onClick={() => handleDilekceStatus(d.id, "ONAYLANDI")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Onayla
                        </button>
                      </div>
                    ) : (
                      <>
                        {getDilekceBadge(d.onayDurumu)}
                        {d.onaylayan && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            İşlem Yapan: {d.onaylayan.adSoyad}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
