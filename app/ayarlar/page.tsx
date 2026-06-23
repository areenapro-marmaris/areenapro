"use client";

import { useState, useEffect } from "react";
import { 
  Users, Plus, X, Search, Edit2, Trash2, Shield, Building, 
  Heart, FolderPlus, Key, Info, CreditCard, Calendar, UserX, UserCheck
} from "lucide-react";

const roller = ["PERSONEL", "INSAN_KAYNAKLARI", "VEZNE", "MUHASEBE", "YONETICI", "SUPER_ADMIN"];

const rolEtiketleri: Record<string, string> = {
  SUPER_ADMIN: "Genel Müdür",
  YONETICI: "Müdür",
  VEZNE: "Vezne",
  MUHASEBE: "Muhasebe",
  INSAN_KAYNAKLARI: "İnsan Kaynakları",
  PERSONEL: "Genel",
};

const rolRenk: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-400 border-red-500/20",
  YONETICI: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  MUHASEBE: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  VEZNE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  INSAN_KAYNAKLARI: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  PERSONEL: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function AyarlarPage() {
  const [personelFilter, setPersonelFilter] = useState<"aktif" | "pasif">("aktif");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Data States
  const [personeller, setPersoneller] = useState<any[]>([]);
  const [sirketler, setSirketler] = useState<any[]>([]);
  const [sigortaSirketleri, setSigortaSirketleri] = useState<any[]>([]);
  const [birimler, setBirimler] = useState<any[]>([]);
  
  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [form, setForm] = useState({
    adSoyad: "",
    kullaniciAdi: "",
    sifre: "",
    rol: "PERSONEL",
    birimId: "",
    sirketId: "",
    sigortaSirketiId: "",
    tabanMaas: "",
    elektraId: "",
    pdksId: "",
    gorev: "",
    iseGirisTarihi: "",
    istenCikisTarihi: "",
    iban: "",
    aktif: true
  });

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [resP, resS, resSi, resB] = await Promise.all([
        fetch("/api/ayarlar/personel"),
        fetch("/api/ayarlar/sirketler"),
        fetch("/api/ayarlar/sigorta-sirketleri"),
        fetch("/api/ayarlar/birimler"),
      ]);
      
      if (resP.ok) setPersoneller(await resP.json());
      if (resS.ok) setSirketler(await resS.json());
      if (resSi.ok) setSigortaSirketleri(await resSi.json());
      if (resB.ok) setBirimler(await resB.json());
    } catch (err) {
      console.error("Veriler yuklenirken hata oluştu:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({
      adSoyad: "",
      kullaniciAdi: "",
      sifre: "",
      rol: "PERSONEL",
      birimId: birimler[0]?.id || "",
      sirketId: sirketler[0]?.id || "",
      sigortaSirketiId: sigortaSirketleri[0]?.id || "",
      tabanMaas: "",
      elektraId: "",
      pdksId: "",
      gorev: "",
      iseGirisTarihi: "",
      istenCikisTarihi: "",
      iban: "",
      aktif: true
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      adSoyad: p.adSoyad || "",
      kullaniciAdi: p.kullaniciAdi || "",
      sifre: "", // Leave blank unless changing
      rol: p.rol || "PERSONEL",
      birimId: p.birimId || "",
      sirketId: p.sirketId || "",
      sigortaSirketiId: p.sigortaSirketiId || "",
      tabanMaas: p.tabanMaas?.toString() || "",
      elektraId: p.elektraId || "",
      pdksId: p.pdksId || "",
      gorev: p.gorev || "",
      iseGirisTarihi: p.iseGirisTarihi ? p.iseGirisTarihi.split("T")[0] : "",
      istenCikisTarihi: p.istenCikisTarihi ? p.istenCikisTarihi.split("T")[0] : "",
      iban: p.iban || "",
      aktif: p.aktif
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    
    try {
      const url = "/api/ayarlar/personel";
      const method = editingId ? "PUT" : "POST";
      const payload = editingId ? { id: editingId, ...form } : form;
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setErrorMessage(result.error || "Bir hata oluştu.");
      } else {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setErrorMessage("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bu personeli kalıcı olarak silmek istediğinize emin misiniz?")) {
      try {
        const response = await fetch(`/api/ayarlar/personel?id=${id}`, {
          method: "DELETE"
        });
        if (response.ok) {
          fetchData();
        } else {
          alert("Silme işlemi başarısız.");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleAktif = async (p: any) => {
    try {
      const response = await fetch("/api/ayarlar/personel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: p.id,
          aktif: !p.aktif,
          kullaniciAdi: p.kullaniciAdi,
          adSoyad: p.adSoyad,
          rol: p.rol
        })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtering Logic
  const filteredPersonel = personeller.filter(p => {
    const isStatusMatch = personelFilter === "aktif" ? p.aktif === true : p.aktif === false;
    const searchLower = searchTerm.toLowerCase();
    const isSearchMatch = 
      p.adSoyad.toLowerCase().includes(searchLower) ||
      (p.birim?.ad || "").toLowerCase().includes(searchLower) ||
      p.kullaniciAdi.toLowerCase().includes(searchLower) ||
      (p.gorev || "").toLowerCase().includes(searchLower) ||
      p.rol.toLowerCase().includes(searchLower);
    return isStatusMatch && isSearchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Modal - Add/Edit Personnel */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {editingId ? `${form.adSoyad} - Düzenle` : "Yeni Personel Ekle"}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" /> {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Fields */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Adı Soyadı *</label>
                  <input required type="text" value={form.adSoyad} onChange={(e) => setForm({ ...form, adSoyad: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Kullanıcı Adı *</label>
                  <input required type="text" value={form.kullaniciAdi} onChange={(e) => setForm({ ...form, kullaniciAdi: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Şifre {editingId ? "(Değiştirmek istemiyorsanız boş bırakın)" : "*"}
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      required={!editingId} 
                      type="password" 
                      value={form.sifre} 
                      onChange={(e) => setForm({ ...form, sifre: e.target.value })} 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Rol / Yetki *</label>
                  <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                    {roller.map(r => <option key={r} value={r}>{rolEtiketleri[r] || r}</option>)}
                  </select>
                </div>

                {/* Dynamic Dropdowns */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1 font-semibold flex items-center gap-1.5 text-blue-400">
                    <Building className="w-3.5 h-3.5" /> Şirket *
                  </label>
                  <select value={form.sirketId} onChange={(e) => setForm({ ...form, sirketId: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                    <option value="">Seçiniz...</option>
                    {sirketler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1 font-semibold flex items-center gap-1.5 text-blue-400">
                    <Heart className="w-3.5 h-3.5" /> Sigorta Şirketi *
                  </label>
                  <select value={form.sigortaSirketiId} onChange={(e) => setForm({ ...form, sigortaSirketiId: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                    <option value="">Seçiniz...</option>
                    {sigortaSirketleri.map(si => <option key={si.id} value={si.id}>{si.ad}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1 font-semibold flex items-center gap-1.5 text-blue-400">
                    <FolderPlus className="w-3.5 h-3.5" /> Departman / Birim *
                  </label>
                  <select value={form.birimId} onChange={(e) => setForm({ ...form, birimId: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                    <option value="">Seçiniz...</option>
                    {birimler.map(b => <option key={b.id} value={b.id}>{b.ad}</option>)}
                  </select>
                </div>

                {/* Additional Info */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Görevi / Pozisyonu</label>
                  <input type="text" value={form.gorev} onChange={(e) => setForm({ ...form, gorev: e.target.value })} placeholder="Örn: Garson Şefi" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">ElektraWeb ID</label>
                  <input type="text" value={form.elektraId} onChange={(e) => setForm({ ...form, elektraId: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Perkotek PDKS ID</label>
                  <input type="text" value={form.pdksId} onChange={(e) => setForm({ ...form, pdksId: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Taban Maaş (₺)</label>
                  <input required type="number" min="0" value={form.tabanMaas} onChange={(e) => setForm({ ...form, tabanMaas: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Göreve Başlama Tarihi
                  </label>
                  <input type="date" value={form.iseGirisTarihi} onChange={(e) => setForm({ ...form, iseGirisTarihi: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-red-400" /> İşten Çıkış Tarihi
                  </label>
                  <input type="date" value={form.istenCikisTarihi} onChange={(e) => setForm({ ...form, istenCikisTarihi: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> IBAN
                  </label>
                  <input type="text" value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} placeholder="TR00 0000 0000 0000 0000 0000 00" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="modal-aktif" checked={form.aktif} onChange={(e) => setForm({ ...form, aktif: e.target.checked })} className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-blue-500" />
                <label htmlFor="modal-aktif" className="text-sm font-medium text-slate-300">Bu personel aktif çalışıyor (Sisteme giriş yapabilir)</label>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors">
                  Vazgeç / Kapat
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 rounded-lg transition-colors">
                  {loading ? "Kaydediliyor..." : (editingId ? "Değişiklikleri Kaydet" : "Personeli Ekle")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header and filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-400" /> Personel Yönetimi
          </h1>
          <p className="text-slate-400 mt-2">Personel listeleri, şirket/departman görevlendirmeleri ve taban maaşlar.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="İsim, birim, rol veya görev ara..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
            />
          </div>
          
          {/* Active / Passive selection & Add button */}
          <div className="flex items-center justify-between md:justify-end gap-4">
            <div className="flex border border-slate-700 rounded-lg p-0.5 bg-slate-900">
              <button 
                onClick={() => setPersonelFilter("aktif")} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${personelFilter === 'aktif' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Aktif Çalışanlar
              </button>
              <button 
                onClick={() => setPersonelFilter("pasif")} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${personelFilter === 'pasif' ? 'bg-red-600/80 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Pasif Personeller
              </button>
            </div>

            <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Yeni Personel Ekle
            </button>
          </div>
        </div>

        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-800/80 text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">Personel</th>
                  <th className="px-6 py-4 font-semibold">Şirket / Sigorta</th>
                  <th className="px-6 py-4 font-semibold">Birim / Görev</th>
                  <th className="px-6 py-4 font-semibold">Rol</th>
                  <th className="px-6 py-4 font-semibold">Elektra / PDKS ID</th>
                  <th className="px-6 py-4 font-semibold text-right">Taban Maaş</th>
                  <th className="px-6 py-4 font-semibold text-center">Durum</th>
                  <th className="px-6 py-4 font-semibold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredPersonel.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      Gösterilecek personel bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredPersonel.map(p => (
                    <tr key={p.id} className={`transition-colors hover:bg-slate-800/30 ${!p.aktif ? 'opacity-60 bg-red-950/5' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {p.adSoyad.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-white block">{p.adSoyad}</span>
                            <span className="text-xs text-slate-400 font-mono">@{p.kullaniciAdi}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="text-xs text-slate-300 flex items-center gap-1">
                            <Building className="w-3 h-3 text-blue-400" /> {p.sirket?.ad || "-"}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-400" /> {p.sigortaSirketi?.ad || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="text-sm text-slate-200 font-medium block">{p.birim?.ad || "-"}</span>
                          <span className="text-xs text-slate-400 block">{p.gorev || "-"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${rolRenk[p.rol] || 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                          <Shield className="w-3 h-3" /> {rolEtiketleri[p.rol] || p.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-mono space-y-0.5 text-slate-400">
                          <div>Elk: {p.elektraId || "-"}</div>
                          <div>Pdk: {p.pdksId || "-"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-white">₺{p.tabanMaas.toLocaleString('tr-TR')}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => toggleAktif(p)} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all border ${p.aktif ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}>
                          {p.aktif ? "Aktif" : "Pasif"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => toggleAktif(p)} 
                            title={p.aktif ? "Pasife Al" : "Aktife Al"}
                            className={`p-1.5 rounded-lg transition-colors ${p.aktif ? 'text-amber-400 hover:bg-amber-400/10' : 'text-emerald-400 hover:bg-emerald-400/10'}`}
                          >
                            {p.aktif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
