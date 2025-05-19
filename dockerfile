FROM node:23.11.1-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Static export için sadece build yeterli - output: 'export' ile
RUN npm run dev
# Serve paketini yükleyin
#RUN npm install -g serve

EXPOSE 3000
# Serve ile statik dosyaları sunun
#CMD ["serve", "-s", "out", "-p", "3000"]