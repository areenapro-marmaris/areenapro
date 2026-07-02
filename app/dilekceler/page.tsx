"use client";

import { useState, useEffect } from "react";
import { 
  FileText, Plus, X, CheckCircle, Clock, AlertTriangle, 
  ChevronRight, ShieldAlert, FileSignature, Users, User, ArrowRight,
  Shield, Check, Ban, AlertCircle, Info, Landmark
} from "lucide-react";

export default function DilekcelerPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Tabs
  const [activeViewTab, setActiveViewTab] = useState<"dilekceler" | "tutanaklar">("dilekceler");
  const [dilekceFilter, setDilekceFilter] = useState<"BEKLIYOR" | "SONUCLANAN">("BEKLIYOR");
  const [tutanakFilter, setTutanakFilter] = useState<"YENI" | "SAVUNMA_YAPILDI" | "KARAR_VERILDI">("YENI");
  
  // Data States
  const [dilekceler, setDilekceler] = useState<any[]>([]);
  const [tutanaklar, setTutanaklar] = useState<any[]>([]);
  const [personelList, setPersonelList] = useState<any[]>([]);
  
  // Modal States
  const [isDilekceModalOpen, setIsDilekceModalOpen] = useState(false);
  const [isTutanakModalOpen, setIsTutanakModalOpen] = useState(false);
  const [isDefenseModalOpen, setIsDefenseModalOpen] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [selectedTutanak, setSelectedTutanak] = useState<any>(null);

  // Forms
  const [dilekceForm, setDilekceForm] = useState({
    tur: "IZIN",
    izinTuru: "EGITIM_IZNI",
    miktar: "",
    konu: "",
    icerik: ""
  });
  
  const [tutanakForm, setTutanakForm] = useState({
    ilgiliId: "",
    konu: "",
    icerik: ""
  });

  const [defenseText, setDefenseText] = useState("");
  const [decisionForm, setDecisionForm] = useState({
    kararTuru: "UYARI",
    cezaTutari: "",
    kararNotu: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      const resMe = await fetch("/api/auth/me");
      if (resMe.ok) {
        const dataMe = await resMe.json();
        setCurrentUser(dataMe.kullanici);
      }
      
      const [resD, resT, resP] = await Promise.all([
        fetch("/api/dilekceler?kisisel=true"),
        fetch("/api/tutanaklar?kisisel=true"),
        fetch("/api/ayarlar/personel"),
      ]);

      if (resD.ok) setDilekceler(await resD.ok ? await resD.json() : []);
      if (resT.ok) setTutanaklar(await resT.ok ? await resT.json() : []);
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

  const isManager = false; // Personal view doesn't display management tools

  // Dilekçe Kaydet
  const handleDilekceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/dilekceler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dilekceForm)
      });
      if (res.ok) {
        setIsDilekceModalOpen(false);
        setDilekceForm({ tur: "IZIN", izinTuru: "EGITIM_IZNI", miktar: "", konu: "", icerik: "" });
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
        setTutanakForm({ ilgiliId: personelList[0]?.id || "", konu: "", icerik: "" });
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

  // Savunma Kaydet
  const handleDefenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTutanak) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tutanaklar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedTutanak.id, savunma: defenseText })
      });
      if (res.ok) {
        setIsDefenseModalOpen(false);
        setDefenseText("");
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
        setIsDecisionModalOpen(false);
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

  // Filtering list
  const filteredDilekceler = dilekceler.filter(d => {
    if (dilekceFilter === "BEKLIYOR") return d.onayDurumu === "BEKLIYOR";
    return d.onayDurumu === "ONAYLANDI" || d.onayDurumu === "REDDEDILDI";
  });

  const filteredTutanaklar = tutanaklar.filter(t => t.durum === tutanakFilter);

  // Status Translators
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
      if (sub === 'GEC_KALMA_IZNI') return 'Geç Kalma İzni';
      return 'İzin';
    }
    if (tur === 'AVANS_TALEBI') return 'Avans Talebi';
    if (tur === 'ODENEK') return 'Ödenek Talebi';
    return tur;
  };

  return (
    <div className="space-y-6">
      {/* 1. Modals */}
      {/* Dilekçe Ekle Modal */}
      {isDilekceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Yeni Dilekçe Yaz</h3>
              <button onClick={() => setIsDilekceModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleDilekceSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Dilekçe Türü *</label>
                  <select value={dilekceForm.tur} onChange={(e) => setDilekceForm({ ...dilekceForm, tur: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                    <option value="IZIN">İzin Talebi</option>
                    <option value="AVANS_TALEBI">Avans Talebi</option>
                    <option value="ODENEK">Ödenek Talebi</option>
                  </select>
                </div>
                {dilekceForm.tur === "IZIN" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">İzin Türü *</label>
                    <select value={dilekceForm.izinTuru} onChange={(e) => setDilekceForm({ ...dilekceForm, izinTuru: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                      <option value="EGITIM_IZNI">Eğitim İzni</option>
                      <option value="IS_IZNI">İş İzni</option>
                      <option value="ERKEN_CIKIS_IZNI">Erken Çıkış İzni</option>
                      <option value="GEC_KALMA_IZNI">Geç Kalma İzni</option>
                    </select>
                  </div>
                )}
                {dilekceForm.tur === "AVANS_TALEBI" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Talep Edilen Tutar (₺) *</label>
                    <input required type="number" min="1" step="any" value={dilekceForm.miktar} onChange={(e) => setDilekceForm({ ...dilekceForm, miktar: e.target.value })} placeholder="Talep ettiğiniz tutar" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Konu *</label>
                <input required type="text" value={dilekceForm.konu} onChange={(e) => setDilekceForm({ ...dilekceForm, konu: e.target.value })} placeholder="Dilekçe konusu" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">İçerik / Açıklama *</label>
                <textarea required rows={5} value={dilekceForm.icerik} onChange={(e) => setDilekceForm({ ...dilekceForm, icerik: e.target.value })} placeholder="Lütfen detayları detaylıca belirtin..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
                {loading ? "Kaydediliyor..." : "Kaydet ve Gönder"}
              </button>
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
                  {personelList.map(p => <option key={p.id} value={p.id}>{p.adSoyad} ({p.birim?.ad || "-"})</option>)}
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

      {/* Savunma Yazma Modal */}
      {isDefenseModalOpen && selectedTutanak && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><FileSignature className="w-5 h-5 text-blue-400" /> Tutanak Savunması Yaz</h3>
              <button onClick={() => setIsDefenseModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleDefenseSubmit} className="p-6 space-y-4">
              <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-700 text-sm space-y-2">
                <div><span className="font-bold text-white">Konu:</span> {selectedTutanak.konu}</div>
                <div><span className="font-bold text-white">Olay:</span> {selectedTutanak.icerik}</div>
                <div><span className="font-bold text-white">Ekleyen:</span> {selectedTutanak.ekleyen?.adSoyad}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Sizin Savunmanız / Açıklamanız *</label>
                <textarea required rows={5} value={defenseText} onChange={(e) => setDefenseText(e.target.value)} placeholder="Lütfen olayla ilgili açıklamanızı detaylıca buraya yazın..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
                {loading ? "Kaydediliyor..." : "Savunmayı Gönder"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Karar Verme Modal */}
      {isDecisionModalOpen && selectedTutanak && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Tutanak Sonucunu Belirle</h3>
              <button onClick={() => setIsDecisionModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleDecisionSubmit} className="p-6 space-y-4">
              <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-700 text-sm space-y-2">
                <div><span className="font-bold text-white">Personel:</span> {selectedTutanak.ilgili?.adSoyad}</div>
                <div><span className="font-bold text-white">Konu:</span> {selectedTutanak.konu}</div>
                <div><span className="font-bold text-white">Olay Özeti:</span> {selectedTutanak.icerik}</div>
                <div><span className="font-bold text-white">Personel Savunması:</span> {selectedTutanak.savunma || "Savunma yapılmadı / boş bırakıldı."}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Yaptırım Türü *</label>
                  <select value={decisionForm.kararTuru} onChange={(e) => setDecisionForm({ ...decisionForm, kararTuru: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                    <option value="UYARI">Uyarı</option>
                    <option value="PARA_CEZASI">Para Cezası</option>
                    <option value="UZAKLASTIRMA">Uzaklaştırma</option>
                    <option value="TEMIZLIK_NOBETI">Temizlik Nöbeti</option>
                    <option value="IS_CIKISI">İş Çıkışı</option>
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
                <textarea rows={3} value={decisionForm.kararNotu} onChange={(e) => setDecisionForm({ ...decisionForm, kararNotu: e.target.value })} placeholder="Kararla ilgili ek açıklama veya not yazın..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
                {loading ? "Karar Kaydediliyor..." : "Kararı Uygula"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-8 h-8 text-sky-400" /> Dilekçe & Tutanak Merkezi
          </h1>
          <p className="text-slate-400 mt-2">İzin, avans, ödenek dilekçeleri ve personel tutanaklarının workflow yönetimi.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsDilekceModalOpen(true)} className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Yeni Dilekçe Yaz
          </button>
          <button onClick={() => setIsTutanakModalOpen(true)} className="flex items-center gap-2 bg-red-600/80 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <ShieldAlert className="w-4 h-4" /> Tutanak Tut
          </button>
        </div>
      </div>

      {/* 3. Module Tabs */}
      <div className="flex border-b border-slate-700">
        <button 
          onClick={() => setActiveViewTab("dilekceler")} 
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${activeViewTab === "dilekceler" ? 'text-sky-400 border-b-sky-400 font-bold' : 'text-slate-400 border-b-transparent hover:text-white'}`}
        >
          <FileText className="w-4 h-4" /> Dilekçeler
        </button>
        <button 
          onClick={() => setActiveViewTab("tutanaklar")} 
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${activeViewTab === "tutanaklar" ? 'text-sky-400 border-b-sky-400 font-bold' : 'text-slate-400 border-b-transparent hover:text-white'}`}
        >
          <ShieldAlert className="w-4 h-4" /> Tutanaklar
        </button>
      </div>

      {/* 4. Content */}
      {activeViewTab === "dilekceler" ? (
        <div className="space-y-4">
          {/* Sub Filters for Dilekçeler */}
          <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
            <div className="flex border border-slate-700 rounded-lg p-0.5 bg-slate-900">
              <button 
                onClick={() => setDilekceFilter("BEKLIYOR")} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${dilekceFilter === 'BEKLIYOR' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Onay Bekleyenler ({dilekceler.filter(d => d.onayDurumu === "BEKLIYOR").length})
              </button>
              <button 
                onClick={() => setDilekceFilter("SONUCLANAN")} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${dilekceFilter === 'SONUCLANAN' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Sonuçlananlar
              </button>
            </div>
            <span className="text-xs text-slate-500 font-medium">Toplam {filteredDilekceler.length} dilekçe</span>
          </div>

          {/* Dilekçe List */}
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
                      {d.tur === 'AVANS_TALEBI' && d.miktar && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold">
                          Talep Edilen Avans: ₺{d.miktar.toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 bg-slate-900/40 p-3 rounded border border-slate-700/50 leading-relaxed font-mono whitespace-pre-wrap">{d.icerik}</p>
                    {d.onayDurumu === "REDDEDILDI" && d.redNedeni && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded text-xs">
                        <strong>Red Nedeni:</strong> {d.redNedeni}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="text-slate-300 font-bold">{d.personel?.adSoyad}</span>
                      <span>•</span>
                      <span>{new Date(d.tarih).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0 self-end md:self-center">
                    {d.onayDurumu === "BEKLIYOR" && isManager ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDilekceStatus(d.id, "REDDEDILDI")}
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
      ) : (
        <div className="space-y-4">
          {/* Sub Filters for Tutanaklar */}
          <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
            <div className="flex border border-slate-700 rounded-lg p-0.5 bg-slate-900">
              <button 
                onClick={() => setTutanakFilter("YENI")} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${tutanakFilter === 'YENI' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Yeni ({tutanaklar.filter(t => t.durum === 'YENI').length})
              </button>
              <button 
                onClick={() => setTutanakFilter("SAVUNMA_YAPILDI")} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${tutanakFilter === 'SAVUNMA_YAPILDI' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Savunma Yapıldı ({tutanaklar.filter(t => t.durum === 'SAVUNMA_YAPILDI').length})
              </button>
              <button 
                onClick={() => setTutanakFilter("KARAR_VERILDI")} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${tutanakFilter === 'KARAR_VERILDI' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Karar Verildi
              </button>
            </div>
            <span className="text-xs text-slate-500 font-medium">Toplam {filteredTutanaklar.length} kayıt</span>
          </div>

          {/* Tutanak List */}
          <div className="space-y-3">
            {filteredTutanaklar.length === 0 ? (
              <div className="glass-panel p-12 text-center text-slate-400">
                Gösterilecek tutanak kaydı bulunamadı.
              </div>
            ) : (
              filteredTutanaklar.map(t => (
                <div key={t.id} className="glass-panel p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-base">{t.konu}</span>
                      <span className="text-xs px-2 py-0.5 rounded border border-slate-700 bg-slate-900/60 text-slate-400 font-semibold">
                        İlgili: {t.ilgili?.adSoyad}
                      </span>
                    </div>
                    
                    {/* Event summary */}
                    <div className="bg-slate-900/40 p-3 rounded border border-slate-700/50 text-sm space-y-1">
                      <div className="text-slate-400 font-bold">Olay:</div>
                      <p className="text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">{t.icerik}</p>
                    </div>

                    {/* Defense summary if exists */}
                    {t.savunma && (
                      <div className="bg-blue-950/20 p-3 rounded border border-blue-900/20 text-sm space-y-1">
                        <div className="text-blue-400 font-bold flex items-center gap-1.5"><FileSignature className="w-3.5 h-3.5" /> Personel Savunması:</div>
                        <p className="text-blue-300 font-mono whitespace-pre-wrap leading-relaxed">{t.savunma}</p>
                      </div>
                    )}

                    {/* Decision summary if exists */}
                    {t.durum === 'KARAR_VERILDI' && (
                      <div className="bg-emerald-950/20 p-3 rounded border border-emerald-900/20 text-sm space-y-1">
                        <div className="text-emerald-400 font-bold">Yönetici Kararı:</div>
                        <div className="text-emerald-300 font-mono">
                          Yaptırım: {t.kararTuru === 'UYARI' ? 'Yazılı Uyarı' : t.kararTuru === 'PARA_CEZASI' ? `Para Cezası (₺${t.cezaTutari?.toLocaleString('tr-TR')})` : t.kararTuru === 'TEMIZLIK_NOBETI' ? 'Temizlik Nöbeti' : t.kararTuru === 'IS_CIKISI' ? 'İş Çıkışı' : 'Uzaklaştırma'}
                        </div>
                        {t.kararNotu && (
                          <div className="text-slate-300 text-xs mt-1 italic">
                            <span className="font-semibold text-emerald-400 font-sans not-italic">Karar Notu:</span> {t.kararNotu}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                      <span>Ekleyen: <strong className="text-slate-300 font-semibold">{t.ekleyen?.adSoyad}</strong></span>
                      <span>•</span>
                      <span>Birim: {t.ilgili?.birim?.ad || "-"}</span>
                      <span>•</span>
                      <span>Tarih: {new Date(t.tarih).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                    {/* Action buttons based on workflow status */}
                    {t.durum === 'YENI' && (t.ilgiliId === currentUser?.id || isManager) && (
                      <button 
                        onClick={() => { setSelectedTutanak(t); setIsDefenseModalOpen(true); }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-lg"
                      >
                        <FileSignature className="w-3.5 h-3.5" /> {t.ilgiliId === currentUser?.id ? "Savunma Yaz" : "Savunma Al/Yaz"}
                      </button>
                    )}

                    {t.durum === 'SAVUNMA_YAPILDI' && isManager && (
                      <button 
                        onClick={() => { setSelectedTutanak(t); setIsDecisionModalOpen(true); }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-lg"
                      >
                        <Check className="w-3.5 h-3.5" /> Karar Ver
                      </button>
                    )}

                    {t.durum === 'YENI' && (
                      <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">Savunma Bekleniyor</span>
                    )}
                    {t.durum === 'SAVUNMA_YAPILDI' && (
                      <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">Savunma Yapıldı</span>
                    )}
                    {t.durum === 'KARAR_VERILDI' && (
                      <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">Karar Verildi</span>
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
