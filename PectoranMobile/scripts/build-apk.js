/**
 * Скрипт для сборки APK файла
 * Кросс-платформенный скрипт для Windows, macOS и Linux
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const gradlewFile = isWindows ? 'gradlew.bat' : 'gradlew';
const gradlewPath = path.join(__dirname, '..', 'android', gradlewFile);

console.log('');
console.log('========================================');
console.log('  Сборка APK файла для Android');
console.log('========================================');
console.log('');

const androidDir = path.join(__dirname, '..', 'android');
const localPropertiesPath = path.join(androidDir, 'local.properties');
const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const outputPath = path.join(__dirname, '..', 'PectoranAPP-release.apk');

/**
 * Проверить наличие Android SDK
 */
function checkAndroidSDK() {
  let sdkPath = null;
  let sdkSource = null;
  
  // Сначала проверяем переменные окружения (приоритет)
  const envHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (envHome && fs.existsSync(envHome)) {
    sdkPath = envHome;
    sdkSource = 'ANDROID_HOME/ANDROID_SDK_ROOT';
    console.log(`✅ Android SDK найден через переменную окружения: ${sdkPath}`);
  }
  
  // Затем проверяем local.properties
  if (!sdkPath && fs.existsSync(localPropertiesPath)) {
    try {
      const content = fs.readFileSync(localPropertiesPath, 'utf8');
      const match = content.match(/sdk\.dir\s*=\s*(.+?)(?:\s*$|\r?\n)/m);
      if (match) {
        const pathFromFile = match[1].trim().replace(/^["']|["']$/g, '');
        if (fs.existsSync(pathFromFile)) {
          sdkPath = pathFromFile;
          sdkSource = 'local.properties';
          console.log(`✅ Android SDK найден в local.properties: ${sdkPath}`);
        } else {
          console.log(`⚠️  Путь в local.properties не существует: ${pathFromFile}`);
        }
      }
    } catch (error) {
      console.log(`⚠️  Ошибка чтения local.properties: ${error.message}`);
    }
  }
  
  if (!sdkPath) {
    console.error('❌ Android SDK не найден!');
    console.log('');
    console.log('💡 Решение:');
    console.log('   1. Настройте Android SDK:');
    console.log('      node scripts/setup-android-sdk.js');
    console.log('');
    console.log('   2. Или установите переменную окружения:');
    if (os.platform() === 'win32') {
      console.log('      setx ANDROID_HOME "C:\\Users\\YourUser\\AppData\\Local\\Android\\Sdk"');
      console.log('      (Требуется перезапуск консоли)');
    } else {
      console.log('      export ANDROID_HOME=$HOME/Library/Android/sdk');
    }
    return false;
  }
  
  // Проверяем валидность SDK
  const requiredDirs = ['platforms', 'build-tools', 'platform-tools'];
  const missingDirs = requiredDirs.filter(dir => {
    const dirPath = path.join(sdkPath, dir);
    return !fs.existsSync(dirPath);
  });
  
  if (missingDirs.length > 0) {
    console.error(`❌ Android SDK неполный. Отсутствуют директории: ${missingDirs.join(', ')}`);
    console.log('');
    console.log('💡 Установите недостающие компоненты через Android Studio SDK Manager');
    return false;
  }
  
  // Устанавливаем переменную окружения в текущей сессии (если еще не установлена)
  if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
    process.env.ANDROID_HOME = sdkPath;
    process.env.ANDROID_SDK_ROOT = sdkPath;
    console.log(`💡 Установлена переменная ANDROID_HOME для текущей сессии: ${sdkPath}`);
  }
  
  console.log(`📦 Источник SDK: ${sdkSource}`);
  return true;
}

/**
 * Выполнить команду Gradle
 */
function runGradleCommand(command, description, showStacktrace = false) {
  return new Promise((resolve, reject) => {
    console.log(description);
    
    // Добавляем флаги для диагностики при ошибке
    const gradleArgs = command.split(' ');
    if (showStacktrace) {
      gradleArgs.push('--stacktrace', '--info');
    }
    
    // Устанавливаем переменные окружения для Gradle
    // Используем существующие переменные или не устанавливаем их вообще
    const env = { ...process.env };
    const envHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
    if (envHome) {
      env.ANDROID_HOME = envHome;
      env.ANDROID_SDK_ROOT = envHome;
    }
    
    const gradleProcess = spawn(gradlewPath, gradleArgs, {
      cwd: androidDir,
      stdio: 'inherit',
      shell: isWindows,
      env: env
    });
    
    gradleProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Команда завершилась с кодом ${code}`));
      }
    });
    
    gradleProcess.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  try {
    // Проверка Android SDK
    if (!checkAndroidSDK()) {
      process.exit(1);
    }
    
    // Проверка наличия gradlew
    if (!fs.existsSync(gradlewPath)) {
      console.error(`❌ Gradle wrapper не найден: ${gradlewPath}`);
      console.log('');
      console.log('💡 Убедитесь, что вы находитесь в правильной директории проекта');
      process.exit(1);
    }
    
    // Шаг 1: Очистка
    try {
      await runGradleCommand('clean', '[1/3] Очистка предыдущих сборок...');
    } catch (error) {
      console.log('');
      console.log('⚠️  Ошибка при очистке. Попробуем получить детальную информацию...');
      console.log('');
      try {
        await runGradleCommand('clean', '[Диагностика] Запуск с детальными логами...', true);
      } catch (diagnosticError) {
        // Игнорируем ошибку диагностики, просто показываем сообщение
      }
      throw error;
    }

    // Шаг 2: Сборка
    console.log('');
    await runGradleCommand('assembleRelease', '[2/3] Сборка Release APK...');

    // Шаг 3: Копирование
    console.log('');
    console.log('[3/3] Копирование APK файла...');
    
    if (fs.existsSync(apkPath)) {
      fs.copyFileSync(apkPath, outputPath);
      
      const apkSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
      
      console.log('✅ APK файл собран успешно!');
      console.log('');
      console.log(`📁 Файл: ${apkPath}`);
      console.log(`📦 Скопировано в: ${outputPath}`);
      console.log(`📊 Размер: ${apkSize} MB`);
      console.log('');
      console.log('💡 Следующие шаги:');
      console.log('   1. Отправьте файл PectoranAPP-release.apk тестировщикам');
      console.log('   2. Убедитесь, что backend запущен с ngrok: npm run start:ngrok');
      console.log('   3. Тестировщики могут установить APK на свои устройства');
      console.log('');
      console.log('📱 Инструкция для тестировщиков:');
      console.log('   1. Скачайте APK файл на Android устройство');
      console.log('   2. Разрешите установку из неизвестных источников');
      console.log('   3. Установите приложение');
      console.log('   4. Запустите приложение и войдите');
      console.log('');
    } else {
      console.error(`❌ APK файл не найден: ${apkPath}`);
      console.log('');
      console.log('💡 Возможные причины:');
      console.log('   1. Ошибка при сборке (проверьте логи выше)');
      console.log('   2. Неправильная конфигурация Android SDK');
      console.log('   3. Проблемы с Gradle');
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('❌ Ошибка сборки APK:', error.message);
    console.log('');
    console.log('🔍 Диагностика проблемы:');
    console.log('');
    
    // Проверяем переменные окружения
    const envHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
    if (envHome) {
      console.log(`✅ ANDROID_HOME установлен: ${envHome}`);
    } else {
      console.log('❌ ANDROID_HOME не установлен');
      console.log('💡 Установите: node scripts/setup-android-sdk.js --set-env');
    }
    console.log('');
    
    // Проверяем local.properties
    if (fs.existsSync(localPropertiesPath)) {
      try {
        const content = fs.readFileSync(localPropertiesPath, 'utf8');
        console.log('✅ Файл local.properties существует');
        console.log('📄 Содержимое:');
        console.log('   ' + content.trim().split('\n').join('\n   '));
      } catch (readError) {
        console.log(`❌ Не удалось прочитать local.properties: ${readError.message}`);
      }
    } else {
      console.log('❌ Файл local.properties не найден');
    }
    console.log('');
    
    console.log('💡 Решение проблем:');
    console.log('   1. Установите переменную окружения (рекомендуется):');
    console.log('      node scripts/setup-android-sdk.js --set-env');
    console.log('      (Затем перезапустите консоль)');
    console.log('');
    console.log('   2. Проверьте настройку Android SDK:');
    console.log('      node scripts/setup-android-sdk.js');
    console.log('');
    console.log('   3. Убедитесь, что Android Studio установлен');
    console.log('');
    console.log('   4. Очистите кэш Gradle:');
    console.log('      cd android && gradlew.bat clean');
    console.log('');
    console.log('   5. Попробуйте запустить Gradle с детальными логами:');
    console.log('      cd android && gradlew.bat clean --stacktrace --info');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

