/**
 * Утилиты для работы с JWT токенами
 * Генерация, проверка и обновление токенов доступа
 */

const jwt = require('jsonwebtoken');
const logger = require('./logger');

/**
 * Генерация JWT токена доступа
 * @param {Object} payload - Данные для токена
 * @param {string} expiresIn - Время жизни токена
 * @returns {string} - JWT токен
 */
function generateAccessToken(payload, expiresIn = process.env.JWT_EXPIRES_IN || '24h') {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  } catch (error) {
    logger.logError(error, { 
      function: 'generateAccessToken',
      payload 
    });
    throw new Error('Ошибка генерации токена доступа');
  }
}

/**
 * Генерация JWT refresh токена
 * @param {Object} payload - Данные для токена
 * @param {string} expiresIn - Время жизни токена
 * @returns {string} - JWT refresh токен
 */
function generateRefreshToken(payload, expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d') {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  } catch (error) {
    logger.logError(error, { 
      function: 'generateRefreshToken',
      payload 
    });
    throw new Error('Ошибка генерации refresh токена');
  }
}

/**
 * Проверка JWT токена
 * @param {string} token - JWT токен
 * @returns {Object} - Декодированные данные токена
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.logError(error, { 
      function: 'verifyToken',
      token: token.substring(0, 20) + '...' // Логируем только начало токена
    });
    throw error;
  }
}

/**
 * Декодирование JWT токена без проверки подписи
 * @param {string} token - JWT токен
 * @returns {Object} - Декодированные данные токена
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.logError(error, { 
      function: 'decodeToken',
      token: token.substring(0, 20) + '...'
    });
    throw new Error('Ошибка декодирования токена');
  }
}

/**
 * Проверка истечения токена
 * @param {string} token - JWT токен
 * @returns {boolean} - Истек ли токен
 */
function isTokenExpired(token) {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    logger.logError(error, { 
      function: 'isTokenExpired',
      token: token.substring(0, 20) + '...'
    });
    return true;
  }
}

/**
 * Получение времени истечения токена
 * @param {string} token - JWT токен
 * @returns {Date|null} - Время истечения или null
 */
function getTokenExpiration(token) {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    logger.logError(error, { 
      function: 'getTokenExpiration',
      token: token.substring(0, 20) + '...'
    });
    return null;
  }
}

/**
 * Генерация пары токенов (access + refresh)
 * @param {Object} user - Данные пользователя
 * @returns {Object} - Объект с токенами
 */
function generateTokenPair(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    waiterNumber: user.waiter_number
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ userId: user.id });

  return {
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  };
}

/**
 * Извлечение токена из заголовка Authorization
 * @param {string} authHeader - Заголовок Authorization
 * @returns {string|null} - Токен или null
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Проверка валидности токена и получение пользователя
 * @param {string} token - JWT токен
 * @returns {Object} - Данные пользователя из токена
 */
function validateTokenAndGetUser(token) {
  try {
    const decoded = verifyToken(token);
    
    // Проверяем обязательные поля
    if (!decoded.userId || !decoded.role) {
      throw new Error('Неполные данные в токене');
    }

    return {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      waiterNumber: decoded.waiterNumber
    };
  } catch (error) {
    logger.logError(error, { 
      function: 'validateTokenAndGetUser',
      token: token.substring(0, 20) + '...'
    });
    throw error;
  }
}

/**
 * Создание токена для быстрого входа (официант/повар)
 * @param {Object} user - Данные пользователя
 * @returns {string} - JWT токен
 */
function generateQuickLoginToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    waiterNumber: user.waiter_number,
    type: 'quick_login'
  };

  return generateAccessToken(payload, '8h'); // Токен на 8 часов для смены
}

/**
 * Проверка типа токена
 * @param {string} token - JWT токен
 * @returns {string} - Тип токена ('access', 'refresh', 'quick_login')
 */
function getTokenType(token) {
  try {
    const decoded = decodeToken(token);
    return decoded.type || 'access';
  } catch (error) {
    return 'invalid';
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  generateTokenPair,
  extractTokenFromHeader,
  validateTokenAndGetUser,
  generateQuickLoginToken,
  getTokenType
};
