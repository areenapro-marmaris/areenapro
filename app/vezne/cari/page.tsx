"use client";

import { useState } from "react";
import { FileText, Search, Calendar as CalendarIcon, X, Plus, Trash2, Edit2, User } from "lucide-react";

const initialCarilar = [
  { id: "1", musteriAd: "Ahmet Korkmaz", cariBakiye: 2500, aciklama: "Masa 12 - Adisyon", sorumlu: "Ali Yılmaz", tarih: "2026-06-04" },
  { id: "2", musteriAd: "Mert Şahin", cariBakiye: 1800, aciklama: "VIP Koltuk", sorumlu: "Ali Yılmaz", tarih: "2026-06-04" },
  { id: "3", musteriAd: "Kadir Demir", cariBakiye: 950, aciklama: "Bar Sipariş", sorumlu: "Can Kaya", tarih: "2026-06-04" },
];

export default function CariPage() {
  const currentUserRole = "YONETICI";

  const getBusinessDate = () => {
    const now = new Date();
    if (now.getHours() < 9) now.setDate(now.getDate() - 1);
    return now.toISOString().split('T')[0];
  };

  const [carilar, setCarilar] = useState(initialCarilar);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(getBusinessDate());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formRecord, setFormRecord] = useState({ musteriAd: "", aciklama: "", cariBakiye: "", sorumlu: "" });

  const openNewModal = () => {
    setEditingId(null);
    setFormRecord({ musteriAd: "", aciklama: "", cariBakiye: "", sorumlu: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (c: any) => {
    setEditingId(c.id);
    setFormRecord({ musteriAd: c.musteriAd, aciklama: c.aciklama, cariBakiye: c.cariBakiye.toString(), sorumlu: c.sorumlu });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const bakiye = parseFloat(formRecord.cariBakiye) || 0;
    if (editingId) {
      setCarilar(carilar.map(c => c.id === editingId ? { ...c, ...formRecord, cariBakiye: bakiye } : c));
    } else {
      setCarilar([...carilar, { id: Date.now().toString(), ...formRecord, cariBakiye: bakiye, tarih: selectedDate }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bu cari kaydı silmek istediğinize emin misiniz?")) setCarilar(carilar.filter(c => c.id !== id));
  };

  const filtered = carilar.filter(c => c.tarih === selectedDate && (c.musteriAd.toLowerCase().includes(searchTerm.toLowerCase()) || c.aciklama.toLowerCase().includes(searchTerm.toLowerCase())));
  const totalCari = filtered.reduce((acc, c) => acc + c.cariBakiye, 0);
  const displayDate = new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{editingId ? "Cari Kaydı Düzenle" : "Yeni Cari Girişi"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Müşteri Adı Soyadı</label>
                <input required type="text" value={formRecord.musteriAd} onChange={(e) => setFormRecord({ ...formRecord, musteriAd: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500" placeholder="Örn: Ahmet Korkmaz" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Açıklama</label>
                <input required type="text" value={formRecord.aciklama} onChange={(e) => setFormRecord({ ...formRecord, aciklama: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500" placeholder="Örn: Masa 12 - Adisyon" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Cari Sorumlusu</label>
                <input required type="text" value={formRecord.sorumlu} onChange={(e) => setFormRecord({ ...formRecord, sorumlu: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500" placeholder="Örn: Ali Yılmaz" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Bakiye (₺)</label>
                <input required type="number" min="0" step="0.01" value={formRecord.cariBakiye} onChange={(e) => setFormRecord({ ...formRecord, cariBakiye: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500" placeholder="0.00" />
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition-colors mt-4 shadow-lg shadow-amber-900/20">
                {editingId ? "Değişiklikleri Kaydet" : "Cari Girişi Yap"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-8 h-8 text-amber-400" /> Cari Hesaplar
          </h1>
          <p className="text-slate-400 mt-2">Ödenmeyen ve hesaba yazılan adisyonlar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative bg-slate-800 border-2 border-amber-500/50 rounded-xl p-2 hover:border-amber-400 transition-colors cursor-pointer group">
            <label htmlFor="datePicker" className="absolute -top-3 left-3 bg-slate-900 px-2 text-xs font-bold text-amber-400 uppercase">Tarih Filtresi</label>
            <div className="flex items-center gap-3 px-3 py-1">
              <CalendarIcon className="w-6 h-6 text-amber-400" />
              <input id="datePicker" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none text-white text-lg font-semibold focus:outline-none focus:ring-0 p-0 cursor-pointer w-[150px] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
            </div>
          </div>
          <div className="h-12 w-px bg-slate-700/50 hidden lg:block"></div>
          <div className="glass-panel px-6 py-2 flex flex-col items-end border-b-2 border-b-amber-500 bg-amber-500/5">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Toplam Cari</span>
            <span className="text-2xl font-bold text-amber-400">₺{totalCari.toLocaleString('tr-TR')}</span>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden border-t-2 border-t-amber-500/30">
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Müşteri veya açıklama ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>
          <button onClick={openNewModal} className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Yeni Cari Girişi
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800/80 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Müşteri</th>
                <th className="px-6 py-4 font-semibold">Açıklama</th>
                <th className="px-6 py-4 font-semibold">Cari Sorumlusu</th>
                <th className="px-6 py-4 font-semibold text-right">Tutar</th>
                {currentUserRole === "YONETICI" && <th className="px-6 py-4 font-semibold text-right">İşlem</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2"><User className="w-4 h-4 text-amber-400" />{c.musteriAd}</td>
                  <td className="px-6 py-4 text-slate-300">{c.aciklama}</td>
                  <td className="px-6 py-4 text-slate-400">{c.sorumlu}</td>
                  <td className="px-6 py-4 text-right font-bold text-amber-400">₺{c.cariBakiye.toLocaleString('tr-TR')}</td>
                  {currentUserRole === "YONETICI" && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(c)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">{displayDate} gecesi için cari kaydı bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
