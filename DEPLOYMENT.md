# PostgreSQL C# Kod Üretici - Deployment Kılavuzu

Bu belge, Next.js tabanlı PostgreSQL C# Kod Üretici uygulamasının kalıcı olarak deploy edilmesi için gereken adımları içerir.

## Gereksinimler

- Node.js 18.0.0 veya daha yeni bir sürüm
- npm veya yarn paket yöneticisi
- PostgreSQL veritabanı erişimi

## Deployment Seçenekleri

### 1. Vercel ile Deployment (Önerilen)

Vercel, Next.js uygulamaları için en kolay ve optimize edilmiş deployment seçeneğidir.

1. [Vercel](https://vercel.com) hesabı oluşturun
2. GitHub, GitLab veya Bitbucket'a projeyi yükleyin
3. Vercel'de "New Project" seçeneğini tıklayın
4. Repository'nizi seçin ve import edin
5. Environment Variables bölümünde `DATABASE_URL` değişkenini ekleyin:
   ```
   DATABASE_URL=postgres://username:password@host:5432/database_name
   ```
6. "Deploy" butonuna tıklayın

### 2. Netlify ile Deployment

1. [Netlify](https://netlify.com) hesabı oluşturun
2. "New site from Git" seçeneğini tıklayın
3. Repository'nizi seçin
4. Build komutunu `npm run build` olarak ayarlayın
5. Publish directory'yi `out` olarak ayarlayın
6. Environment Variables bölümünde `DATABASE_URL` değişkenini ekleyin
7. "Deploy site" butonuna tıklayın

### 3. Kendi Sunucunuzda Deployment

#### Production Build Oluşturma

1. Proje dizininde terminal açın
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Production build oluşturun:
   ```bash
   npm run build
   ```
4. Uygulamayı başlatın:
   ```bash
   npm start
   ```

#### Docker ile Deployment

1. Proje dizininde `Dockerfile` oluşturun:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. Docker image oluşturun:
   ```bash
   docker build -t postgres-csharp-generator .
   ```

3. Docker container'ı çalıştırın:
   ```bash
   docker run -p 3000:3000 -e DATABASE_URL=postgres://username:password@host:5432/database_name postgres-csharp-generator
   ```

## Environment Variables

Uygulamanın çalışması için aşağıdaki environment variable'ların ayarlanması gerekir:

- `DATABASE_URL`: PostgreSQL bağlantı string'i
  Format: `postgres://username:password@host:5432/database_name`

## Notlar ve Uyarılar

1. **Güvenlik**: Production ortamında, veritabanı bağlantı bilgilerinin güvenli bir şekilde saklandığından emin olun.
2. **CORS**: Farklı bir domain'den API'ye erişim gerekiyorsa, CORS ayarlarını yapılandırın.
3. **SSL**: Production ortamında HTTPS kullanmanız önerilir.
4. **Veritabanı Erişimi**: Deployment ortamının PostgreSQL veritabanına erişebildiğinden emin olun.

## Sorun Giderme

- **Bağlantı Hataları**: Veritabanı bağlantı string'inin doğru olduğundan emin olun.
- **Build Hataları**: Node.js ve npm sürümlerinin güncel olduğundan emin olun.
- **API Hataları**: Veritabanı şema erişim izinlerinin doğru ayarlandığından emin olun.

Herhangi bir sorunla karşılaşırsanız, lütfen iletişime geçin.
