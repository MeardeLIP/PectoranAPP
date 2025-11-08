#!/bin/bash

##############################################################################
# Скрипт для сборки iOS приложения (IPA файл)
# 
# Требования:
# - Mac с установленным Xcode
# - Apple Developer аккаунт (для установки на реальные устройства)
# - CocoaPods установлен (pod install)
#
# Использование:
#   ./scripts/build-ios.sh              # Сборка для симулятора (Development)
#   ./scripts/build-ios.sh --release    # Сборка для устройства (Release)
#   ./scripts/build-ios.sh --device     # Сборка для установки на устройство
##############################################################################

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Директории
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$PROJECT_DIR/ios"
BUILD_DIR="$IOS_DIR/build"

# Параметры
BUILD_TYPE="development"
SCHEME="PectoranMobile"
WORKSPACE="PectoranMobile.xcworkspace"
CONFIGURATION="Debug"

# Парсинг аргументов
while [[ $# -gt 0 ]]; do
  case $1 in
    --release)
      BUILD_TYPE="release"
      CONFIGURATION="Release"
      shift
      ;;
    --device)
      BUILD_TYPE="device"
      CONFIGURATION="Release"
      shift
      ;;
    *)
      echo -e "${YELLOW}Неизвестный параметр: $1${NC}"
      shift
      ;;
  esac
done

echo -e "${GREEN}🚀 Начинаем сборку iOS приложения${NC}"
echo -e "${GREEN}Тип сборки: ${BUILD_TYPE}${NC}"
echo -e "${GREEN}Конфигурация: ${CONFIGURATION}${NC}"

# Проверка операционной системы
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ Ошибка: Этот скрипт должен запускаться на macOS${NC}"
    echo -e "${YELLOW}💡 Для сборки iOS приложения необходим Mac с Xcode${NC}"
    exit 1
fi

# Проверка Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Ошибка: Xcode не установлен${NC}"
    echo -e "${YELLOW}💡 Установите Xcode из App Store${NC}"
    exit 1
fi

# Проверка CocoaPods
if ! command -v pod &> /dev/null; then
    echo -e "${YELLOW}⚠️  CocoaPods не установлен. Устанавливаем...${NC}"
    sudo gem install cocoapods
fi

# Переход в директорию iOS
cd "$IOS_DIR"

# Установка зависимостей
echo -e "${GREEN}📦 Устанавливаем CocoaPods зависимости...${NC}"
pod install

# Очистка предыдущих сборок
echo -e "${GREEN}🧹 Очищаем предыдущие сборки...${NC}"
rm -rf "$BUILD_DIR"
xcodebuild clean -workspace "$WORKSPACE" -scheme "$SCHEME" -configuration "$CONFIGURATION"

# Определение SDK и destination
if [[ "$BUILD_TYPE" == "device" ]]; then
    # Сборка для реального устройства
    echo -e "${GREEN}📱 Сборка для реального устройства...${NC}"
    
    # Получаем список доступных устройств
    DEVICES=$(xcrun xctrace list devices 2>&1 | grep -oE 'iPhone.*\([0-9A-F-]+\)' | head -1)
    
    if [[ -z "$DEVICES" ]]; then
        echo -e "${YELLOW}⚠️  Реальные устройства не найдены. Собираем для симулятора...${NC}"
        DESTINATION="platform=iOS Simulator,name=iPhone 15"
    else
        DEVICE_ID=$(echo "$DEVICES" | grep -oE '\([0-9A-F-]+\)' | tr -d '()' | head -1)
        DESTINATION="platform=iOS,id=$DEVICE_ID"
    fi
    
    # Архивация для устройства
    xcodebuild archive \
        -workspace "$WORKSPACE" \
        -scheme "$SCHEME" \
        -configuration "$CONFIGURATION" \
        -destination "$DESTINATION" \
        -archivePath "$BUILD_DIR/PectoranMobile.xcarchive" \
        CODE_SIGN_IDENTITY="" \
        CODE_SIGNING_REQUIRED=NO \
        CODE_SIGNING_ALLOWED=NO
    
    echo -e "${GREEN}✅ Архив создан: $BUILD_DIR/PectoranMobile.xcarchive${NC}"
    echo -e "${YELLOW}💡 Для создания IPA файла используйте Xcode: Product -> Archive -> Distribute App${NC}"
    
else
    # Сборка для симулятора
    echo -e "${GREEN}📱 Сборка для iOS симулятора...${NC}"
    
    DESTINATION="platform=iOS Simulator,name=iPhone 15"
    
    xcodebuild build \
        -workspace "$WORKSPACE" \
        -scheme "$SCHEME" \
        -configuration "$CONFIGURATION" \
        -destination "$DESTINATION" \
        -derivedDataPath "$BUILD_DIR"
    
    echo -e "${GREEN}✅ Сборка завершена!${NC}"
    echo -e "${YELLOW}💡 Для запуска на симуляторе используйте: npm run ios${NC}"
fi

echo -e "${GREEN}🎉 Готово!${NC}"

