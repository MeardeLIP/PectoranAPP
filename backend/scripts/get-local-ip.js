/**
 * Скрипт для получения локального IP адреса
 * Используется для настройки мобильного приложения для тестирования на реальных устройствах
 */

const os = require('os');

/**
 * Получить локальный IP адрес компьютера в сети
 * @returns {string} Локальный IP адрес или 'localhost' если не найден
 */
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  // Список приоритетных интерфейсов (обычно Wi-Fi или Ethernet)
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
      // Игнорируем внутренние и не-IPv4 адреса
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  
  return 'localhost';
}

// Основная функция
function main() {
  const localIP = getLocalIPAddress();
  const port = process.env.PORT || 3000;
  
  console.log('\n📡 Сетевая информация для тестирования на реальных устройствах:');
  console.log('═'.repeat(60));
  console.log(`📍 Локальный IP адрес: ${localIP}`);
  console.log(`🔌 Порт: ${port}`);
  console.log(`📱 API URL: http://${localIP}:${port}/api`);
  console.log(`🔗 WebSocket URL: ws://${localIP}:${port}`);
  console.log('═'.repeat(60));
  console.log('\n💡 Инструкция:');
  console.log('1. Убедитесь, что компьютер и телефоны в одной Wi-Fi сети');
  console.log('2. Используйте IP адрес выше для настройки приложения');
  console.log('3. Проверьте, что firewall не блокирует порт', port);
  console.log('\n');
  
  // Возвращаем IP для использования в других скриптах
  return localIP;
}

// Если скрипт запущен напрямую
if (require.main === module) {
  main();
}

module.exports = { getLocalIPAddress };

