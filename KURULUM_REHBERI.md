# AREENAPRO - SUNUCU KURULUM REHBERİ

Bu belge, Areenapro sisteminin işletme içindeki sürekli açık kalacak ana bilgisayara (sunucu) nasıl kurulacağını açıklar.

## 1. Gerekli Programların Kurulumu

Hedef bilgisayarda şu iki program kurulu olmalıdır:
1. **Node.js**: [https://nodejs.org/](https://nodejs.org/) adresinden "LTS" (Uzun Süreli Destek) versiyonunu indirip kurun (İleri > İleri diyerek standart kurulum).
2. **PostgreSQL**: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/) adresinden indirip kurun. Kurulum sırasında size soracağı **"postgres" kullanıcısı şifresini bir yere not edin, unutmayın!**

## 2. Dosyaları Hazırlama

Bu klasörü hedef bilgisayarda uygun bir yere (örneğin `C:\Areenapro`) kopyalayın.

## 3. Kurulum Adımları

Klasörü kopyaladıktan sonra, o klasörün içinde bir komut satırı (CMD veya Terminal) açın ve sırasıyla şu işlemleri yapın:

### Adım 3.1: Kütüphanelerin Kurulumu
Komut satırına şunu yazıp Enter'a basın. Bu işlem biraz sürebilir, gerekli dosyaları indirecektir:
```bash
npm install
```

### Adım 3.2: ElektraWeb Bot Kurulumu
Arka planda çalışacak bot için gerekli tarayıcıyı indirmek üzere şu komutu çalıştırın:
```bash
npx playwright install chromium
```

### Adım 3.3: Veritabanı ve Çevre Değişkenleri (.env) Ayarı
Klasörün içindeki `.env` dosyasını Not Defteri ile açın. `DATABASE_URL` kısmındaki şifre alanını, PostgreSQL kurarken belirlediğiniz şifre ile değiştirin.
Aynı dosyanın alt kısmında bulunan `ELEKTRAWEB` bilgilerini de doldurup kaydedin.

### Adım 3.4: Veritabanını Oluşturma
Şu komutu çalıştırarak veritabanı tablolarının oluşturulmasını sağlayın:
```bash
npx prisma db push
```

### Adım 3.5: Uygulamayı Derleme
Uygulamayı çalışmaya hazır hale getirmek için:
```bash
npm run build
```

## 4. Uygulamayı Sürekli Çalışır Hale Getirme (PM2)

Uygulamanın bilgisayar kapansa da arka planda kendi kendine başlaması için PM2 kullanacağız. Sırasıyla şu komutları çalıştırın:

```bash
# PM2'yi global olarak kurar
npm install -g pm2

# Uygulamayı başlatır
pm2 start npm --name "areenapro" -- run start

# Bilgisayar her açıldığında PM2'nin otomatik başlamasını sağlar
pm2 startup
pm2 save
```

**Tebrikler!** Sistem artık çalışıyor.

## 5. Diğer Cihazlardan (Telefon/Tablet) Bağlanma

Diğer cihazlardan sisteme girebilmek için:
1. Bu sunucu bilgisayarın Yerel IP adresini öğrenin (Arama kısmına `cmd` yazıp açın, `ipconfig` yazın. `IPv4 Address` karşısındaki rakamdır. Örn: `192.168.1.50`)
2. Cep telefonu veya tabletin internet tarayıcısına bu IP adresini ve sonuna `:3000` yazarak girin.
   * **Örnek:** `http://192.168.1.50:3000`
