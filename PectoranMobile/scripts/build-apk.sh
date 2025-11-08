#!/bin/bash

echo ""
echo "========================================"
echo "  Сборка APK файла для Android"
echo "========================================"
echo ""

cd "$(dirname "$0")/.."

echo "[1/3] Очистка предыдущих сборок..."
cd android
./gradlew clean
if [ $? -ne 0 ]; then
    echo "❌ Ошибка очистки"
    exit 1
fi

echo ""
echo "[2/3] Сборка Release APK..."
./gradlew assembleRelease
if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки APK"
    exit 1
fi

echo ""
echo "[3/3] Копирование APK файла..."
APK_PATH="app/build/outputs/apk/release/app-release.apk"
OUTPUT_PATH="../PectoranAPP-release.apk"

if [ -f "$APK_PATH" ]; then
    cp "$APK_PATH" "$OUTPUT_PATH"
    echo "✅ APK файл собран успешно!"
    echo ""
    echo "📁 Файл: $(pwd)/$APK_PATH"
    echo "📦 Скопировано в: $(dirname "$0")/../$OUTPUT_PATH"
    echo ""
    echo "💡 Следующие шаги:"
    echo "   1. Отправьте файл PectoranAPP-release.apk тестировщикам"
    echo "   2. Убедитесь, что backend запущен с ngrok: npm run start:ngrok"
    echo "   3. Тестировщики могут установить APK на свои устройства"
    echo ""
else
    echo "❌ APK файл не найден: $APK_PATH"
    exit 1
fi

cd ..

