/**
 * Скрипт для автоматического определения и настройки Android SDK
 * Создает/обновляет файл local.properties с правильным путем к Android SDK
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const localPropertiesPath = path.join(__dirname, '..', 'android', 'local.properties');

/**
 * Получить путь к Android SDK из переменных окружения
 */
function getAndroidSDKFromEnv() {
  // ANDROID_HOME (старый стандарт)
  if (process.env.ANDROID_HOME) {
    return process.env.ANDROID_HOME;
  }
  
  // ANDROID_SDK_ROOT (новый стандарт)
  if (process.env.ANDROID_SDK_ROOT) {
    return process.env.ANDROID_SDK_ROOT;
  }
  
  return null;
}

/**
 * Получить стандартные пути установки Android SDK
 */
function getDefaultAndroidSDKPaths() {
  const platform = os.platform();
  const homeDir = os.homedir();
  
  const paths = [];
  
  if (platform === 'win32') {
    // Windows пути
    const username = os.userInfo().username;
    const localAppData = process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local');
    
    paths.push(
      path.join(localAppData, 'Android', 'Sdk'),
      path.join(homeDir, 'AppData', 'Local', 'Android', 'Sdk'),
      path.join('C:', 'Users', username, 'AppData', 'Local', 'Android', 'Sdk'),
      path.join('C:', 'Android', 'Sdk'),
      path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Android', 'android-sdk'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Android', 'android-sdk')
    );
  } else if (platform === 'darwin') {
    // macOS пути
    paths.push(
      path.join(homeDir, 'Library', 'Android', 'sdk'),
      path.join(homeDir, 'Android', 'Sdk')
    );
  } else {
    // Linux пути
    paths.push(
      path.join(homeDir, 'Android', 'Sdk'),
      path.join(homeDir, '.android', 'sdk'),
      '/opt/android-sdk',
      '/usr/lib/android-sdk'
    );
  }
  
  return paths.filter(p => p && p.length > 0);
}

/**
 * Проверить, существует ли путь к Android SDK
 */
function validateAndroidSDKPath(sdkPath) {
  if (!sdkPath || !fs.existsSync(sdkPath)) {
    return false;
  }
  
  // Проверяем наличие обязательных директорий
  const requiredDirs = ['platforms', 'build-tools', 'platform-tools'];
  const allExist = requiredDirs.every(dir => {
    const dirPath = path.join(sdkPath, dir);
    return fs.existsSync(dirPath);
  });
  
  return allExist;
}

/**
 * Проверить, соответствует ли путь текущему пользователю (для Windows)
 */
function isPathForCurrentUser(sdkPath) {
  if (os.platform() !== 'win32') {
    // На Linux/macOS не проверяем пользователя
    return true;
  }
  
  if (!sdkPath) {
    return false;
  }
  
  const currentUsername = os.userInfo().username;
  const homeDir = os.homedir();
  
  // Нормализуем пути для сравнения
  const normalizedSdkPath = path.normalize(sdkPath).toLowerCase();
  const normalizedHomeDir = path.normalize(homeDir).toLowerCase();
  
  // Если путь находится в домашней директории текущего пользователя - валиден
  if (normalizedSdkPath.startsWith(normalizedHomeDir)) {
    return true;
  }
  
  // Если путь содержит имя другого пользователя в пути Users/...
  const usersMatch = normalizedSdkPath.match(/users[\\/]([^\\/]+)[\\/]/);
  if (usersMatch && usersMatch[1]) {
    const pathUsername = usersMatch[1];
    if (pathUsername !== currentUsername.toLowerCase()) {
      // Путь указывает на другого пользователя
      return false;
    }
  }
  
  // Если путь не содержит Users (например, C:\Android\Sdk), считаем валидным
  // (могут быть системные пути, которые доступны всем пользователям)
  if (!normalizedSdkPath.includes('users')) {
    return true;
  }
  
  // Если путь содержит имя текущего пользователя - валиден
  if (normalizedSdkPath.includes(currentUsername.toLowerCase())) {
    return true;
  }
  
  // Во всех остальных случаях считаем невалидным (для безопасности)
  return false;
}

/**
 * Найти Android SDK автоматически
 */
function findAndroidSDK() {
  console.log('🔍 Поиск Android SDK...');
  
  // Сначала проверяем переменные окружения
  const envPath = getAndroidSDKFromEnv();
  if (envPath && validateAndroidSDKPath(envPath)) {
    console.log(`✅ Найден в переменных окружения: ${envPath}`);
    return envPath;
  }
  
  // Затем проверяем стандартные пути
  const defaultPaths = getDefaultAndroidSDKPaths();
  console.log('🔍 Проверка стандартных путей...');
  
  for (const sdkPath of defaultPaths) {
    if (validateAndroidSDKPath(sdkPath)) {
      console.log(`✅ Найден по стандартному пути: ${sdkPath}`);
      return sdkPath;
    }
  }
  
  return null;
}

/**
 * Установить переменную окружения ANDROID_HOME
 */
function setAndroidHomeEnvironment(sdkPath) {
  if (os.platform() === 'win32') {
    try {
      const { execSync } = require('child_process');
      // Используем setx для установки системной переменной окружения
      // /M для системной переменной (требует прав администратора)
      // Без /M - пользовательская переменная
      execSync(`setx ANDROID_HOME "${sdkPath}"`, { stdio: 'inherit' });
      console.log('✅ Переменная окружения ANDROID_HOME установлена');
      console.log('⚠️  ВНИМАНИЕ: Перезапустите консоль для применения изменений!');
      return true;
    } catch (error) {
      console.log('⚠️  Не удалось установить переменную окружения автоматически');
      console.log('💡 Установите вручную:');
      console.log(`   setx ANDROID_HOME "${sdkPath}"`);
      return false;
    }
  } else {
    // Linux/macOS
    console.log('💡 Установите переменную окружения вручную:');
    console.log(`   export ANDROID_HOME="${sdkPath}"`);
    console.log('   (Добавьте в ~/.bashrc или ~/.zshrc для постоянной установки)');
    return false;
  }
}

/**
 * Обновить файл local.properties
 */
function updateLocalProperties(sdkPath) {
  // Убеждаемся, что путь абсолютный
  if (!path.isAbsolute(sdkPath)) {
    console.error(`❌ Путь должен быть абсолютным: ${sdkPath}`);
    return false;
  }
  
  // Нормализуем путь (убираем лишние символы, нормализуем разделители)
  const normalizedPath = path.normalize(sdkPath);
  
  // Пробуем использовать прямые слеши для Windows (Gradle на Windows часто предпочитает Unix-стиль)
  // Это более надежный вариант для кроссплатформенной совместимости
  // Обратные слеши могут вызывать проблемы с экранированием в некоторых случаях
  let formattedPath;
  if (os.platform() === 'win32') {
    // Windows: используем прямые слеши (Gradle обычно предпочитает этот формат)
    // Это стандартный формат для Java/Gradle на всех платформах
    formattedPath = normalizedPath.replace(/\\/g, '/');
  } else {
    // Linux/macOS: используем прямые слеши
    formattedPath = normalizedPath.replace(/\\/g, '/');
  }
  
  // Убеждаемся, что путь не содержит лишних пробелов
  formattedPath = formattedPath.trim();
  
  // Создаем минимальное содержимое файла (без комментариев для лучшей совместимости с Gradle)
  // Gradle может неправильно интерпретировать комментарии в некоторых случаях
  const content = `sdk.dir=${formattedPath}
`;

  try {
    // Для Java properties файлов рекомендуется ISO-8859-1, но для ASCII путей UTF-8 идентичен
    // Используем UTF-8 без BOM (Node.js по умолчанию)
    // Для путей Windows без специальных символов UTF-8 и ISO-8859-1 идентичны
    fs.writeFileSync(localPropertiesPath, content, { encoding: 'utf8', flag: 'w' });
    
    // Проверяем, что файл был записан правильно
    const writtenContent = fs.readFileSync(localPropertiesPath, 'utf8');
    const writtenMatch = writtenContent.match(/sdk\.dir\s*=\s*(.+?)(?:\s*$|\r?\n)/m);
    if (writtenMatch && writtenMatch[1].trim() === formattedPath) {
      console.log(`✅ Файл local.properties обновлен: ${localPropertiesPath}`);
      console.log(`   Путь: ${formattedPath}`);
      console.log('');
      console.log('📄 Содержимое файла (для проверки):');
      console.log('   ' + writtenContent.trim());
      console.log('');
      console.log('💡 Проверка:');
      console.log(`   - Файл существует: ${fs.existsSync(localPropertiesPath) ? '✅' : '❌'}`);
      console.log(`   - Размер файла: ${fs.statSync(localPropertiesPath).size} байт`);
      console.log(`   - Путь в файле: ${writtenMatch[1].trim()}`);
      console.log(`   - Путь валиден: ${validateAndroidSDKPath(writtenMatch[1].trim()) ? '✅' : '❌'}`);
      console.log(`   - Формат: прямые слеши (Unix-стиль) ${formattedPath.includes('/') ? '✅' : '❌'}`);
      console.log(`   - Комментарии: ${writtenContent.includes('#') ? '❌ (есть)' : '✅ (нет)'}`);
      console.log('');
      console.log('💡 Рекомендации:');
      console.log('   - Файл должен содержать только одну строку: sdk.dir=путь');
      console.log('   - Путь должен использовать прямые слеши (/) для всех платформ');
      console.log('   - Комментарии не должны присутствовать');
      return true;
    } else {
      console.error(`❌ Ошибка: файл не был записан правильно`);
      console.error(`   Ожидалось: ${formattedPath}`);
      console.error(`   Записано: ${writtenMatch ? writtenMatch[1].trim() : 'не найдено'}`);
      console.error(`   Полное содержимое: ${JSON.stringify(writtenContent)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Ошибка записи файла: ${error.message}`);
    return false;
  }
}

/**
 * Основная функция
 */
function main() {
  console.log('');
  console.log('========================================');
  console.log('  Настройка Android SDK');
  console.log('========================================');
  console.log('');
  
  // Выводим информацию о текущем пользователе
  const currentUsername = os.userInfo().username;
  const homeDir = os.homedir();
  console.log(`👤 Текущий пользователь: ${currentUsername}`);
  console.log(`🏠 Домашняя директория: ${homeDir}`);
  console.log('');
  
  // Проверяем текущий файл local.properties
  let currentPath = null;
  let needsUpdate = false;
  
  if (fs.existsSync(localPropertiesPath)) {
    try {
      const content = fs.readFileSync(localPropertiesPath, 'utf8');
      // Ищем строку с sdk.dir (может содержать комментарии или пробелы)
      const match = content.match(/sdk\.dir\s*=\s*(.+?)(?:\s*$|\r?\n|#)/m);
      if (match) {
        currentPath = match[1].trim().replace(/^["']|["']$/g, '');
        console.log(`📁 Текущий путь в local.properties: ${currentPath}`);
        
        // Проверяем наличие комментариев в файле
        const hasComments = content.includes('##') || content.includes('#') && !content.trim().startsWith('sdk.dir');
        if (hasComments) {
          console.log('⚠️  Файл содержит комментарии, рекомендуется обновить формат');
          needsUpdate = true;
        }
        
        // Проверяем формат пути (обратные слеши на Windows)
        if (os.platform() === 'win32' && currentPath.includes('\\') && !currentPath.includes('/')) {
          console.log('⚠️  Путь использует обратные слеши, рекомендуется использовать прямые для Gradle');
          needsUpdate = true;
        }
        
        // Нормализуем путь для проверки (приводим к нативному формату)
        const normalizedCurrentPath = path.normalize(currentPath);
        
        // Проверяем валидность пути
        const isValid = validateAndroidSDKPath(normalizedCurrentPath);
        const isForCurrentUser = isPathForCurrentUser(normalizedCurrentPath);
        
        if (isValid && isForCurrentUser && !needsUpdate) {
          // Для Windows Gradle обычно предпочитает прямые слеши (Unix-стиль)
          // Это стандартный формат для Java/Gradle на всех платформах
          // Проверяем только если путь существует и валиден
          console.log('✅ Текущий путь валиден и соответствует текущему пользователю!');
          console.log('');
          console.log('💡 Если Gradle все еще не может найти SDK:');
          console.log('   1. Установите переменную окружения (рекомендуется):');
          console.log('      node scripts/setup-android-sdk.js --set-env');
          console.log('      (Затем перезапустите консоль)');
          console.log('   2. Очистите кэш Gradle: cd android && gradlew.bat clean');
          console.log('   3. Перезапустите Android Studio');
          return;
        } else {
          if (!isValid) {
            console.log('⚠️  Текущий путь не существует или невалиден');
            needsUpdate = true;
          }
          if (!isForCurrentUser && os.platform() === 'win32') {
            console.log('⚠️  Текущий путь указывает на другого пользователя');
            needsUpdate = true;
          }
          console.log('');
        }
      } else {
        console.log('⚠️  Не удалось найти sdk.dir в файле local.properties');
        needsUpdate = true;
      }
    } catch (error) {
      console.log('⚠️  Ошибка чтения local.properties:', error.message);
      needsUpdate = true;
    }
  } else {
    console.log('📝 Файл local.properties не найден, будет создан новый');
    console.log('');
    needsUpdate = true;
  }
  
  // Если путь невалиден или указывает на другого пользователя, ищем правильный
  if (needsUpdate) {
    console.log('🔍 Поиск правильного пути для текущего пользователя...');
    console.log('');
  }
  
  // Получаем путь из аргументов или находим автоматически
  const args = process.argv.slice(2);
  const forceFlag = args.includes('--force') || args.includes('-f');
  let sdkPath = null;
  
  if (args.length > 0 && !forceFlag) {
    // Путь указан вручную (первый аргумент, если это не флаг)
    const manualPath = args.find(arg => !arg.startsWith('-'));
    if (manualPath) {
      sdkPath = manualPath;
      console.log(`📝 Используется указанный путь: ${sdkPath}`);
    }
  }
  
  // Если путь не указан вручную, ищем автоматически
  if (!sdkPath) {
    sdkPath = findAndroidSDK();
  }
  
  if (!sdkPath) {
    console.error('❌ Android SDK не найден!');
    console.log('');
    console.log('💡 Инструкция:');
    console.log('1. Установите Android Studio');
    console.log('2. Установите Android SDK через Android Studio');
    console.log('3. Укажите путь вручную:');
    console.log(`   node scripts/setup-android-sdk.js <путь_к_sdk>`);
    console.log('');
    console.log('📝 Стандартные пути для текущего пользователя:');
    const defaultPaths = getDefaultAndroidSDKPaths();
    defaultPaths.slice(0, 3).forEach(p => console.log(`   - ${p}`));
    console.log('');
    console.log('💡 Или установите переменную окружения:');
    if (os.platform() === 'win32') {
      console.log(`   setx ANDROID_HOME "${path.join(homeDir, 'AppData', 'Local', 'Android', 'Sdk')}"`);
    } else {
      console.log(`   export ANDROID_HOME=${path.join(homeDir, 'Library', 'Android', 'sdk')}`);
    }
    process.exit(1);
  }
  
  // Убеждаемся, что путь абсолютный
  if (!path.isAbsolute(sdkPath)) {
    console.error(`❌ Путь должен быть абсолютным: ${sdkPath}`);
    console.log('');
    console.log('💡 Укажите абсолютный путь к Android SDK');
    process.exit(1);
  }
  
  // Нормализуем путь
  sdkPath = path.normalize(sdkPath);
  
  // Валидация пути
  if (!validateAndroidSDKPath(sdkPath)) {
    console.error(`❌ Путь невалиден или Android SDK не найден: ${sdkPath}`);
    console.log('');
    console.log('💡 Проверьте, что:');
    console.log('   1. Путь указан правильно');
    console.log('   2. Android SDK установлен');
    console.log('   3. В SDK есть папки: platforms, build-tools, platform-tools');
    console.log('');
    console.log('📝 Проверка директорий:');
    const requiredDirs = ['platforms', 'build-tools', 'platform-tools'];
    requiredDirs.forEach(dir => {
      const dirPath = path.join(sdkPath, dir);
      const exists = fs.existsSync(dirPath);
      console.log(`   ${exists ? '✅' : '❌'} ${dir}: ${exists ? 'найдено' : 'не найдено'}`);
    });
    process.exit(1);
  }
  
  // Проверяем, нужно ли обновлять файл
  // Нормализуем оба пути для сравнения (приводим к одному формату)
  const normalizedCurrentPath = currentPath ? path.normalize(currentPath) : null;
  const normalizedSdkPath = path.normalize(sdkPath);
  
  // Сравниваем нормализованные пути (игнорируя формат разделителей)
  const compareCurrentPath = normalizedCurrentPath ? normalizedCurrentPath.replace(/[\\/]/g, path.sep) : null;
  const compareSdkPath = normalizedSdkPath.replace(/[\\/]/g, path.sep);
  
  // Проверяем формат файла (наличие комментариев)
  if (fs.existsSync(localPropertiesPath) && !needsUpdate) {
    try {
      const content = fs.readFileSync(localPropertiesPath, 'utf8');
      const hasComments = content.includes('##') || (content.includes('#') && !content.trim().startsWith('sdk.dir'));
      if (hasComments) {
        console.log('⚠️  Файл содержит комментарии, обновление формата...');
        needsUpdate = true;
      }
    } catch (error) {
      // Игнорируем ошибку чтения
    }
  }
  
  if (compareCurrentPath && compareCurrentPath === compareSdkPath && !needsUpdate) {
    console.log('✅ Путь уже правильный, обновление не требуется');
    console.log('💡 Если Gradle все еще не может найти SDK, попробуйте:');
    console.log('   1. Принудительно обновить файл: node scripts/setup-android-sdk.js --force');
    console.log('   2. Установить переменную окружения: node scripts/setup-android-sdk.js --set-env');
    console.log('   3. Очистить кэш Gradle: cd android && gradlew.bat clean');
    console.log('   4. Перезапустить Android Studio');
    return;
  }
  
  // Обновляем local.properties
  console.log('');
  if (currentPath) {
    console.log(`🔄 Обновление пути: ${currentPath} → ${sdkPath}`);
  } else {
    console.log(`📝 Установка пути: ${sdkPath}`);
  }
  console.log('');
  
  // Диагностика: выводим информацию о файле перед обновлением
  if (fs.existsSync(localPropertiesPath)) {
    try {
      const currentContent = fs.readFileSync(localPropertiesPath, 'utf8');
      console.log('📄 Текущее содержимое local.properties:');
      console.log('   ' + currentContent.split('\n').map(line => line.trim()).filter(line => line).join('\n   '));
      console.log('');
    } catch (error) {
      console.log(`⚠️  Не удалось прочитать текущий файл: ${error.message}`);
      console.log('');
    }
  }
  
  if (updateLocalProperties(sdkPath)) {
    console.log('✅ Настройка завершена успешно!');
    console.log('');
    
    // Проверяем переменные окружения как альтернативу
    const envHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
    if (!envHome) {
      console.log('💡 Рекомендуется установить переменную окружения ANDROID_HOME:');
      console.log('   Это поможет Gradle найти SDK даже если local.properties не читается');
      console.log('');
      
      // Предлагаем установить переменную окружения
      const args = process.argv.slice(2);
      if (args.includes('--set-env') || args.includes('-e')) {
        console.log('🔧 Установка переменной окружения ANDROID_HOME...');
        setAndroidHomeEnvironment(sdkPath);
        console.log('');
      } else {
        if (os.platform() === 'win32') {
          console.log('💡 Для автоматической установки запустите:');
          console.log(`   node scripts/setup-android-sdk.js --set-env`);
          console.log('');
          console.log('💡 Или установите вручную:');
          console.log(`   setx ANDROID_HOME "${sdkPath}"`);
          console.log('   (Требуется перезапуск консоли после установки)');
        } else {
          console.log('💡 Установите вручную:');
          console.log(`   export ANDROID_HOME="${sdkPath}"`);
          console.log('   (Добавьте в ~/.bashrc или ~/.zshrc для постоянной установки)');
        }
        console.log('');
      }
    } else {
      const envPath = path.normalize(envHome);
      const sdkPathNormalized = path.normalize(sdkPath);
      if (envPath !== sdkPathNormalized) {
        console.log('⚠️  Переменная окружения ANDROID_HOME указывает на другой путь:');
        console.log(`   ANDROID_HOME: ${envHome}`);
        console.log(`   local.properties: ${sdkPath}`);
        console.log('💡 Рекомендуется синхронизировать пути');
        console.log('');
      } else {
        console.log('✅ Переменная окружения ANDROID_HOME также настроена правильно');
        console.log('   Gradle должен найти SDK через переменную окружения');
        console.log('');
      }
    }
    
    console.log('💡 Теперь можно собрать APK:');
    console.log('   npm run build:apk');
    console.log('');
    console.log('💡 Если Gradle все еще не может найти SDK:');
    console.log('   1. Проверьте содержимое файла local.properties вручную');
    console.log('   2. Очистите кэш Gradle: cd android && gradlew.bat clean');
    console.log('   3. Установите переменную окружения ANDROID_HOME (см. выше)');
    console.log('   4. Перезапустите Android Studio и консоль');
  } else {
    console.error('❌ Не удалось обновить local.properties');
    console.log('');
    console.log('💡 Альтернативное решение: установите переменную окружения ANDROID_HOME');
    if (os.platform() === 'win32') {
      console.log(`   setx ANDROID_HOME "${sdkPath}"`);
    } else {
      console.log(`   export ANDROID_HOME="${sdkPath}"`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { findAndroidSDK, validateAndroidSDKPath, updateLocalProperties, isPathForCurrentUser, setAndroidHomeEnvironment };

