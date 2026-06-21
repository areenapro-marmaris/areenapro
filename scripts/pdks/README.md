# PDKS / Perkotek Yerel Senkronizasyon Kurulum Kılavuzu

Bu klasördeki dosyalar, kulüpteki PDKS (parmak izi okuyucu) programının kurulu olduğu Windows bilgisayara kurulacaktır. Bu sayede parmak izi logları online sisteme otomatik aktarılır.

---

## Adım 1: PDKS Bilgisayarında Klasör Oluşturma
PDKS programının kurulu olduğu Windows bilgisayarda C sürücüsünün altında **`C:\areenapro-pdks`** adında yeni bir klasör oluşturun.

## Adım 2: Gerekli Programların Kurulumu
1. PDKS bilgisayarına Node.js kurulmalıdır. Eğer kurulu değilse [https://nodejs.org/](https://nodejs.org/) adresinden **LTS** sürümünü indirip "İleri > İleri" diyerek kurun.
2. Komut Satırını (CMD) açın ve şu komutları çalıştırarak klasöre geçiş yapıp gerekli kütüphaneleri yükleyin:
   ```cmd
   cd C:\areenapro-pdks
   npm init -y
   npm install axios dotenv mysql2
   ```

## Adım 3: Script Dosyasını Kopyalama
1. Bu klasördeki **`sync-mysql.js`** dosyasını PDKS bilgisayarındaki **`C:\areenapro-pdks\sync.js`** adıyla kopyalayın.
2. Dosyayı açıp MySQL kullanıcı adı, şifre ve veritabanı ayarlarını kendi yerel veritabanı şifrenize göre güncelleyin (Genelde kullanıcı adı `root` ve şifre boştur).

---

## Adım 4: .env Dosyasını Oluşturma
`C:\areenapro-pdks` klasörü içinde **`.env`** adında bir dosya oluşturun (Not Defteri ile) ve içine şunları yazın:

```env
# Canlı tünel veya kendi domain adresiniz:
ONLINE_API_URL="https://[sizin-domain-adresiniz].trycloudflare.com/api/pdks/kayit"

# Güvenlik için aradaki gizli anahtar
PDKS_API_KEY="areena_pdks_secret_key_2026"
```

---

## Adım 5: Elle Test Etme
Kurulumlar tamamlandıktan sonra CMD ekranında şu komutu çalıştırarak test edin:
```cmd
node sync.js
```
Ekranda *"✅ Personel ID X için Giriş/Çıkış kaydedildi"* mesajlarını görüyorsanız sistem çalışıyor demektir.

---

## Adım 6: Sürekli Arka Planda Çalıştırma (Windows Görev Zamanlayıcı)
Her 5 dakikada bir verilerin çekilmesi için Windows Görev Zamanlayıcısı'na (Task Scheduler) şu görevi ekleyin:
1. **Tetikleyici (Trigger):** Her gün, 5 dakikada bir süresiz tekrarla.
2. **Eylem (Action):** Program Başlat.
3. **Program/Komut:** `node`
4. **Argüman ekle:** `C:\areenapro-pdks\sync.js`
