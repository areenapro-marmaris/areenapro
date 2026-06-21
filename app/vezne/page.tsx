import { ArrowRightLeft, Bus, CreditCard, Receipt, FileText } from 'lucide-react';
import Link from 'next/link';

export default function VezneDashboard() {
  const menus = [
    { name: "Tur ve Otobüs İşlemleri", desc: "Tur ödemeleri ve onayları", icon: Bus, href: "/vezne/turlar", color: "text-blue-400", bg: "bg-blue-500/10" },
    { name: "Ödemeler & Giderler", desc: "Günlük ödeme girişleri", icon: Receipt, href: "/vezne/odemeler", color: "text-rose-400", bg: "bg-rose-500/10" },
    { name: "Cari Hesaplar", desc: "Müşteri cari girişleri", icon: FileText, href: "/vezne/cari", color: "text-amber-400", bg: "bg-amber-500/10" },
    { name: "Sabit Giderler", desc: "Düzenli gider tanımları", icon: CreditCard, href: "/vezne/sabit-giderler", color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { name: "Kasa Hareketleri", desc: "Tüm giriş ve çıkışlar", icon: ArrowRightLeft, href: "/vezne/kasa-hareketleri", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Vezne Yönetimi</h1>
        <p className="text-slate-400 mt-2">Gece ve gündüz işlemlerini tek ekranda yönetin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus.map((menu, i) => (
          <Link key={i} href={menu.href}>
            <div className="glass-panel p-6 flex flex-col justify-between group hover:bg-slate-800/80 transition-all duration-300 h-full cursor-pointer border-transparent hover:border-slate-600">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${menu.bg} ${menu.color}`}>
                  <menu.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">{menu.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">{menu.desc}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
