/**
 * Скрипт для настройки сетевой конфигурации мобильного приложения
 * Обновляет IP адрес в PectoranMobile/src/config/network.js
 * 
 * Использование:
 *   node scripts/setup-network-config.js <IP_ADDRESS>
 *   node scripts/setup-network-config.js 192.168.1.100
 *   node scripts/setup-network-config.js --emulator (для эмулятора)
 *   node scripts/setup-network-config.js --auto (автоматическое определение IP)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Путь к файлу конфигурации
const configPath = path.join(__dirname, '..', 'src', 'config', 'network.js');

/**
 * Получить локальный IP адрес
 */
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  // Список приоритетных интерфейсов
  const priorityInterfaces = ['Wi-Fi', 'Ethernet', 'eth0', 'wlan0', 'en0'];
  
  // Сначала проверяем приоритетные интерфейсы
  for (const interfaceName of priorityInterfaces) {
    if (interfaces[interfaceName]) {
      for (const address of interfaces[interfaceName]) {
        if (address.family === 'IPv4' && !address.internal) {
          return address.address;
        }
      }
    }
  }
  
  // Если не нашли в приоритетных, проверяем все интерфейсы
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    for (const address of addresses) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  
  return null;
}

/**
 * Проверка, является ли адрес ngrok доменом
 */
function isNgrokDomain(address) {
  if (!address) return false;
  const ngrokPatterns = [
    /\.ngrok\.io$/i,
    /\.ngrok-free\.app$/i,
    /\.ngrok\.app$/i,
    /\.ngrok\.dev$/i
  ];
  return ngrokPatterns.some(pattern => pattern.test(address));
}

/**
 * Извлечь домен из ngrok URL
 */
function extractNgrokDomain(url) {
  if (!url) return null;
  // Убираем https:// или http://
  let domain = url.replace(/^https?:\/\//, '');
  // Убираем trailing slash
  domain = domain.replace(/\/$/, '');
  // Убираем порт если есть
  domain = domain.split(':')[0];
  return domain;
}

/**
 * Обновить конфигурационный файл с новым IP адресом или ngrok URL
 */
function updateConfigFile(address) {
  try {
    // Читаем текущий файл
    let content = fs.readFileSync(configPath, 'utf8');
    
    // Извлекаем домен из ngrok URL если нужно
    let configAddress = address;
    if (address && (address.startsWith('http://') || address.startsWith('https://'))) {
      configAddress = extractNgrokDomain(address);
    }
    
    // Определяем порт в зависимости от типа адреса
    const isNgrok = isNgrokDomain(configAddress);
    const port = isNgrok ? 80 : 3000;
    
    // Заменяем значение LOCAL_IP_ADDRESS
    // Ищем строку вида: export const LOCAL_IP_ADDRESS = '10.0.2.2';
    const regex = /export const LOCAL_IP_ADDRESS = .*?;/;
    const replacement = `export const LOCAL_IP_ADDRESS = ${configAddress ? `'${configAddress}'` : 'null'};`;
    
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
    } else {
      // Если не нашли, добавляем после комментария
      const commentRegex = /(\/\/ Локальный IP адрес.*?\n)/;
      if (commentRegex.test(content)) {
        content = content.replace(
          commentRegex,
          `$1export const LOCAL_IP_ADDRESS = ${configAddress ? `'${configAddress}'` : 'null'}; // Обновлено автоматически\n`
        );
      }
    }
    
    // Обновляем порт
    const portRegex = /export const API_PORT = \d+;/;
    const portComment = isNgrok ? ' // Ngrok использует стандартный порт' : '';
    const newPortLine = `export const API_PORT = ${port};${portComment}`;
    
    if (portRegex.test(content)) {
      content = content.replace(portRegex, newPortLine);
    }
    
    // Также обновляем значения по умолчанию в функциях getApiBaseUrl и getWebSocketUrl
    if (configAddress && configAddress !== '10.0.2.2') {
      // Обновляем дефолтные значения для реальных устройств
      const defaultIpRegex = /192\.168\.(0|1)\.\d+/g;
      content = content.replace(defaultIpRegex, configAddress.split('.')[0] + '.' + configAddress.split('.')[1] + '.' + (configAddress.split('.')[2] || '0') + '.' + (configAddress.split('.')[3] || '19'));
    }
    
    // Записываем обновленный файл
    fs.writeFileSync(configPath, content, 'utf8');
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка обновления конфигурационного файла:', error.message);
    return false;
  }
}

/**
 * Основная функция
 */
function main() {
  const args = process.argv.slice(2);
  
  let ipAddress = null;
  
  // Обработка аргументов
  if (args.length === 0) {
    console.log('❌ Не указан IP адрес, ngrok URL или режим');
    console.log('\nИспользование:');
    console.log('  node scripts/setup-network-config.js <IP_ADDRESS или NGROK_URL>');
    console.log('  node scripts/setup-network-config.js --emulator');
    console.log('  node scripts/setup-network-config.js --auto');
    console.log('\nПримеры:');
    console.log('  node scripts/setup-network-config.js 192.168.1.100');
    console.log('  node scripts/setup-network-config.js https://abc123.ngrok.io');
    console.log('  node scripts/setup-network-config.js abc123.ngrok.io');
    console.log('  node scripts/setup-network-config.js --emulator');
    console.log('  node scripts/setup-network-config.js --auto');
    process.exit(1);
  }
  
  const arg = args[0];
  let addressType = 'IP адрес';
  
  if (arg === '--emulator') {
    ipAddress = '10.0.2.2';
    console.log('📱 Режим: Android эмулятор');
    addressType = 'Эмулятор';
  } else if (arg === '--auto') {
    ipAddress = getLocalIPAddress();
    if (!ipAddress) {
      console.error('❌ Не удалось определить локальный IP адрес');
      process.exit(1);
    }
    console.log('🔍 Автоматическое определение IP адреса');
    addressType = 'Локальный IP';
  } else {
    // Проверяем, является ли это ngrok URL
    if (arg.includes('ngrok.io') || arg.includes('ngrok-free.app') || arg.includes('ngrok.app') || arg.includes('ngrok.dev')) {
      ipAddress = extractNgrokDomain(arg);
      addressType = 'Ngrok домен';
      console.log('🌐 Режим: Ngrok туннель');
    } else {
      // Проверяем, что это валидный IP адрес
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(arg)) {
        console.error('❌ Неверный формат IP адреса или ngrok URL:', arg);
        console.log('\n💡 Убедитесь, что указали:');
        console.log('   - IP адрес: 192.168.1.100');
        console.log('   - Ngrok URL: https://abc123.ngrok.io или abc123.ngrok.io');
        process.exit(1);
      }
      ipAddress = arg;
      addressType = 'Локальный IP';
      console.log('📝 Ручная настройка IP адреса');
    }
  }
  
  const isNgrok = isNgrokDomain(ipAddress);
  const port = isNgrok ? 80 : 3000;
  
  console.log(`\n📍 ${addressType}: ${ipAddress}`);
  console.log(`🔌 Порт: ${port}`);
  console.log(`📁 Файл: ${configPath}`);
  
  // Обновляем конфигурационный файл
  if (updateConfigFile(ipAddress)) {
    console.log('✅ Конфигурация успешно обновлена!');
    console.log('\n💡 Следующие шаги:');
    if (isNgrok) {
      console.log('1. Убедитесь, что backend запущен с ngrok: npm run start:ngrok');
      console.log('2. Перезапустите приложение');
      console.log('3. Тестируйте с любого устройства из любой сети!');
    } else {
      console.log('1. Перезапустите приложение');
      console.log('2. Убедитесь, что backend запущен на этом IP адресе');
      console.log('3. Проверьте, что устройства в одной Wi-Fi сети');
    }
  } else {
    console.error('❌ Не удалось обновить конфигурацию');
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  main();
}

module.exports = { updateConfigFile, getLocalIPAddress };

