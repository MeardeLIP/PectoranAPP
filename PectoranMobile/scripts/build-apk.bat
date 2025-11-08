@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Сборка APK файла для Android
echo ========================================
echo.

cd /d %~dp0\..

REM Проверка наличия local.properties
set LOCAL_PROPERTIES=android\local.properties
if not exist %LOCAL_PROPERTIES% (
    echo ❌ Файл local.properties не найден!
    echo.
    echo 💡 Настройте Android SDK:
    echo    node scripts\setup-android-sdk.js
    echo    или
    echo    node scripts\setup-android-sdk.js ^<путь_к_android_sdk^>
    echo.
    pause
    exit /b 1
)

REM Проверка наличия gradlew.bat
set GRADLEW=android\gradlew.bat
if not exist %GRADLEW% (
    echo ❌ Gradle wrapper не найден: %GRADLEW%
    echo.
    echo 💡 Убедитесь, что вы находитесь в правильной директории проекта
    echo.
    pause
    exit /b 1
)

echo [1/3] Очистка предыдущих сборок...
cd android
call gradlew.bat clean
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Ошибка очистки
    echo.
    echo 💡 Решение проблем:
    echo    1. Проверьте настройку Android SDK: node scripts\setup-android-sdk.js
    echo    2. Убедитесь, что Android Studio установлен
    echo    3. Проверьте логи выше для подробностей
    echo.
    cd ..
    pause
    exit /b 1
)

echo.
echo [2/3] Сборка Release APK...
call gradlew.bat assembleRelease
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Ошибка сборки APK
    echo.
    echo 💡 Решение проблем:
    echo    1. Проверьте настройку Android SDK: node scripts\setup-android-sdk.js
    echo    2. Убедитесь, что Android Studio установлен
    echo    3. Проверьте, что все зависимости установлены: npm install
    echo    4. Очистите кэш: cd android ^&^& gradlew.bat clean
    echo    5. Проверьте логи выше для подробностей
    echo.
    cd ..
    pause
    exit /b 1
)

echo.
echo [3/3] Копирование APK файла...
set APK_PATH=app\build\outputs\apk\release\app-release.apk
set OUTPUT_PATH=..\PectoranAPP-release.apk

if exist %APK_PATH% (
    copy /Y %APK_PATH% %OUTPUT_PATH% >nul
    
    REM Получаем размер файла
    for %%A in (%OUTPUT_PATH%) do set SIZE=%%~zA
    set /a SIZE_MB=!SIZE!/1024/1024
    
    echo ✅ APK файл собран успешно!
    echo.
    echo 📁 Файл: %CD%\%APK_PATH%
    echo 📦 Скопировано в: %~dp0\..\%OUTPUT_PATH%
    echo 📊 Размер: !SIZE_MB! MB
    echo.
    echo 💡 Следующие шаги:
    echo    1. Отправьте файл PectoranAPP-release.apk тестировщикам
    echo    2. Убедитесь, что backend запущен с ngrok: npm run start:ngrok
    echo    3. Тестировщики могут установить APK на свои устройства
    echo.
    echo 📱 Инструкция для тестировщиков:
    echo    1. Скачайте APK файл на Android устройство
    echo    2. Разрешите установку из неизвестных источников
    echo    3. Установите приложение
    echo    4. Запустите приложение и войдите
    echo.
) else (
    echo ❌ APK файл не найден: %APK_PATH%
    echo.
    echo 💡 Возможные причины:
    echo    1. Ошибка при сборке (проверьте логи выше)
    echo    2. Неправильная конфигурация Android SDK
    echo    3. Проблемы с Gradle
    echo.
    cd ..
    pause
    exit /b 1
)

cd ..
pause

