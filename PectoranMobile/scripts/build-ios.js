/**
 * Скрипт для сборки iOS приложения (IPA файл)
 * 
 * Требования:
 * - Mac с установленным Xcode
 * - Apple Developer аккаунт (для установки на реальные устройства)
 * - CocoaPods установлен
 * 
 * Использование:
 *   node scripts/build-ios.js              # Сборка для симулятора
 *   node scripts/build-ios.js --release    # Сборка для устройства (Release)
 *   node scripts/build-ios.js --device     # Сборка для установки на устройство
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Параметры
const args = process.argv.slice(2);
const isRelease = args.includes('--release');
const isDevice = args.includes('--device');
const buildType = isDevice ? 'device' : (isRelease ? 'release' : 'development');
const configuration = isRelease || isDevice ? 'Release' : 'Debug';

// Директории
const projectDir = path.resolve(__dirname, '..');
const iosDir = path.join(projectDir, 'ios');
const buildDir = path.join(iosDir, 'build');

// Проверка операционной системы
if (os.platform() !== 'darwin') {
  log('❌ Ошибка: Этот скрипт должен запускаться на macOS', 'red');
  log('💡 Для сборки iOS приложения необходим Mac с Xcode', 'yellow');
  log('💡 Альтернативы:', 'yellow');
  log('   1. Используйте Mac с Xcode', 'yellow');
  log('   2. Используйте GitHub Actions для сборки в облаке', 'yellow');
  log('   3. Используйте сервисы типа Codemagic или AppCircle', 'yellow');
  process.exit(1);
}

// Проверка Xcode
try {
  execSync('xcodebuild -version', { stdio: 'ignore' });
} catch (error) {
  log('❌ Ошибка: Xcode не установлен', 'red');
  log('💡 Установите Xcode из App Store', 'yellow');
  process.exit(1);
}

// Проверка CocoaPods
let hasPod = false;
try {
  execSync('pod --version', { stdio: 'ignore' });
  hasPod = true;
} catch (error) {
  log('⚠️  CocoaPods не установлен', 'yellow');
  log('💡 Установите CocoaPods: sudo gem install cocoapods', 'yellow');
}

log('🚀 Начинаем сборку iOS приложения', 'green');
log(`Тип сборки: ${buildType}`, 'green');
log(`Конфигурация: ${configuration}`, 'green');

// Переход в директорию iOS
process.chdir(iosDir);

// Установка CocoaPods зависимостей
if (hasPod) {
  log('📦 Устанавливаем CocoaPods зависимости...', 'green');
  try {
    execSync('pod install', { stdio: 'inherit' });
  } catch (error) {
    log('❌ Ошибка при установке CocoaPods зависимостей', 'red');
    process.exit(1);
  }
}

// Очистка предыдущих сборок
log('🧹 Очищаем предыдущие сборки...', 'green');
try {
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
  execSync('xcodebuild clean -workspace PectoranMobile.xcworkspace -scheme PectoranMobile -configuration ' + configuration, {
    stdio: 'inherit',
    cwd: iosDir
  });
} catch (error) {
  log('⚠️  Предупреждение: Не удалось очистить предыдущие сборки', 'yellow');
}

if (isDevice) {
  // Сборка для реального устройства
  log('📱 Сборка для реального устройства...', 'green');
  log('💡 Для создания IPA файла используйте Xcode:', 'yellow');
  log('   1. Откройте PectoranMobile.xcworkspace в Xcode', 'yellow');
  log('   2. Выберите Product -> Archive', 'yellow');
  log('   3. После архивации выберите Distribute App', 'yellow');
  log('   4. Выберите метод распространения (Ad Hoc, Enterprise, App Store)', 'yellow');
  
  // Попытка сборки через xcodebuild
  try {
    const destination = 'generic/platform=iOS';
    execSync(`xcodebuild archive -workspace PectoranMobile.xcworkspace -scheme PectoranMobile -configuration ${configuration} -destination "${destination}" -archivePath "${buildDir}/PectoranMobile.xcarchive" CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO`, {
      stdio: 'inherit',
      cwd: iosDir
    });
    log('✅ Архив создан!', 'green');
  } catch (error) {
    log('⚠️  Автоматическая сборка не удалась. Используйте Xcode для создания IPA', 'yellow');
  }
} else {
  // Сборка для симулятора
  log('📱 Сборка для iOS симулятора...', 'green');
  
  const destination = 'platform=iOS Simulator,name=iPhone 15';
  
  try {
    execSync(`xcodebuild build -workspace PectoranMobile.xcworkspace -scheme PectoranMobile -configuration ${configuration} -destination "${destination}" -derivedDataPath "${buildDir}"`, {
      stdio: 'inherit',
      cwd: iosDir
    });
    log('✅ Сборка завершена!', 'green');
    log('💡 Для запуска на симуляторе используйте: npm run ios', 'yellow');
  } catch (error) {
    log('❌ Ошибка при сборке', 'red');
    process.exit(1);
  }
}

log('🎉 Готово!', 'green');

