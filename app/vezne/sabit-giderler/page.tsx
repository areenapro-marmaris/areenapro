"use client";

import { useState } from "react";
import { CreditCard, X, Plus, Trash2, Edit2, RefreshCw } from "lucide-react";

const initialSabitGiderler = [
  { id: "1", aciklama: "Güvenlik Personeli", tutar: 5000, periyot: "Aylık", aktif: true },
  { id: "2", aciklama: "İnternet Faturası", tutar: 850, periyot: "Aylık", aktif: true },
  { id: "3", aciklama: "Temizlik Hizmeti", tutar: 3200, periyot: "Aylık", aktif: true },
  { id: "4", aciklama: "Kasa Kiralama", tutar: 200, periyot: "Aylık", aktif: false },
];

const periyotlar = ["Günlük", "Haftalık", "Aylık", "Yıllık"];

export default function SabitGiderlerPage() {
  const currentUserRole = "YONETICI";
  const [giderler, setGiderler] = useState(initialSabitGiderler);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formRecord, setFormRecord] = useState({ aciklama: "", tutar: "", periyot: "Aylık" });

  const openNewModal = () => {
    setEditingId(null);
    setFormRecord({ aciklama: "", tutar: "", periyot: "Aylık" });
    setIsModalOpen(true);
  };

  const openEditModal = (g: any) => {
    setEditingId(g.id);
    setFormRecord({ aciklama: g.aciklama, tutar: g.tutar.toString(), periyot: g.periyot });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const tutar = parseFloat(formRecord.tutar) || 0;
    if (editingId) {
      setGiderler(giderler.map(g => g.id === editingId ? { ...g, ...formRecord, tutar } : g));
    } else {
      setGiderler([...giderler, { id: Date.now().toString(), ...formRecord, tutar, aktif: true }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bu sabit gideri silmek istediğinize emin misiniz?")) setGiderler(giderler.filter(g => g.id !== id));
  };

  const toggleAktif = (id: string) => {
    setGiderler(giderler.map(g => g.id === id ? { ...g, aktif: !g.aktif } : g));
  };

  const totalAktif = giderler.filter(g => g.aktif).reduce((acc, g) => acc + g.tutar, 0);

  return (
    <div className="space-y-6">
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{editingId ? "Sabit Gideri Düzenle" : "Yeni Sabit Gider Tanımla"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Gider Adı / Açıklama</label>
                <input required type="text" value={formRecord.aciklama} onChange={(e) => setFormRecord({ ...formRecord, aciklama: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="Örn: İnternet Faturası" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tutar (₺)</label>
                  <input required type="number" min="0" step="0.01" value={formRecord.tutar} onChange={(e) => setFormRecord({ ...formRecord, tutar: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="0.00" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Periyot</label>
                  <select value={formRecord.periyot} onChange={(e) => setFormRecord({ ...formRecord, periyot: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500">
                    {periyotlar.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors mt-4">
                {editingId ? "Değişiklikleri Kaydet" : "Sabit Gider Tanımla"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <RefreshCw className="w-8 h-8 text-indigo-400" /> Sabit Giderler
          </h1>
          <p className="text-slate-400 mt-2">Düzenli işletme giderlerini tanımlayın. Aktif olanlar kasaya otomatik yansır.</p>
        </div>
        <div className="glass-panel px-6 py-2 flex flex-col items-end border-b-2 border-b-indigo-500 bg-indigo-500/5">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Aktif Aylık Yük</span>
          <span className="text-2xl font-bold text-indigo-400">₺{totalAktif.toLocaleString('tr-TR')}</span>
        </div>
      </div>

      <div className="glass-panel overflow-hidden border-t-2 border-t-indigo-500/30">
        <div className="p-4 border-b border-slate-700/50 flex justify-end">
          {currentUserRole === "YONETICI" && (
            <button onClick={openNewModal} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Yeni Sabit Gider Ekle
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/80 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Gider Adı</th>
                <th className="px-6 py-4 font-semibold text-center">Periyot</th>
                <th className="px-6 py-4 font-semibold text-right">Tutar</th>
                <th className="px-6 py-4 font-semibold text-center">Durum</th>
                {currentUserRole === "YONETICI" && <th className="px-6 py-4 font-semibold text-right">İşlem</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {giderler.map((g) => (
                <tr key={g.id} className={`transition-colors duration-300 ${!g.aktif ? 'opacity-40' : 'hover:bg-slate-800/50'}`}>
                  <td className="px-6 py-4 font-medium text-white">{g.aciklama}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">{g.periyot}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-indigo-400">₺{g.tutar.toLocaleString('tr-TR')}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => toggleAktif(g.id)} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all border ${g.aktif ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-700/50 text-slate-500 border-slate-600/50 hover:bg-slate-700'}`}>
                      {g.aktif ? "Aktif" : "Pasif"}
                    </button>
                  </td>
                  {currentUserRole === "YONETICI" && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(g)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(g.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
