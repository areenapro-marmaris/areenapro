"use client";

import { useState, useEffect } from "react";
import { Settings, Building, Heart, Briefcase, Trash2, Plus, X, Save, Edit2 } from "lucide-react";

export default function GenelAyarlarPage() {
  const [sirketler, setSirketler] = useState<any[]>([]);
  const [sigortaSirketleri, setSigortaSirketleri] = useState<any[]>([]);
  const [birimler, setBirimler] = useState<any[]>([]);
  const [personelList, setPersonelList] = useState<any[]>([]);
  
  const [newSirket, setNewSirket] = useState("");
  const [newSigorta, setNewSigorta] = useState("");
  const [newBirim, setNewBirim] = useState("");

  // Editing state for Birim & Authorities
  const [editingBirim, setEditingBirim] = useState<any>(null);
  const [editingBirimName, setEditingBirimName] = useState("");
  const [yetkiliIds, setYetkiliIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [resS, resSi, resB, resP] = await Promise.all([
        fetch("/api/ayarlar/sirketler"),
        fetch("/api/ayarlar/sigorta-sirketleri"),
        fetch("/api/ayarlar/birimler"),
        fetch("/api/ayarlar/personel"),
      ]);
      if (resS.ok) setSirketler(await resS.json());
      if (resSi.ok) setSigortaSirketleri(await resSi.json());
      if (resB.ok) setBirimler(await resB.json());
      if (resP.ok) {
        const pData = await resP.json();
        setPersonelList(pData.filter((p: any) => p.aktif));
      }
    } catch (err) {
      console.error("Hata:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addSirket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSirket) return;
    try {
      const res = await fetch("/api/ayarlar/sirketler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad: newSirket })
      });
      if (res.ok) {
        setNewSirket("");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSirket = async (id: string) => {
    if (!window.confirm("Bu şirketi silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/ayarlar/sirketler?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const addSigorta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSigorta) return;
    try {
      const res = await fetch("/api/ayarlar/sigorta-sirketleri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad: newSigorta })
      });
      if (res.ok) {
        setNewSigorta("");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSigorta = async (id: string) => {
    if (!window.confirm("Bu sigorta şirketini silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/ayarlar/sigorta-sirketleri?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const addBirim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBirim) return;
    try {
      const res = await fetch("/api/ayarlar/birimler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad: newBirim })
      });
      if (res.ok) {
        setNewBirim("");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBirim = async (id: string) => {
    if (!window.confirm("Bu birimi silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/ayarlar/birimler?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Open Birim Edit modal and load properties
  const openEditBirim = (birim: any) => {
    setEditingBirim(birim);
    setEditingBirimName(birim.ad);
    setYetkiliIds(birim.yetkililer?.map((y: any) => y.id) || []);
  };

  // Save changes to Birim
  const handleSaveBirim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBirim) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ayarlar/birimler", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBirim.id,
          ad: editingBirimName,
          yetkiliIds: yetkiliIds.filter(Boolean) // Remove any empty selections
        })
      });
      if (res.ok) {
        setEditingBirim(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "İşlem başarısız.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add a new row to manager dropdowns
  const handleAddYetkiliRow = () => {
    setYetkiliIds([...yetkiliIds, ""]);
  };

  // Update specific index manager choice
  const handleYetkiliChange = (index: number, val: string) => {
    const nextList = [...yetkiliIds];
    nextList[index] = val;
    setYetkiliIds(nextList);
  };

  // Remove specific index manager choice
  const handleRemoveYetkiliRow = (index: number) => {
    const nextList = yetkiliIds.filter((_, idx) => idx !== index);
    setYetkiliIds(nextList);
  };

  return (
    <div className="space-y-6">
      
      {/* Birim Edit Modal (Replicating "Birim Düzenle" panel from screenshot 2) */}
      {editingBirim && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            {/* Red header bar matching Birim Düzenle title */}
            <div className="bg-[#c0392b] p-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Briefcase className="w-5 h-5" /> Birim Düzenle
              </h3>
              <button onClick={() => setEditingBirim(null)} className="text-white hover:opacity-85"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSaveBirim} className="p-6 space-y-6">
              
              {/* Birim Adı Row */}
              <div className="grid grid-cols-4 items-center gap-4 border-b border-slate-700/50 pb-4">
                <label className="col-span-1 text-sm font-semibold text-slate-300">Birim Adı</label>
                <input 
                  required
                  type="text" 
                  value={editingBirimName} 
                  onChange={(e) => setEditingBirimName(e.target.value)}
                  className="col-span-3 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Birim Yetkili Personeller Row */}
              <div className="grid grid-cols-4 items-start gap-4">
                <label className="col-span-1 text-sm font-semibold text-slate-300 pt-2">Birim yetkilisi personeller</label>
                <div className="col-span-3 space-y-3">
                  {yetkiliIds.map((selectedId, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select 
                        value={selectedId} 
                        onChange={(e) => handleYetkiliChange(idx, e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                      >
                        <option value="">Seçiniz...</option>
                        {personelList.map(p => (
                          <option key={p.id} value={p.id}>{p.adSoyad} ({p.rol})</option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveYetkiliRow(idx)}
                        className="text-slate-400 hover:text-red-400 p-2 border border-slate-700 rounded-lg bg-slate-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Plus Add button (Green icon button matching screenshot 2) */}
                  <button 
                    type="button" 
                    onClick={handleAddYetkiliRow}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold text-sm pt-2"
                  >
                    <Plus className="w-5 h-5 border border-emerald-500/20 bg-emerald-500/10 rounded" />
                  </button>
                </div>
              </div>

              {/* Save Disk Icon button (Blue button matching screenshot 2) */}
              <div className="flex justify-end gap-2 border-t border-slate-700/50 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingBirim(null)} 
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Vazgeç
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-bold text-sm shadow-lg transition-colors"
                >
                  <Save className="w-4 h-4" /> Kaydet
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="w-8 h-8 text-blue-400" /> Genel Ayarlar
        </h1>
        <p className="text-slate-400 mt-2">Şirketler, sigorta şirketleri ve departman tanımlamaları.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sirketler */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700/50 pb-2">
            <Building className="w-5 h-5 text-blue-400" /> Şirketler
          </h3>
          
          <form onSubmit={addSirket} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Yeni Şirket Adı" 
              value={newSirket} 
              onChange={(e) => setNewSirket(e.target.value)} 
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" 
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-white font-bold text-sm shrink-0">
              Ekle
            </button>
          </form>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {sirketler.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Şirket bulunmamaktadır.</p>
            ) : (
              sirketler.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/40 text-sm">
                  <span className="text-slate-300 font-medium">{s.ad}</span>
                  <button onClick={() => deleteSirket(s.id)} className="text-slate-500 hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sigorta Sirketleri */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700/50 pb-2">
            <Heart className="w-5 h-5 text-red-400" /> Sigorta Şirketleri
          </h3>
          
          <form onSubmit={addSigorta} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Yeni Sigorta Şirketi" 
              value={newSigorta} 
              onChange={(e) => setNewSigorta(e.target.value)} 
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" 
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-white font-bold text-sm shrink-0">
              Ekle
            </button>
          </form>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {sigortaSirketleri.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Sigorta şirketi bulunmamaktadır.</p>
            ) : (
              sigortaSirketleri.map(si => (
                <div key={si.id} className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/40 text-sm">
                  <span className="text-slate-300 font-medium">{si.ad}</span>
                  <button onClick={() => deleteSigorta(si.id)} className="text-slate-500 hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Departmanlar (Birimler - Replicating Birim Listesi from screenshot 1) */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700/50 pb-2 bg-[#c0392b] p-3 -mx-5 -mt-5 rounded-t-xl">
            <Briefcase className="w-5 h-5 text-white animate-pulse" /> Birim Listesi
          </h3>
          
          <form onSubmit={addBirim} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Yeni Birim Adı" 
              value={newBirim} 
              onChange={(e) => setNewBirim(e.target.value)} 
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" 
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-white font-bold text-sm shrink-0 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Yeni Ekle
            </button>
          </form>

          {/* Table from Screenshot 1 */}
          <div className="border border-slate-700 rounded-lg overflow-hidden divide-y divide-slate-700 max-h-[350px] overflow-y-auto">
            {birimler.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Birim bulunmamaktadır.</p>
            ) : (
              birimler.map(b => (
                <div key={b.id} className="flex items-center justify-between bg-slate-900/40 p-3 text-sm hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-2">
                    {/* Edit button in first column */}
                    <button 
                      onClick={() => openEditBirim(b)} 
                      title="Birim Yetkililerini Düzenle"
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors border border-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="space-y-0.5">
                      <span className="text-slate-200 font-medium block">{b.ad}</span>
                      {b.yetkililer && b.yetkililer.length > 0 && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Yetkililer: {b.yetkililer.map((y: any) => y.adSoyad).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Delete button in last column */}
                  <button onClick={() => deleteBirim(b.id)} className="text-slate-500 hover:text-red-400 p-1.5 border border-slate-700 rounded-lg hover:bg-red-400/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
