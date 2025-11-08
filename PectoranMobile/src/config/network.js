/**
 * Конфигурация сети для мобильного приложения
 * Настройки для подключения к backend серверу
 * 
 * Для тестирования на реальных устройствах:
 * 1. Локальная сеть: используйте локальный IP адрес (например, 192.168.0.19)
 * 2. Ngrok туннель: используйте ngrok домен (например, abc123.ngrok.io)
 * 3. Android эмулятор: используйте специальный адрес 10.0.2.2
 * 4. Или используйте скрипт: node scripts/setup-network-config.js <IP или ngrok URL>
 */

// Локальный IP адрес или ngrok домен
// Для Android эмулятора: '10.0.2.2'
// Для локальной сети: '192.168.0.19' (ваш локальный IP)
// Для ngrok: 'abc123.ngrok.io' (ngrok домен, без https://)
export const LOCAL_IP_ADDRESS = '1fbe91db4bfc.ngrok-free.app'; // Ngrok tunnel // Ngrok tunnel // Ngrok tunnel // Ngrok tunnel // Ngrok tunnel // null = автоопределение

// Порт backend сервера
// Для ngrok используйте 80 (стандартный HTTP порт)
// Для локальной сети используйте 3000 (порт backend сервера)
export const API_PORT = 80; // Ngrok использует стандартный порт // Ngrok использует стандартный порт // Ngrok использует стандартный порт // Ngrok использует стандартный порт // Ngrok использует стандартный порт

// Режим разработки
export const IS_DEVELOPMENT = __DEV__ || false;

/**
 * Проверка, является ли адрес ngrok доменом
 * @param {string} address - Адрес для проверки
 * @returns {boolean} true если это ngrok домен
 */
export function isNgrokDomain(address) {
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
 * Определение типа устройства (эмулятор или реальное устройство)
 * @returns {boolean} true если эмулятор, false если реальное устройство
 */
export function isEmulator() {
  // В React Native можно определить эмулятор через платформу
  // Для простоты используем проверку через конфигурацию
  // В реальном приложении можно использовать react-native-device-info
  return LOCAL_IP_ADDRESS === '10.0.2.2';
}

/**
 * Получить базовый URL API
 * @returns {string} Базовый URL API
 */
export function getApiBaseUrl() {
  // Если это ngrok домен
  if (LOCAL_IP_ADDRESS && isNgrokDomain(LOCAL_IP_ADDRESS)) {
    // Ngrok использует HTTPS и стандартный порт 80/443
    const port = API_PORT === 80 || API_PORT === 443 ? '' : `:${API_PORT}`;
    return `https://${LOCAL_IP_ADDRESS}${port}/api`;
  }
  
  // Если указан конкретный IP (локальная сеть)
  if (LOCAL_IP_ADDRESS && LOCAL_IP_ADDRESS !== '10.0.2.2') {
    return `http://${LOCAL_IP_ADDRESS}:${API_PORT}/api`;
  }
  
  // Для эмулятора Android используем специальный адрес
  if (LOCAL_IP_ADDRESS === '10.0.2.2') {
    return `http://10.0.2.2:${API_PORT}/api`;
  }
  
  // Для production используем production URL
  if (!IS_DEVELOPMENT) {
    return 'https://your-production-api.com/api';
  }
  
  // По умолчанию для разработки на реальных устройствах
  // Пользователь должен установить LOCAL_IP_ADDRESS
  return `http://192.168.0.19:${API_PORT}/api`; // Замените на ваш IP
}

/**
 * Получить WebSocket URL
 * @returns {string} WebSocket URL
 */
export function getWebSocketUrl() {
  // Если это ngrok домен
  if (LOCAL_IP_ADDRESS && isNgrokDomain(LOCAL_IP_ADDRESS)) {
    // Ngrok использует WSS (secure WebSocket) и стандартный порт
    const port = API_PORT === 80 || API_PORT === 443 ? '' : `:${API_PORT}`;
    return `wss://${LOCAL_IP_ADDRESS}${port}`;
  }
  
  // Если указан конкретный IP (локальная сеть)
  if (LOCAL_IP_ADDRESS && LOCAL_IP_ADDRESS !== '10.0.2.2') {
    return `ws://${LOCAL_IP_ADDRESS}:${API_PORT}`;
  }
  
  // Для эмулятора Android используем специальный адрес
  if (LOCAL_IP_ADDRESS === '10.0.2.2') {
    return `ws://10.0.2.2:${API_PORT}`;
  }
  
  // Для production используем production URL
  if (!IS_DEVELOPMENT) {
    return 'wss://your-production-api.com';
  }
  
  // По умолчанию для разработки на реальных устройствах
  return `ws://192.168.0.19:${API_PORT}`; // Замените на ваш IP
}

/**
 * Получить информацию о текущей конфигурации сети
 * @returns {object} Информация о конфигурации
 */
export function getNetworkInfo() {
  return {
    localIP: LOCAL_IP_ADDRESS,
    port: API_PORT,
    apiUrl: getApiBaseUrl(),
    wsUrl: getWebSocketUrl(),
    isEmulator: isEmulator(),
    isDevelopment: IS_DEVELOPMENT
  };
}

export default {
  LOCAL_IP_ADDRESS,
  API_PORT,
  IS_DEVELOPMENT,
  isEmulator,
  getApiBaseUrl,
  getWebSocketUrl,
  getNetworkInfo
};

