"use client";

import { useState } from "react";
import { Search, Receipt, Calendar as CalendarIcon, X, Plus, Trash2, Edit2, Tag } from "lucide-react";

// Mock Data
const initialOdemeler = [
  { id: "1", aciklama: "Manav Ödemesi (Meyve)", kategori: "Mutfak", tutar: 3500, fisNo: "A-1204", tarih: "2026-06-04", ekleyen: "Uğur Tanka" },
  { id: "2", aciklama: "Tesisatçı (Boru Tamiri)", kategori: "Bakım/Onarım", tutar: 1200, fisNo: "-", tarih: "2026-06-04", ekleyen: "Uğur Tanka" },
  { id: "3", aciklama: "Taksi Ücreti", kategori: "Ulaşım", tutar: 450, fisNo: "TKS-88", tarih: "2026-06-04", ekleyen: "Uğur Tanka" },
  { id: "4", aciklama: "Buz Alımı", kategori: "Bar", tutar: 2000, fisNo: "B-991", tarih: "2026-06-03", ekleyen: "Uğur Tanka" },
];

const kategoriler = ["Mutfak", "Bar", "Bakım/Onarım", "Ulaşım", "Personel", "Diğer"];

export default function OdemelerPage() {
  const currentUserRole = "YONETICI"; // "VEZNE" veya "YONETICI"

  const getBusinessDate = () => {
    const now = new Date();
    if (now.getHours() < 9) {
      now.setDate(now.getDate() - 1);
    }
    return now.toISOString().split('T')[0];
  };

  const [odemeler, setOdemeler] = useState(initialOdemeler);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(getBusinessDate());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formRecord, setFormRecord] = useState({
    aciklama: "",
    kategori: "Diğer",
    tutar: "",
    fisNo: "",
  });

  const openNewRecordModal = () => {
    setEditingId(null);
    setFormRecord({ aciklama: "", kategori: "Diğer", tutar: "", fisNo: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (odeme: any) => {
    setEditingId(odeme.id);
    setFormRecord({
      aciklama: odeme.aciklama,
      kategori: odeme.kategori,
      tutar: odeme.tutar.toString(),
      fisNo: odeme.fisNo || "",
    });
    setIsModalOpen(true);
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm("Bu ödeme/gider kaydını silmek istediğinize emin misiniz?")) {
      setOdemeler(odemeler.filter(o => o.id !== id));
    }
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const tutar = parseFloat(formRecord.tutar) || 0;
    
    if (editingId) {
      setOdemeler(odemeler.map(o => 
        o.id === editingId 
          ? { ...o, ...formRecord, tutar } 
          : o
      ));
    } else {
      const yeniKayit = {
        id: Date.now().toString(),
        aciklama: formRecord.aciklama,
        kategori: formRecord.kategori,
        tutar: tutar,
        fisNo: formRecord.fisNo || "-",
        tarih: selectedDate,
        ekleyen: "Uğur Tanka", // Gerçek sistemde session'dan alınacak
      };
      setOdemeler([...odemeler, yeniKayit]);
    }

    setIsModalOpen(false);
  };

  const filteredOdemeler = odemeler.filter(o => 
    o.tarih === selectedDate &&
    (o.aciklama.toLowerCase().includes(searchTerm.toLowerCase()) || 
     o.kategori.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalGider = filteredOdemeler.reduce((acc, curr) => acc + curr.tutar, 0);

  const displayDate = new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Modal - Ekleme / Düzenleme Ekranı */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-400" />
                {editingId ? "Gideri Düzenle" : "Yeni Gider/Ödeme Ekle"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveRecord} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Açıklama / Unvan</label>
                <input required type="text" value={formRecord.aciklama} onChange={(e) => setFormRecord({...formRecord, aciklama: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-rose-500" placeholder="Örn: Tesisatçı Boru Tamiri" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Kategori</label>
                <select 
                  value={formRecord.kategori} 
                  onChange={(e) => setFormRecord({...formRecord, kategori: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-rose-500 appearance-none"
                >
                  {kategoriler.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tutar (₺)</label>
                  <input required type="number" min="0" step="0.01" value={formRecord.tutar} onChange={(e) => setFormRecord({...formRecord, tutar: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-rose-500" placeholder="0.00" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Fiş / Belge No</label>
                  <input type="text" value={formRecord.fisNo} onChange={(e) => setFormRecord({...formRecord, fisNo: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-rose-500" placeholder="İsteğe bağlı" />
                </div>
              </div>

              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg transition-colors mt-6 shadow-lg shadow-rose-900/20">
                {editingId ? "Değişiklikleri Kaydet" : "Kasadan Çıkış Yap"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Üst Bilgi ve Filtreler */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Receipt className="w-8 h-8 text-rose-400" />
            Ödemeler ve Giderler
          </h1>
          <p className="text-slate-400 mt-2 flex items-center gap-2">
            Operasyon Gecesi: <strong className="text-white">{displayDate}</strong> (21:00 - 08:00 mesaisi)
            {currentUserRole === "YONETICI" && (
              <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/30">
                Yönetici Yetkisi Aktif
              </span>
            )}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative bg-slate-800 border-2 border-rose-500/50 rounded-xl p-2 shadow-lg shadow-rose-500/10 hover:border-rose-400 transition-colors cursor-pointer group">
            <label htmlFor="datePicker" className="absolute -top-3 left-3 bg-slate-900 px-2 text-xs font-bold tracking-wide text-rose-400 uppercase rounded-sm">
              Tarih Filtresi
            </label>
            <div className="flex items-center gap-3 px-3 py-1">
              <CalendarIcon className="w-6 h-6 text-rose-400 group-hover:text-rose-300 transition-colors" />
              <input 
                id="datePicker"
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-white text-lg font-semibold focus:outline-none focus:ring-0 p-0 cursor-pointer w-[150px] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
          </div>

          <div className="h-12 w-px bg-slate-700/50 hidden lg:block"></div>

          <div className="glass-panel px-6 py-2 flex flex-col items-end border-b-2 border-b-rose-500 bg-rose-500/5">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Toplam Gider</span>
            <span className="text-2xl font-bold text-rose-400">₺{totalGider.toLocaleString('tr-TR')}</span>
          </div>
        </div>
      </div>

      {/* Tablo Alanı */}
      <div className="glass-panel overflow-hidden border-t-2 border-t-rose-500/30">
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Açıklama veya kategori ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>
          <button 
            onClick={openNewRecordModal}
            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto shadow-lg shadow-rose-900/20"
          >
            <Plus className="w-4 h-4" /> Yeni Gider Ekle
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800/80 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Tarih</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold">Açıklama</th>
                <th className="px-6 py-4 font-semibold">Fiş / Belge No</th>
                <th className="px-6 py-4 font-semibold">Ekleyen</th>
                <th className="px-6 py-4 font-semibold text-right">Tutar</th>
                {currentUserRole === "YONETICI" && <th className="px-6 py-4 font-semibold text-right">İşlem</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredOdemeler.map((odeme) => (
                <tr key={odeme.id} className="transition-colors duration-300 hover:bg-slate-800/50">
                  <td className="px-6 py-4 text-slate-400">{odeme.tarih}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-700/50 text-slate-300 text-xs font-medium border border-slate-600/50">
                      <Tag className="w-3 h-3 text-rose-400" /> {odeme.kategori}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{odeme.aciklama}</td>
                  <td className="px-6 py-4 text-slate-400">{odeme.fisNo}</td>
                  <td className="px-6 py-4 text-slate-400">{odeme.ekleyen}</td>
                  <td className="px-6 py-4 text-right font-bold text-rose-400">₺{odeme.tutar.toLocaleString('tr-TR')}</td>
                  
                  {currentUserRole === "YONETICI" && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(odeme)}
                          title="Düzenle"
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRecord(odeme.id)}
                          title="Sil"
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              
              {filteredOdemeler.length === 0 && (
                <tr>
                  <td colSpan={currentUserRole === "YONETICI" ? 7 : 6} className="px-6 py-12 text-center">
                    <p className="text-slate-400 text-base mb-2">{displayDate} gecesi için henüz bir gider kaydı girilmemiş.</p>
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
