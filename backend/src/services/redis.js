/**
 * Сервис для работы с Redis
 * Используется для кэширования и сессий
 */

const redis = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

/**
 * Подключение к Redis
 */
async function connectRedis() {
  try {
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('❌ Redis сервер отказал в подключении');
          return new Error('Redis сервер недоступен');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('❌ Превышено время ожидания подключения к Redis');
          return new Error('Время ожидания подключения к Redis истекло');
        }
        if (options.attempt > 10) {
          logger.error('❌ Превышено количество попыток подключения к Redis');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('connect', () => {
      logger.info('✅ Подключение к Redis установлено');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis готов к работе');
    });

    redisClient.on('error', (err) => {
      logger.error('❌ Ошибка Redis:', err);
    });

    redisClient.on('end', () => {
      logger.warn('⚠️ Соединение с Redis закрыто');
    });

    await redisClient.connect();
    
  } catch (error) {
    logger.error('❌ Ошибка подключения к Redis:', error);
    throw error;
  }
}

/**
 * Закрытие соединения с Redis
 */
async function closeRedis() {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('✅ Соединение с Redis закрыто');
    }
  } catch (error) {
    logger.error('❌ Ошибка при закрытии Redis:', error);
    throw error;
  }
}

/**
 * Получение значения из кэша
 * @param {string} key - Ключ
 * @returns {any} - Значение или null
 */
async function get(key) {
  try {
    if (!redisClient) {
      logger.warn('⚠️ Redis клиент не инициализирован');
      return null;
    }
    
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('❌ Ошибка получения из Redis:', error);
    return null;
  }
}

/**
 * Сохранение значения в кэш
 * @param {string} key - Ключ
 * @param {any} value - Значение
 * @param {number} ttl - Время жизни в секундах (опционально)
 * @returns {boolean} - Результат операции
 */
async function set(key, value, ttl = null) {
  try {
    if (!redisClient) {
      logger.warn('⚠️ Redis клиент не инициализирован');
      return false;
    }
    
    const serializedValue = JSON.stringify(value);
    
    if (ttl) {
      await redisClient.setEx(key, ttl, serializedValue);
    } else {
      await redisClient.set(key, serializedValue);
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Ошибка сохранения в Redis:', error);
    return false;
  }
}

/**
 * Удаление значения из кэша
 * @param {string} key - Ключ
 * @returns {boolean} - Результат операции
 */
async function del(key) {
  try {
    if (!redisClient) {
      logger.warn('⚠️ Redis клиент не инициализирован');
      return false;
    }
    
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('❌ Ошибка удаления из Redis:', error);
    return false;
  }
}

/**
 * Проверка существования ключа
 * @param {string} key - Ключ
 * @returns {boolean} - Существует ли ключ
 */
async function exists(key) {
  try {
    if (!redisClient) {
      logger.warn('⚠️ Redis клиент не инициализирован');
      return false;
    }
    
    const result = await redisClient.exists(key);
    return result === 1;
  } catch (error) {
    logger.error('❌ Ошибка проверки существования ключа в Redis:', error);
    return false;
  }
}

/**
 * Установка времени жизни ключа
 * @param {string} key - Ключ
 * @param {number} ttl - Время жизни в секундах
 * @returns {boolean} - Результат операции
 */
async function expire(key, ttl) {
  try {
    if (!redisClient) {
      logger.warn('⚠️ Redis клиент не инициализирован');
      return false;
    }
    
    await redisClient.expire(key, ttl);
    return true;
  } catch (error) {
    logger.error('❌ Ошибка установки TTL в Redis:', error);
    return false;
  }
}

/**
 * Получение всех ключей по паттерну
 * @param {string} pattern - Паттерн поиска
 * @returns {Array<string>} - Массив ключей
 */
async function keys(pattern) {
  try {
    if (!redisClient) {
      logger.warn('⚠️ Redis клиент не инициализирован');
      return [];
    }
    
    return await redisClient.keys(pattern);
  } catch (error) {
    logger.error('❌ Ошибка поиска ключей в Redis:', error);
    return [];
  }
}

/**
 * Кэширование меню
 * @param {Array} menuItems - Позиции меню
 * @returns {boolean} - Результат операции
 */
async function cacheMenu(menuItems) {
  return await set('menu:active', menuItems, 3600); // Кэш на 1 час
}

/**
 * Получение кэшированного меню
 * @returns {Array|null} - Кэшированное меню или null
 */
async function getCachedMenu() {
  return await get('menu:active');
}

/**
 * Кэширование статистики
 * @param {string} key - Ключ статистики
 * @param {any} data - Данные статистики
 * @param {number} ttl - Время жизни в секундах
 * @returns {boolean} - Результат операции
 */
async function cacheStats(key, data, ttl = 300) { // По умолчанию 5 минут
  return await set(`stats:${key}`, data, ttl);
}

/**
 * Получение кэшированной статистики
 * @param {string} key - Ключ статистики
 * @returns {any} - Кэшированная статистика или null
 */
async function getCachedStats(key) {
  return await get(`stats:${key}`);
}

/**
 * Очистка всех кэшей
 * @returns {boolean} - Результат операции
 */
async function clearAllCaches() {
  try {
    if (!redisClient) {
      logger.warn('⚠️ Redis клиент не инициализирован');
      return false;
    }
    
    const keysToDelete = await keys('*');
    if (keysToDelete.length > 0) {
      await redisClient.del(keysToDelete);
    }
    
    logger.info('✅ Все кэши очищены');
    return true;
  } catch (error) {
    logger.error('❌ Ошибка очистки кэшей:', error);
    return false;
  }
}

module.exports = {
  connectRedis,
  closeRedis,
  get,
  set,
  del,
  exists,
  expire,
  keys,
  cacheMenu,
  getCachedMenu,
  cacheStats,
  getCachedStats,
  clearAllCaches
};
