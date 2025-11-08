# 🚀 Быстрый запуск PectoranAPP

## 📋 Предварительные требования

### 1. Установка Node.js
- Скачайте и установите Node.js 18+ с [nodejs.org](https://nodejs.org/)
- Проверьте установку: `node --version`

### 2. Установка PostgreSQL
- Скачайте PostgreSQL с [postgresql.org](https://www.postgresql.org/download/)
- Установите с настройками по умолчанию
- Запомните пароль для пользователя `postgres`

### 3. Установка Redis (опционально)
- Скачайте Redis для Windows с [github.com/microsoftarchive/redis](https://github.com/microsoftarchive/redis/releases)
- Или используйте Redis Cloud (бесплатно)

## 🏃‍♂️ Запуск системы

### Шаг 1: Настройка базы данных
```bash
# Подключитесь к PostgreSQL
psql -U postgres

# Создайте базу данных
CREATE DATABASE pectoranapp;
CREATE USER pectoranuser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE pectoranapp TO pectoranuser;
\q
```

### Шаг 2: Настройка переменных окружения
Создайте файл `backend/.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pectoranapp
DB_USER=pectoranuser
DB_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=development
```

### Шаг 3: Запуск Backend
```bash
cd backend
npm install
npm run dev
```

### Шаг 4: Запуск TV Display
```bash
cd tv-display
npm install
npm start
```

### Шаг 5: Запуск Mobile App
```bash
cd mobile-app
npm install

# Для Android
npx react-native run-android

# Для iOS (только на macOS)
npx react-native run-ios
```

## 🔑 Тестовые аккаунты

### Официанты
- Номер: `1`, `2`, `3`, `4` (без пароля)

### Повара  
- Номер: `101`, `102` (без пароля)

### Администратор
- Логин: `admin`
- Пароль: `admin123`

### Директор
- Логин: `director` 
- Пароль: `admin123`

## 📱 Доступ к приложениям

- **Backend API**: http://localhost:3000
- **TV Display**: http://localhost:3001
- **Mobile App**: Запускается на устройстве/эмуляторе

## 🐳 Альтернатива: Docker (если установлен)

```bash
# Установите Docker Desktop с [docker.com](https://www.docker.com/products/docker-desktop/)

# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

## 🔧 Устранение проблем

### Проблема с портами
- Backend: измените `PORT=3000` в `.env`
- TV Display: измените порт в `tv-display/package.json`

### Проблема с базой данных
- Проверьте, что PostgreSQL запущен
- Проверьте правильность данных в `.env`
- Проверьте, что база данных создана

### Проблема с мобильным приложением
- Убедитесь, что Android Studio установлен (для Android)
- Убедитесь, что Xcode установлен (для iOS)
- Проверьте, что эмулятор/устройство подключено

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в консоли
2. Убедитесь, что все зависимости установлены
3. Проверьте настройки в `.env`
4. Обратитесь к документации в `README.md` и `API_DOCUMENTATION.md`
