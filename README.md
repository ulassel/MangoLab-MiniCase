# Task Management API & Frontend

Basit, modern ve fonksiyonel bir Görev Yönetimi (Task Management) uygulaması. Proje, bir REST API backend'i ve modern bir frontend arayüzünden oluşmaktadır.

## ✨ Özellikler

### Frontend (Modern UI)

- **Karanlık/Aydınlık Mod:** Sistem tercihine duyarlı veya manuel değiştirilebilir tema.
- **Gerçek Zamanlı Arama:** Görev başlıkları arasında anlık arama.
- **Durum Filtreleme:** Görevleri "Tümü", "Aktif" ve "Tamamlanmış" olarak filtreleme.
- **Responsive Tasarım:** Mobil ve masaüstü cihazlarla tam uyumlu.
- **Modern Animasyonlar:** Akıcı geçişler ve etkileşimli öğeler.

### Backend (REST API)

- **Tam CRUD Desteği:** Görev oluşturma, listeleme, güncelleme ve silme.
- **Sayfalama (Pagination):** `GET /tasks` endpoint'i `page` ve `pageSize` parametreleriyle sayfalı sonuç döner.
- **API Versiyonlama:** `/api/v1/tasks` ile versiyonlu erişim (eski `/tasks` yolu da desteklenir).
- **Veri Doğrulama:** Zod ile güçlü şema doğrulaması ve özel validation middleware'leri.
- **Hata Yönetimi:** Domain error sınıfları ile merkezi ve güvenli hata yakalama mekanizması.
- **Güvenlik:** Helmet (güvenlik başlıkları), CORS ve rate limiting koruması.
- **Yapılandırılmış Loglama:** Pino ile structured logging.
- **Sağlık Kontrolü:** `/health` endpoint'i ile uygulama durumu izleme.
- **Graceful Shutdown:** 10 saniye zaman aşımlı güvenli kapatma mekanizması.
- **Veritabanı Kalıcılığı:** SQLite ve Prisma ORM ile güvenilir veri saklama.

## 🛠 Teknolojiler

| Katman               | Teknoloji     | Seçim              |
| -------------------- | ------------- | ------------------- |
| **Runtime**    | Node.js       | TypeScript          |
| **Framework**  | Express.js    | API Yönetimi       |
| **Database**   | SQLite        | Prisma ORM          |
| **Validation** | Zod           | Şema Doğrulama    |
| **Güvenlik**  | Helmet, CORS  | Rate Limiting       |
| **Loglama**    | Pino          | Structured Logging  |
| **Frontend**   | HTML5/CSS3/JS | Vanilla JS (Modern) |
| **Test**       | Jest          | Supertest           |
| **Container**  | Docker        | Tini + Healthcheck  |

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler

- Node.js 20+
- npm

### Yerel Kurulum

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Ortam değişkenlerini ayarla
cp .env.example .env

# 3. Veritabanını hazırla (SQLite dosyası oluşturur ve tabloları kurar)
npx prisma migrate deploy

# 4. Geliştirme modunda çalıştır
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

### Docker ile Çalıştırma

```bash
# Image oluştur
docker build -t task-management-api .

# Container çalıştır
docker run -p 3000:3000 task-management-api
```

## 📡 API Endpoints

Tüm endpoint'ler hem `/tasks` hem de `/api/v1/tasks` üzerinden erişilebilir.

| Method           | Path           | Açıklama                                             |
| ---------------- | -------------- | ------------------------------------------------------ |
| **GET**    | `/tasks`     | Görevleri sayfalı olarak listele (En yeniden eskiye) |
| **GET**    | `/tasks/:id` | Tek bir görevi getir                                  |
| **POST**   | `/tasks`     | Yeni bir görev oluştur                               |
| **PATCH**  | `/tasks/:id` | Bir görevi güncelle (Başlık veya Durum)            |
| **DELETE** | `/tasks/:id` | Bir görevi sil                                        |
| **GET**    | `/health`    | Uygulama sağlık kontrolü                            |

### Örnekler

#### 1. Görevleri Listeleme (GET `/tasks`)

**Query Parametreleri:** `?page=1&pageSize=20` (opsiyonel)
**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Görev Başlığı",
      "completed": false,
      "createdAt": "2026-02-11T...",
      "updatedAt": "2026-02-11T..."
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "pageSize": 20,
    "totalPages": 2
  }
}
```

#### 2. Yeni Görev Oluşturma (POST `/tasks`)

**Body:** `{"title": "Yeni Görev"}`
**Response (201):**

```json
{
  "id": 1,
  "title": "Yeni Görev",
  "completed": false,
  "createdAt": "2026-02-11T...",
  "updatedAt": "2026-02-11T..."
}
```

#### 3. Görev Güncelleme (PATCH `/tasks/:id`)

**Body:** `{"completed": true}` veya `{"title": "Güncellenmiş Başlık"}`
**Response (200):** Güncellenmiş görev nesnesi.

#### 4. Görev Silme (DELETE `/tasks/:id`)

**Response (204):** İçerik döndürmez.

## 🧪 Test

Proje kapsamındaki entegrasyon testlerini çalıştırmak için:

```bash
npm test
```

## 📂 Proje Yapısı

```
src/
├── controllers/    # HTTP istek/yanıt yönetimi
├── services/       # İş mantığı ve Veritabanı (Prisma)
├── routes/         # API uç nokta tanımları
├── middlewares/    # Hata yönetimi, doğrulama ve yardımcı middleware'ler
├── schemas/        # Zod doğrulama şemaları
├── errors/         # Domain hata sınıfları (AppError, NotFoundError, vb.)
├── lib/            # Veritabanı istemcisi, yapılandırma ve logger
├── types/          # TypeScript tip tanımlamaları
├── app.ts          # Express uygulama kurulumu
└── server.ts       # Uygulama giriş noktası
public/             # Frontend dosyaları (HTML, CSS, JS)
prisma/             # Veritabanı şeması ve migration'lar
tests/              # Entegrasyon testleri
```

## 📝 Geliştirme Süreci ve AI Kullanımı

### İzlenen Yol

1. **Planlama:** İlk aşamada API gereksinimlerini analiz ettim ve bu bağlamda projeye uygun bir klasör yapısı ve mimari belirledim.
2. **Teknoloji Seçimi:** Veri kalıcılığı için SQLite + Prisma ve güvenli veri doğrulaması için Zod tercih ettim. API işlemleri için Express.js, frontendi basit tutmak adına Vanilla.js, testler için Jest kullandım.
3. **Backend Geliştirme:** Ana API işlevlerini yeni endpointler ile genişleterek ekledim, hata yönetim mekanizmaları ve entegrasyon testleri geliştirdim.
4. **Frontend Geliştirme:** Kullanıcı deneyimini artırmak için responsive ve karanlık mod destekli bir "Vanilla JS" arayüzünü ekledim.

### Karar Noktaları ve Zorluklar

- **Veritabanı Kararı:** İlanda "in-memory" yeterli denilse de, gerçek dünya senaryolarına daha yakın olması projenin devamlılık sağlayan bir hafıza sistemi sahip olması adına SQLite kullanma kararı aldım.
- **Proje Kapsamı**: İlandaki proje kapsamını bazı noktalardan genişleterek (yeni iki endpoint, yeni bir data field ve frontend) uygulamanın daha tamamlanmış hissettirmesini hedefledim.
- **Hata Yönetimi:** Özellikle asenkron işlemlerde kod tekrarını önlemek adına `async-handler` ve merkezi bir `error-handler` yapısı kurguladım.
- **Kullanılabilirlik:** API'nin sadece bir backend projesi olarak kalmaması, test eden kişinin sonuçları görsel olarak da görebilmesi için basit bir frontend arayüzü eklemeye karar verdim.

### AI Araçlarının Kullanımı

Bu projenin geliştirilmesinde **Claude Opus 4.6** ve **Gemini 3 Pro** modellerini Claude Code CLI ve Gemini CLI üzerinden aktif olarak kullandım. Gemini 3 Pro modelini [bu eklenti ](https://github.com/gemini-cli-extensions/security)ile güvenlik açıklarını taramak için kullandım. Claude Opus 4.6 modelini ise proje gereklilikleri kapsamında teknoloji yığınına, proje mimarisine karar vermek ve geliştirme planlarını uygulamaya dökmek için kullandım. [Burada](https://github.com/VoltAgent/awesome-claude-code-subagents) bulunan subagentlardan proje kapsamında ihtiyacım olabileceğini düşündüklerimi proje içerisinde kullanarak hem mimari hem de geliştirici kararlarının daha doğru olmasını sağlamaya çalıştım. AI tarafından verilen çıktıları kontrol ederek projeyi tamamladım.
