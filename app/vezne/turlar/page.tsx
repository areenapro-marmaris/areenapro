"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Clock, Search, Bus, Users, Calendar as CalendarIcon, X, Plus, Trash2, Edit2, ShieldAlert, Award } from "lucide-react";

interface TourRecord {
  id: string;
  tip: string;
  firma: string;
  rehberVeyaOtobus: string;
  kisiSayisi: number;
  kisiBasiTutar: number;
  tutar: number;
  mudurOnaylandi: boolean;
  odendiMi: boolean;
  tarih: string;
  createdAt: string;
}

interface UserInfo {
  id: string;
  adSoyad: string;
  kullaniciAdi: string;
  rol: string;
}

export default function TurOtobusPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [tours, setTours] = useState<TourRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const getBusinessDate = () => {
    const now = new Date();
    // Gece vardiyası mesaisi sabah 09:00'a kadar bir önceki güne yazılır
    if (now.getHours() < 9) {
      now.setDate(now.getDate() - 1);
    }
    return now.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getBusinessDate());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formRecord, setFormRecord] = useState({
    tip: "TUR",
    firma: "",
    rehberVeyaOtobus: "",
    kisiSayisi: "",
    kisiBasiTutar: "",
  });

  // Kullanıcı bilgisini çek
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.kullanici) {
          setUser(data.kullanici);
        }
      })
      .catch(() => {});
  }, []);

  const isMudurOrAdmin = user?.rol === "SUPER_ADMIN" || user?.rol === "YONETICI";

  // Turları veritabanından çek
  const fetchTours = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vezne/turlar?tarih=${selectedDate}`);
      const data = await res.json();
      if (data.turlar) {
        setTours(data.turlar);
      }
    } catch (error) {
      console.error("Turlar yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  // Müdür Onayını Ver
  const handleApproveMudur = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/vezne/turlar/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mudurOnaylandi: true }),
      });
      if (res.ok) {
        fetchTours();
      }
    } catch (error) {
      console.error("Müdür onayı verilirken hata:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Ödemeyi Yap ve Kasaya İşle
  const handleApprovePayment = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/vezne/turlar/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ odendiMi: true }),
      });
      if (res.ok) {
        fetchTours();
      }
    } catch (error) {
      console.error("Ödeme onaylanırken hata:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const openNewRecordModal = () => {
    setEditingId(null);
    setFormRecord({ tip: "TUR", firma: "", rehberVeyaOtobus: "", kisiSayisi: "", kisiBasiTutar: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (tour: TourRecord) => {
    setEditingId(tour.id);
    setFormRecord({
      tip: tour.tip,
      firma: tour.firma,
      rehberVeyaOtobus: tour.rehberVeyaOtobus,
      kisiSayisi: tour.kisiSayisi.toString(),
      kisiBasiTutar: tour.kisiBasiTutar.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm("Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      try {
        const res = await fetch(`/api/vezne/turlar/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          fetchTours();
        }
      } catch (error) {
        console.error("Kayıt silinirken hata:", error);
      }
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const kisi = parseInt(formRecord.kisiSayisi) || 0;
    const tutarBasi = parseFloat(formRecord.kisiBasiTutar) || 0;
    
    try {
      if (editingId) {
        // Düzenleme
        const res = await fetch(`/api/vezne/turlar/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tip: formRecord.tip,
            firma: formRecord.firma,
            rehberVeyaOtobus: formRecord.rehberVeyaOtobus,
            kisiSayisi: kisi,
            kisiBasiTutar: tutarBasi,
          }),
        });
        if (res.ok) fetchTours();
      } else {
        // Yeni Kayıt
        const res = await fetch("/api/vezne/turlar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tip: formRecord.tip,
            firma: formRecord.firma,
            rehberVeyaOtobus: formRecord.rehberVeyaOtobus,
            kisiSayisi: kisi,
            kisiBasiTutar: tutarBasi,
            tarih: selectedDate,
          }),
        });
        if (res.ok) fetchTours();
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Kayıt kaydedilirken hata:", error);
    }
  };

  const filteredTours = tours.filter(t => 
    t.firma.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.rehberVeyaOtobus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBekleyen = filteredTours.filter(t => !t.odendiMi).reduce((acc, curr) => acc + curr.tutar, 0);
  const totalOdenen = filteredTours.filter(t => t.odendiMi).reduce((acc, curr) => acc + curr.tutar, 0);

  const displayDate = new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Modal - Ekleme / Düzenleme Ekranı */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-xl font-bold text-white">
                {editingId ? "Kaydı Düzenle" : "Yeni Kayıt Ekle"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveRecord} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Kayıt Tipi</label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="tip" className="peer sr-only" checked={formRecord.tip === "TUR"} onChange={() => setFormRecord({...formRecord, tip: "TUR"})} />
                    <div className="p-3 border border-slate-700 rounded-lg text-center peer-checked:bg-purple-500/20 peer-checked:border-purple-500 peer-checked:text-purple-400 text-slate-400 transition-all">
                      TUR
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="tip" className="peer sr-only" checked={formRecord.tip === "OTOBUS"} onChange={() => setFormRecord({...formRecord, tip: "OTOBUS"})} />
                    <div className="p-3 border border-slate-700 rounded-lg text-center peer-checked:bg-amber-500/20 peer-checked:border-amber-500 peer-checked:text-amber-400 text-slate-400 transition-all">
                      OTOBÜS
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Acente / Firma Adı</label>
                <input required type="text" value={formRecord.firma} onChange={(e) => setFormRecord({...formRecord, firma: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="Örn: SkyTour" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{formRecord.tip === "TUR" ? "Rehber Adı Soyadı" : "Otobüs Şirketi Adı"}</label>
                <input required type="text" value={formRecord.rehberVeyaOtobus} onChange={(e) => setFormRecord({...formRecord, rehberVeyaOtobus: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder={formRecord.tip === "TUR" ? "Örn: Ahmet Yılmaz" : "Örn: Pamukkale Turizm"} />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Kişi Sayısı</label>
                  <input required type="number" min="1" value={formRecord.kisiSayisi} onChange={(e) => setFormRecord({...formRecord, kisiSayisi: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="Örn: 45" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Kişi Başı (₺)</label>
                  <input required type="number" min="0" step="0.01" value={formRecord.kisiBasiTutar} onChange={(e) => setFormRecord({...formRecord, kisiBasiTutar: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="Örn: 100" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
                <span className="text-slate-400">Toplam Ödenecek:</span>
                <span className="text-xl font-bold text-white">
                  ₺{((parseInt(formRecord.kisiSayisi) || 0) * (parseFloat(formRecord.kisiBasiTutar) || 0)).toLocaleString('tr-TR')}
                </span>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors mt-4">
                {editingId ? "Değişiklikleri Kaydet" : "Kaydet ve Listeye Ekle"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bus className="w-8 h-8 text-blue-400" />
            Tur ve Otobüs İşlemleri
          </h1>
          <p className="text-slate-400 mt-2 flex items-center gap-2">
            Operasyon Gecesi: <strong className="text-white">{displayDate}</strong> (21:00 - 08:00 mesaisi)
            {user && (
              <span className="bg-blue-500/20 text-blue-400 text-xs px-2.5 py-0.5 rounded border border-blue-500/30 font-medium">
                {user.adSoyad} ({user.rol === "SUPER_ADMIN" ? "Süper Admin" : user.rol === "YONETICI" ? "Yönetici" : "Veznedar"})
              </span>
            )}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative bg-slate-800 border-2 border-blue-500/50 rounded-xl p-2 shadow-lg shadow-blue-500/10 hover:border-blue-400 transition-colors cursor-pointer group">
            <label htmlFor="datePicker" className="absolute -top-3 left-3 bg-slate-900 px-2 text-xs font-bold tracking-wide text-blue-400 uppercase rounded-sm">
              Tarih Filtresi
            </label>
            <div className="flex items-center gap-3 px-3 py-1">
              <CalendarIcon className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
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

          <div className="flex gap-4">
            <div className="glass-panel px-4 py-2 flex flex-col items-end border-b-2 border-b-emerald-500">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Ödenen</span>
              <span className="text-xl font-bold text-emerald-400">₺{totalOdenen.toLocaleString('tr-TR')}</span>
            </div>
            <div className="glass-panel px-4 py-2 flex flex-col items-end border-b-2 border-b-rose-500">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Bekleyen</span>
              <span className="text-xl font-bold text-rose-400">₺{totalBekleyen.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Firma veya rehber ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <button 
            onClick={openNewRecordModal}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto shadow-lg shadow-blue-900/20"
          >
            <Plus className="w-4 h-4" /> Yeni Kayıt Ekle
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800/80 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Tip</th>
                <th className="px-6 py-4 font-semibold">Acente / Firma</th>
                <th className="px-6 py-4 font-semibold">Rehber / Otobüs Adı</th>
                <th className="px-6 py-4 font-semibold text-center">Kişi Sayısı</th>
                <th className="px-6 py-4 font-semibold text-center">Kişi Başı</th>
                <th className="px-6 py-4 font-semibold text-right">Toplam Tutar</th>
                <th className="px-6 py-4 font-semibold text-center">Müdür Onayı</th>
                <th className="px-6 py-4 font-semibold text-center">Ödeme Durumu</th>
                <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-8 mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-12 mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-20 ml-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-16 mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-16 mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-700 rounded w-28 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                filteredTours.map((tour) => {
                  let rowBgClass = "hover:bg-slate-800/30";
                  if (tour.odendiMi) {
                    rowBgClass = "bg-emerald-950/20 hover:bg-emerald-900/10 border-l-4 border-l-emerald-500";
                  } else if (tour.mudurOnaylandi) {
                    rowBgClass = "bg-blue-950/20 hover:bg-blue-900/10 border-l-4 border-l-blue-500";
                  } else {
                    rowBgClass = "bg-amber-950/10 hover:bg-slate-800/30 border-l-4 border-l-amber-600/50";
                  }

                  return (
                    <tr 
                      key={tour.id} 
                      className={`transition-all duration-200 ${rowBgClass}`}
                    >
                      <td className="px-6 py-4">
                        {tour.tip === "TUR" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
                            <Users className="w-3.5 h-3.5" /> TUR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                            <Bus className="w-3.5 h-3.5" /> OTOBÜS
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{tour.firma}</td>
                      <td className="px-6 py-4 text-slate-300">{tour.rehberVeyaOtobus}</td>
                      <td className="px-6 py-4 text-center font-bold text-white">{tour.kisiSayisi}</td>
                      <td className="px-6 py-4 text-center text-slate-300">₺{tour.kisiBasiTutar}</td>
                      <td className="px-6 py-4 text-right font-bold text-white">₺{tour.tutar.toLocaleString('tr-TR')}</td>
                      
                      {/* Müdür Onay Sütunu */}
                      <td className="px-6 py-4 text-center">
                        {tour.mudurOnaylandi ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                            <Award className="w-3 h-3" /> Onaylı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 text-xs font-medium border border-slate-700">
                            Bekliyor
                          </span>
                        )}
                      </td>

                      {/* Ödeme Durumu Sütunu */}
                      <td className="px-6 py-4 text-center">
                        {tour.odendiMi ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5" /> Ödendi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20">
                            <Clock className="w-3.5 h-3.5" /> Bekliyor
                          </span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Müdür Onay Butonu (Sadece Müdür / Admin görür ve henüz onaylanmamışsa) */}
                          {!tour.mudurOnaylandi && isMudurOrAdmin && (
                            <button
                              onClick={() => handleApproveMudur(tour.id)}
                              disabled={actionLoading === tour.id}
                              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-md shadow-blue-950/20"
                            >
                              {actionLoading === tour.id ? "Onaylanıyor..." : "Müdür Onayı Ver"}
                            </button>
                          )}

                          {/* Ödeme Yap Butonu (Müdür onayından sonra aktifleşir) */}
                          {!tour.odendiMi && (
                            <button 
                              onClick={() => handleApprovePayment(tour.id)}
                              disabled={!tour.mudurOnaylandi || actionLoading === tour.id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
                                tour.mudurOnaylandi 
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-950/25' 
                                  : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                              }`}
                              title={tour.mudurOnaylandi ? "Ödemeyi tamamla ve kasaya gider olarak yaz" : "Ödeme yapabilmek için müdür onayı gerekiyor"}
                            >
                              {actionLoading === tour.id ? "Ödeniyor..." : tour.mudurOnaylandi ? "Ödeme Yap" : "Müdür Onayı Bekliyor"}
                            </button>
                          )}

                          {tour.odendiMi && (
                            <span className="text-slate-500 text-xs font-medium px-3 py-1.5 bg-slate-800/40 rounded-lg">
                              İşlem Tamam ✓
                            </span>
                          )}

                          {/* Düzenleme & Silme Yetkileri */}
                          {isMudurOrAdmin && (
                            <>
                              <div className="w-px h-6 bg-slate-700 mx-1"></div>
                              <button 
                                onClick={() => openEditModal(tour)}
                                disabled={tour.odendiMi}
                                title={tour.odendiMi ? "Ödenmiş kayıt düzenlenemez" : "Düzenle"}
                                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteRecord(tour.id)}
                                title="Sil"
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              
              {!loading && filteredTours.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <p className="text-slate-400 text-base mb-2">{displayDate} gecesi için kayıt girilmemiş veya arama sonucu boş.</p>
                    <button onClick={openNewRecordModal} className="text-blue-400 hover:text-blue-300 font-medium mt-2">İlk kaydı eklemek için tıklayın</button>
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
