# PectoranAPP - Инструкция по установке и запуску

## 🚀 Быстрый старт

### Предварительные требования

- **Node.js** 18+ 
- **PostgreSQL** 14+
- **Redis** 6+
- **Docker** и **Docker Compose** (опционально)
- **React Native CLI** (для мобильного приложения)
- **Android Studio** или **Xcode** (для мобильного приложения)

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd PectoranAPP
```

### 2. Установка зависимостей

```bash
# Backend
cd backend
npm install

# Mobile App
cd ../mobile-app
npm install

# TV Display
cd ../tv-display
npm install
```

### 3. Настройка базы данных

#### PostgreSQL
```bash
# Создание базы данных
createdb pectoran_restaurant

# Или через psql
psql -U postgres
CREATE DATABASE pectoran_restaurant;
```

#### Redis
```bash
# Запуск Redis (Ubuntu/Debian)
sudo systemctl start redis-server

# Или через Docker
docker run -d -p 6379:6379 redis:alpine
```

### 4. Настройка переменных окружения

Скопируйте файл `.env.example` в `.env` и настройте:

```bash
cd backend
cp .env.example .env
```

Отредактируйте `.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pectoran_restaurant
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Server
PORT=3000
NODE_ENV=development
```

### 5. Запуск через Docker (рекомендуется)

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f
```

### 6. Запуск вручную

#### Backend
```bash
cd backend
npm run dev
```

#### TV Display
```bash
cd tv-display
npm start
```

#### Mobile App
```bash
cd mobile-app

# Android
npm run android

# iOS
npm run ios
```

## 📱 Настройка мобильного приложения

### Android

1. Установите Android Studio
2. Настройте Android SDK
3. Создайте эмулятор или подключите устройство
4. Запустите: `npm run android`

### iOS

1. Установите Xcode
2. Установите CocoaPods: `sudo gem install cocoapods`
3. Установите зависимости: `cd ios && pod install`
4. Запустите: `npm run ios`

## 🌐 Настройка TV Display

1. Откройте браузер на Smart TV или подключенном компьютере
2. Перейдите по адресу: `http://localhost:3001`
3. Интерфейс автоматически подключится к WebSocket серверу

## 🔧 Настройка для продакшена

### 1. Настройка сервера

```bash
# Установка PM2 для управления процессами
npm install -g pm2

# Запуск backend
cd backend
pm2 start src/server.js --name "pectoran-backend"

# Настройка автозапуска
pm2 startup
pm2 save
```

### 2. Настройка Nginx (опционально)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /tv {
        proxy_pass http://localhost:3001;
    }
}
```

### 3. Настройка SSL (рекомендуется)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение SSL сертификата
sudo certbot --nginx -d your-domain.com
```

## 🗄️ Настройка базы данных

### Создание пользователей по умолчанию

После первого запуска создаются пользователи:

- **Администратор**: `admin` / `admin123`
- **Директор**: `director` / `admin123`
- **Официанты**: номера 1, 2, 3, 4
- **Повара**: номера 101, 102

### Резервное копирование

```bash
# Создание бэкапа
pg_dump -U postgres pectoran_restaurant > backup.sql

# Восстановление
psql -U postgres pectoran_restaurant < backup.sql
```

## 🔍 Мониторинг и логи

### Логи приложения

```bash
# Backend логи
tail -f backend/logs/app.log

# Docker логи
docker-compose logs -f backend
```

### Мониторинг производительности

```bash
# Статус PM2 процессов
pm2 status

# Мониторинг ресурсов
pm2 monit
```

## 🚨 Устранение неполадок

### Проблемы с подключением к БД

1. Проверьте, что PostgreSQL запущен
2. Проверьте настройки в `.env`
3. Проверьте права доступа пользователя

### Проблемы с Redis

1. Проверьте, что Redis запущен: `redis-cli ping`
2. Проверьте настройки подключения

### Проблемы с мобильным приложением

1. Очистите кэш: `npx react-native start --reset-cache`
2. Переустановите зависимости: `rm -rf node_modules && npm install`
3. Для Android: `cd android && ./gradlew clean`

### Проблемы с WebSocket

1. Проверьте, что порт 3000 доступен
2. Проверьте настройки CORS
3. Проверьте файрвол

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи приложения
2. Убедитесь, что все сервисы запущены
3. Проверьте настройки сети и портов
4. Обратитесь к документации API

## 🔄 Обновление

```bash
# Получение обновлений
git pull origin main

# Обновление зависимостей
cd backend && npm update
cd ../mobile-app && npm update
cd ../tv-display && npm update

# Перезапуск сервисов
docker-compose restart
# или
pm2 restart all
```
