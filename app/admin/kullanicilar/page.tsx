"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Plus, Trash2, Edit2, Check, X, Eye, EyeOff, Users } from "lucide-react";

interface Kullanici {
  id: string;
  adSoyad: string;
  kullaniciAdi: string;
  rol: string;
  aktif: boolean;
  createdAt: string;
}

const ROLLER = [
  { value: 'SUPER_ADMIN', label: 'Genel Müdür', color: 'text-amber-400 bg-amber-500/10' },
  { value: 'YONETICI', label: 'Müdür', color: 'text-blue-400 bg-blue-500/10' },
  { value: 'VEZNE', label: 'Vezne', color: 'text-emerald-400 bg-emerald-500/10' },
  { value: 'MUHASEBE', label: 'Muhasebe', color: 'text-purple-400 bg-purple-500/10' },
  { value: 'INSAN_KAYNAKLARI', label: 'İnsan Kaynakları', color: 'text-pink-400 bg-pink-500/10' },
  { value: 'PERSONEL', label: 'Genel', color: 'text-slate-400 bg-slate-500/10' },
];

export default function KullaniciYonetimiPage() {
  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ adSoyad: '', kullaniciAdi: '', sifre: '', rol: 'PERSONEL' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchKullanicilar = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/kullanicilar');
    const data = await res.json();
    if (data.kullanicilar) setKullanicilar(data.kullanicilar);
    setLoading(false);
  };

  useEffect(() => { fetchKullanicilar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const url = editId ? `/api/admin/kullanicilar/${editId}` : '/api/admin/kullanicilar';
    const method = editId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Hata oluştu'); return; }

    setSuccess(editId ? 'Kullanıcı güncellendi.' : 'Kullanıcı oluşturuldu.');
    setForm({ adSoyad: '', kullaniciAdi: '', sifre: '', rol: 'PERSONEL' });
    setShowForm(false);
    setEditId(null);
    fetchKullanicilar();
  };

  const handleDelete = async (id: string, ad: string) => {
    if (!confirm(`"${ad}" kullanıcısını silmek istediğinize emin misiniz?`)) return;
    await fetch(`/api/admin/kullanicilar/${id}`, { method: 'DELETE' });
    fetchKullanicilar();
  };

  const handleToggleAktif = async (id: string, aktif: boolean) => {
    await fetch(`/api/admin/kullanicilar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aktif: !aktif }),
    });
    fetchKullanicilar();
  };

  const startEdit = (k: Kullanici) => {
    setEditId(k.id);
    setForm({ adSoyad: k.adSoyad, kullaniciAdi: k.kullaniciAdi, sifre: '', rol: k.rol });
    setShowForm(true);
    setError('');
  };

  const rolBilgi = (rol: string) => ROLLER.find(r => r.value === rol);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-amber-400" /> Kullanıcı Yönetimi
          </h1>
          <p className="text-slate-400 mt-2">Sisteme erişimi olan kullanıcıları buradan yönetin.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ adSoyad: '', kullaniciAdi: '', sifre: '', rol: 'PERSONEL' }); setError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" /> Yeni Kullanıcı
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-panel p-6 border border-amber-500/20">
          <h3 className="text-lg font-semibold text-white mb-5">
            {editId ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Oluştur'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Ad Soyad</label>
              <input
                type="text" required value={form.adSoyad}
                onChange={e => setForm({ ...form, adSoyad: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Ahmet Yılmaz"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Kullanıcı Adı</label>
              <input
                type="text" required value={form.kullaniciAdi}
                onChange={e => setForm({ ...form, kullaniciAdi: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="ahmet.yilmaz"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Şifre {editId && <span className="text-slate-500">(boş bırakılırsa değişmez)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.sifre}
                  required={!editId}
                  onChange={e => setForm({ ...form, sifre: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Rol</label>
              <select
                value={form.rol}
                onChange={e => setForm({ ...form, rol: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                {ROLLER.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            {error && <div className="md:col-span-2 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">{error}</div>}
            {success && <div className="md:col-span-2 text-emerald-400 text-sm bg-emerald-500/10 px-4 py-2 rounded-lg">{success}</div>}
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl flex items-center gap-2 transition-colors">
                <Check className="w-4 h-4" /> {editId ? 'Güncelle' : 'Oluştur'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex items-center gap-2 transition-colors">
                <X className="w-4 h-4" /> İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kullanıcı Listesi */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-white">Tüm Kullanıcılar ({kullanicilar.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80 text-slate-400">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Ad Soyad</th>
                <th className="px-6 py-3 text-left font-medium">Kullanıcı Adı</th>
                <th className="px-6 py-3 text-left font-medium">Rol</th>
                <th className="px-6 py-3 text-center font-medium">Durum</th>
                <th className="px-6 py-3 text-center font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-16 mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-24 mx-auto" /></td>
                  </tr>
                ))
              ) : kullanicilar.map((k) => {
                const rol = rolBilgi(k.rol);
                return (
                  <tr key={k.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                          {k.adSoyad.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{k.adSoyad}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{k.kullaniciAdi}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rol?.color || 'text-slate-400 bg-slate-500/10'}`}>
                        {rol?.label || k.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleToggleAktif(k.id, k.aktif)} className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${k.aktif ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
                        {k.aktif ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => startEdit(k)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(k.id, k.adSoyad)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
