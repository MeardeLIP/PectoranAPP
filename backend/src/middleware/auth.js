/**
 * Middleware для аутентификации и авторизации
 * Проверяет JWT токены и права доступа пользователей
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Middleware для проверки JWT токена
 * @param {Object} req - Запрос
 * @param {Object} res - Ответ
 * @param {Function} next - Следующий middleware
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен доступа не предоставлен'
      });
    }

    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Получаем пользователя из БД
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден или неактивен'
      });
    }

    // Добавляем информацию о пользователе в запрос
    req.user = user;
    next();

  } catch (error) {
    logger.logError(error, { 
      middleware: 'authenticateToken',
      path: req.path,
      method: req.method 
    });

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Недействительный токен'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Токен истек'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Ошибка аутентификации'
    });
  }
};

/**
 * Middleware для проверки роли пользователя
 * @param {Array<string>} allowedRoles - Разрешенные роли
 * @returns {Function} - Middleware функция
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.logUserAction(req.user.id, 'unauthorized_access_attempt', {
        path: req.path,
        method: req.method,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });

      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав доступа'
      });
    }

    next();
  };
};

/**
 * Middleware для быстрой аутентификации официанта/повара по номеру
 * @param {Object} req - Запрос
 * @param {Object} res - Ответ
 * @param {Function} next - Следующий middleware
 */
const authenticateByNumber = async (req, res, next) => {
  try {
    const { waiter_number, role } = req.body;

    if (!waiter_number || !role) {
      return res.status(400).json({
        success: false,
        message: 'Номер и роль обязательны'
      });
    }

    // Проверяем, что роль соответствует ожидаемой
    const allowedRoles = ['waiter', 'cook'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Недопустимая роль для входа по номеру'
      });
    }

    let user = null;

    // Если пришла строка не только из цифр — пробуем считать это username
    if (typeof waiter_number === 'string' && !/^\d+$/.test(waiter_number)) {
      user = await User.findOne({ where: { username: waiter_number, role, is_active: true } });
    } else {
      // Иначе ищем по числовому номеру
      const numberVal = typeof waiter_number === 'string' ? parseInt(waiter_number, 10) : waiter_number;
      user = await User.findOne({
        where: {
          waiter_number: numberVal,
          role: role,
          is_active: true
        }
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден или неактивен'
      });
    }

    // Обновляем время последнего входа
    await user.updateLastLogin();

    req.user = user;
    next();

  } catch (error) {
    logger.logError(error, { 
      middleware: 'authenticateByNumber',
      path: req.path,
      method: req.method 
    });

    return res.status(500).json({
      success: false,
      message: 'Ошибка аутентификации'
    });
  }
};

/**
 * Middleware для проверки прав на заказ
 * Официант может работать только со своими заказами
 * @param {Object} req - Запрос
 * @param {Object} res - Ответ
 * @param {Function} next - Следующий middleware
 */
const checkOrderAccess = async (req, res, next) => {
  try {
    // Поддерживаем оба варианта имени параметра для совместимости
    const orderId = req.params.id || req.params.orderId;
    const { Order } = require('../models');

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'ID заказа не указан'
      });
    }

    // Админы и директора имеют доступ ко всем заказам
    if (['admin', 'director'].includes(req.user.role)) {
      return next();
    }

    // Для официантов проверяем принадлежность заказа
    if (req.user.role === 'waiter') {
      const order = await Order.findByPk(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Заказ не найден'
        });
      }

      if (order.waiter_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Нет доступа к этому заказу'
        });
      }
    }

    // Повары имеют доступ ко всем заказам
    if (req.user.role === 'cook') {
      return next();
    }

    next();

  } catch (error) {
    logger.logError(error, { 
      middleware: 'checkOrderAccess',
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      params: req.params
    });

    return res.status(500).json({
      success: false,
      message: 'Ошибка проверки доступа к заказу'
    });
  }
};

/**
 * Middleware для логирования действий пользователей
 * @param {Object} req - Запрос
 * @param {Object} res - Ответ
 * @param {Function} next - Следующий middleware
 */
const logUserAction = (action) => {
  return (req, res, next) => {
    if (req.user) {
      logger.logUserAction(req.user.id, action, {
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
      });
    }
    next();
  };
};

/**
 * Middleware для проверки активности пользователя
 * @param {Object} req - Запрос
 * @param {Object} res - Ответ
 * @param {Function} next - Следующий middleware
 */
const checkUserActive = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Пользователь не аутентифицирован'
    });
  }

  if (!req.user.is_active) {
    return res.status(403).json({
      success: false,
      message: 'Аккаунт пользователя деактивирован'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  authenticateByNumber,
  checkOrderAccess,
  logUserAction,
  checkUserActive
};
