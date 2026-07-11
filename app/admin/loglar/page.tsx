"use client";

import { useState, useEffect } from "react";
import { Activity, Clock, ShieldAlert, ShieldCheck, RefreshCw, Search, ArrowLeft, Filter, Smartphone, Monitor } from "lucide-react";
import Link from "next/link";

interface AuditLog {
  id: string;
  personelId: string;
  adSoyad: string;
  kullaniciAdi: string;
  rol: string;
  ipAdresi: string | null;
  tarayici: string | null;
  tarih: string;
}

const ROLLER = [
  { value: 'SUPER_ADMIN', label: 'Genel Müdür', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'YONETICI', label: 'Müdür', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { value: 'VEZNE', label: 'Vezne', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'MUHASEBE', label: 'Muhasebe', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { value: 'INSAN_KAYNAKLARI', label: 'İnsan Kaynakları', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  { value: 'PERSONEL', label: 'Genel', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  { value: 'SEF', label: 'Şef', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
];

function parseUserAgent(ua: string | null) {
  if (!ua) return { browser: "Bilinmiyor", os: "Bilinmeyen Cihaz", isMobile: false };
  const lower = ua.toLowerCase();
  let browser = "Diğer Tarayıcı";
  let os = "Cihaz";
  let isMobile = false;

  // Browser detection
  if (lower.includes("opr/") || lower.includes("opera")) {
    browser = "Opera";
  } else if (lower.includes("edg/")) {
    browser = "Microsoft Edge";
  } else if (lower.includes("firefox")) {
    browser = "Firefox";
  } else if (lower.includes("chrome") || lower.includes("chromium")) {
    browser = "Chrome";
  } else if (lower.includes("safari")) {
    browser = "Safari";
  }

  // OS detection
  if (lower.includes("android")) {
    os = "Android";
    isMobile = true;
  } else if (lower.includes("iphone") || lower.includes("ipad")) {
    os = "iOS";
    isMobile = true;
  } else if (lower.includes("windows")) {
    os = "Windows";
  } else if (lower.includes("macintosh") || lower.includes("mac os")) {
    os = "macOS";
  } else if (lower.includes("linux")) {
    os = "Linux";
  }

  return { browser, os, isMobile };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("HEPSI");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/audit-logs");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Loglar yüklenirken bir hata oluştu.");
        return;
      }
      setLogs(data.logs || []);
    } catch (err) {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getRolBilgi = (rol: string) => {
    return ROLLER.find(r => r.value === rol) || { label: rol, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
  };

  // Filtreleme mantığı
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.adSoyad.toLowerCase().includes(search.toLowerCase()) || 
      log.kullaniciAdi.toLowerCase().includes(search.toLowerCase()) ||
      (log.ipAdresi && log.ipAdresi.includes(search));
    
    const matchesRole = selectedRole === "HEPSI" || log.rol === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Üst Kısım / Geri Tuşu */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-white flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Panel Ana Sayfası
            </Link>
            <span>/</span>
            <span className="text-slate-400">Giriş Logları</span>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Clock className="w-8 h-8 text-indigo-400" /> Sistem Giriş Logları
          </h1>
          <p className="text-slate-400 mt-1">Sisteme başarıyla giriş yapan kullanıcıların anlık ve geçmiş kayıtları.</p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors border border-slate-700 disabled:opacity-50 self-start md:self-center"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Arama ve Filtreleme Barları */}
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Personel adı, kullanıcı adı veya IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-slate-900 border border-slate-700/50 rounded-lg text-sm text-slate-300 px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="HEPSI">Tüm Yetkiler</option>
            {ROLLER.map(rol => (
              <option key={rol.value} value={rol.value}>{rol.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ana Log Tablosu */}
      {error ? (
        <div className="glass-panel p-8 text-center border-red-500/20 bg-red-500/5 max-w-xl mx-auto rounded-xl">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="font-semibold text-white text-lg">Yetkisiz Erişim</h3>
          <p className="text-slate-400 mt-2 text-sm">{error}</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Giriş Zamanı</th>
                  <th className="px-5 py-3.5 font-medium">Personel</th>
                  <th className="px-5 py-3.5 font-medium">Kullanıcı Adı</th>
                  <th className="px-5 py-3.5 font-medium">Rol / Yetki</th>
                  <th className="px-5 py-3.5 font-medium">IP Adresi</th>
                  <th className="px-5 py-3.5 font-medium">Cihaz \ Tarayıcı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4"><div className="h-4 bg-slate-700 rounded w-28" /></td>
                      <td className="px-5 py-4"><div className="h-4 bg-slate-700 rounded w-36" /></td>
                      <td className="px-5 py-4"><div className="h-4 bg-slate-700 rounded w-24" /></td>
                      <td className="px-5 py-4"><div className="h-5 bg-slate-700 rounded w-24" /></td>
                      <td className="px-5 py-4"><div className="h-4 bg-slate-700 rounded w-28" /></td>
                      <td className="px-5 py-4"><div className="h-4 bg-slate-700 rounded w-32" /></td>
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      Arama kriterlerinize uygun sistem giriş kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const rolBilgi = getRolBilgi(log.rol);
                    const parsedUA = parseUserAgent(log.tarayici);
                    return (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-indigo-300">
                          {new Date(log.tarih).toLocaleString('tr-TR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="px-5 py-4 font-semibold text-white">
                          {log.adSoyad}
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          {log.kullaniciAdi}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${rolBilgi.color}`}>
                            {rolBilgi.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-300">
                          {log.ipAdresi || 'Lokal'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-xs text-slate-300" title={parsedUA.isMobile ? "Mobil" : "Masaüstü"}>
                            {parsedUA.isMobile ? (
                              <Smartphone className="w-4 h-4 text-pink-400" />
                            ) : (
                              <Monitor className="w-4 h-4 text-sky-400" />
                            )}
                            <span>{parsedUA.os} ({parsedUA.browser})</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
