@echo off
echo 🚀 Запуск PectoranAPP...

echo.
echo 📦 Установка зависимостей Backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Ошибка установки зависимостей Backend
    pause
    exit /b 1
)

echo.
echo 📦 Установка зависимостей TV Display...
cd ..\tv-display
call npm install
if %errorlevel% neq 0 (
    echo ❌ Ошибка установки зависимостей TV Display
    pause
    exit /b 1
)

echo.
echo 📦 Установка зависимостей Mobile App...
cd ..\mobile-app
call npm install
if %errorlevel% neq 0 (
    echo ❌ Ошибка установки зависимостей Mobile App
    pause
    exit /b 1
)

echo.
echo ✅ Все зависимости установлены!
echo.
echo 🔧 Следующие шаги:
echo 1. Настройте базу данных PostgreSQL (см. QUICK_START.md)
echo 2. Создайте файл backend\.env с настройками БД
echo 3. Запустите Backend: cd backend && npm run dev
echo 4. Запустите TV Display: cd tv-display && npm start
echo 5. Запустите Mobile App: cd mobile-app && npx react-native run-android
echo.
echo 📚 Подробная инструкция в QUICK_START.md
pause
