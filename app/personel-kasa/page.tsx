"use client";

import { useState } from "react";
import { Briefcase, CheckCircle, Clock, X, Plus, Trash2, AlertCircle } from "lucide-react";

const initialTalepler = [
  { id: "1", personel: "Murat Demir", tur: "AVANS", miktar: 3000, aciklama: "Kira ödemesi için avans talebi", durum: "BEKLIYOR", tarih: "2026-06-04", odendiMi: false },
  { id: "2", personel: "Zeynep Çelik", tur: "CEZA", miktar: 500, aciklama: "İzinsiz geç giriş (3 tekrar)", durum: "ONAYLANDI", tarih: "2026-06-03", odendiMi: false },
  { id: "3", personel: "Ali Şahin", tur: "AVANS", miktar: 1500, aciklama: "Acil sağlık masrafı", durum: "ONAYLANDI", tarih: "2026-06-02", odendiMi: true },
];

export default function PersonelKasaPage() {
  const currentUserRole = "YONETICI";
  const [talepler, setTalepler] = useState(initialTalepler);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"BEKLIYOR" | "ONAYLANDI">("BEKLIYOR");
  const [formRecord, setFormRecord] = useState({ personel: "", tur: "AVANS", miktar: "", aciklama: "" });

  const handleApprove = (id: string) => setTalepler(talepler.map(t => t.id === id ? { ...t, durum: "ONAYLANDI" } : t));
  const handleReject = (id: string) => { if (window.confirm("Bu talebi reddetmek istiyor musunuz?")) setTalepler(talepler.filter(t => t.id !== id)); };
  const handleMarkPaid = (id: string) => setTalepler(talepler.map(t => t.id === id ? { ...t, odendiMi: true } : t));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setTalepler([...talepler, { id: Date.now().toString(), ...formRecord, miktar: parseFloat(formRecord.miktar) || 0, durum: "BEKLIYOR", tarih: new Date().toISOString().split('T')[0], odendiMi: false }]);
    setIsModalOpen(false);
    setFormRecord({ personel: "", tur: "AVANS", miktar: "", aciklama: "" });
  };

  const filtered = talepler.filter(t => t.durum === activeTab);

  return (
    <div className="space-y-6">
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Yeni Talep / Ceza Girişi</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">İşlem Tipi</label>
                <div className="flex gap-4">
                  {["AVANS", "CEZA"].map(tip => (
                    <label key={tip} className="flex-1 cursor-pointer">
                      <input type="radio" className="peer sr-only" checked={formRecord.tur === tip} onChange={() => setFormRecord({ ...formRecord, tur: tip })} />
                      <div className={`p-3 border border-slate-700 rounded-lg text-center transition-all ${tip === "AVANS" ? "peer-checked:bg-blue-500/20 peer-checked:border-blue-500 peer-checked:text-blue-400" : "peer-checked:bg-red-500/20 peer-checked:border-red-500 peer-checked:text-red-400"} text-slate-400`}>
                        {tip === "AVANS" ? "Avans" : "Ceza"}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Personel Adı</label>
                <input required type="text" value={formRecord.personel} onChange={(e) => setFormRecord({ ...formRecord, personel: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="Örn: Murat Demir" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tutar (₺)</label>
                <input required type="number" min="0" step="0.01" value={formRecord.miktar} onChange={(e) => setFormRecord({ ...formRecord, miktar: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Açıklama / Gerekçe</label>
                <textarea required rows={3} value={formRecord.aciklama} onChange={(e) => setFormRecord({ ...formRecord, aciklama: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none" placeholder="Neden avans/ceza istendiğini açıklayın..." />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">Kaydet</button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-blue-400" /> Personel Kasa & Onay Merkezi
          </h1>
          <p className="text-slate-400 mt-2">Avans ödemeleri ve ceza onaylarını yönetin.</p>
        </div>
        {currentUserRole === "YONETICI" && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Yeni Talep / Ceza Ekle
          </button>
        )}
      </div>

      {/* Sekmeler */}
      <div className="flex border-b border-slate-700">
        {[{ key: "BEKLIYOR", label: "Bekleyenler", count: talepler.filter(t => t.durum === "BEKLIYOR").length }, { key: "ONAYLANDI", label: "Onaylananlar", count: talepler.filter(t => t.durum === "ONAYLANDI").length }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.key ? 'text-blue-400 border-b-blue-400' : 'text-slate-400 border-b-transparent hover:text-white'}`}>
            {tab.label}
            {tab.count > 0 && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>{tab.count}</span>}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(t => (
          <div key={t.id} className={`glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 ${t.tur === "AVANS" ? 'border-l-blue-500' : 'border-l-red-500'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${t.tur === "AVANS" ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                {t.tur === "AVANS" ? <Briefcase className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white">{t.personel}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border font-bold ${t.tur === "AVANS" ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{t.tur}</span>
                  <span className="text-xs text-slate-500">{t.tarih}</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">{t.aciklama}</p>
                <p className="text-xl font-bold text-white mt-1">₺{t.miktar.toLocaleString('tr-TR')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {t.durum === "BEKLIYOR" && currentUserRole === "YONETICI" && (
                <>
                  <button onClick={() => handleReject(t.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-sm font-medium transition-colors">
                    <X className="w-4 h-4" /> Reddet
                  </button>
                  <button onClick={() => handleApprove(t.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20">
                    <CheckCircle className="w-4 h-4" /> Onayla
                  </button>
                </>
              )}
              {t.durum === "ONAYLANDI" && !t.odendiMi && (
                <button onClick={() => handleMarkPaid(t.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                  <Clock className="w-4 h-4" /> Ödendi İşaretle
                </button>
              )}
              {t.odendiMi && (
                <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-700/50 text-slate-400 text-sm font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Ödeme Tamamlandı
                </span>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="glass-panel p-12 text-center text-slate-400">
            {activeTab === "BEKLIYOR" ? "Onay bekleyen talep bulunmuyor." : "Onaylanmış talep bulunamadı."}
          </div>
        )}
      </div>
    </div>
  );
}
