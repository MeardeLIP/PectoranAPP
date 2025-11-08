/**
 * Маршруты аутентификации
 * Обработка входа администраторов, официантов и поваров
 */

const express = require('express');
const { User } = require('../models');
const { generateTokenPair, generateQuickLoginToken } = require('../utils/jwt');
const { authenticateToken, authenticateByNumber } = require('../middleware/auth');
const { validate, adminLoginSchema, directorLoginSchema, quickLoginSchema } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/auth/login
 * Вход директора по логину и паролю
 */
router.post('/login', validate(directorLoginSchema), asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Поиск пользователя
  const user = await User.findByUsername(username);
  
  if (!user) {
    logger.logUserAction(null, 'login_failed', { 
      username, 
      reason: 'user_not_found' 
    });
    
    return res.status(401).json({
      success: false,
      message: 'Неверные учетные данные'
    });
  }

  // Проверяем, что это директор
  if (user.role !== 'director') {
    logger.logUserAction(user.id, 'login_failed', { 
      username, 
      reason: 'invalid_role',
      actual_role: user.role
    });
    
    return res.status(403).json({
      success: false,
      message: 'Доступ запрещен. Этот endpoint предназначен только для директоров'
    });
  }

  // Проверка пароля
  const isPasswordValid = await user.checkPassword(password);
  
  if (!isPasswordValid) {
    logger.logUserAction(user.id, 'login_failed', { 
      username, 
      reason: 'invalid_password' 
    });
    
    return res.status(401).json({
      success: false,
      message: 'Неверные учетные данные'
    });
  }

  // Обновляем время последнего входа
  await user.updateLastLogin();

  // Генерируем токены
  const tokens = generateTokenPair(user);

  logger.logUserAction(user.id, 'login_success', { 
    username, 
    role: user.role 
  });

  res.json({
    success: true,
    message: 'Вход выполнен успешно',
    data: {
      user: user.toPublicJSON(),
      ...tokens
    }
  });
}));

/**
 * POST /api/auth/admin-login
 * Вход администратора только по логину (без пароля)
 */
router.post('/admin-login', validate(adminLoginSchema), asyncHandler(async (req, res) => {
  const { username } = req.body;

  // Поиск пользователя
  const user = await User.findByUsername(username);
  
  if (!user) {
    logger.logUserAction(null, 'admin_login_failed', { 
      username, 
      reason: 'user_not_found' 
    });
    
    return res.status(401).json({
      success: false,
      message: 'Пользователь не найден'
    });
  }

  // Проверяем, что это администратор
  if (user.role !== 'admin') {
    logger.logUserAction(user.id, 'admin_login_failed', { 
      username, 
      reason: 'invalid_role',
      actual_role: user.role
    });
    
    return res.status(403).json({
      success: false,
      message: 'Доступ запрещен. Этот endpoint предназначен только для администраторов'
    });
  }

  // Проверяем, что пользователь активен
  if (!user.is_active) {
    logger.logUserAction(user.id, 'admin_login_failed', { 
      username, 
      reason: 'user_inactive' 
    });
    
    return res.status(403).json({
      success: false,
      message: 'Пользователь неактивен'
    });
  }

  // Обновляем время последнего входа
  await user.updateLastLogin();

  // Генерируем токены
  const tokens = generateTokenPair(user);

  logger.logUserAction(user.id, 'admin_login_success', { 
    username, 
    role: user.role 
  });

  res.json({
    success: true,
    message: 'Вход выполнен успешно',
    data: {
      user: user.toPublicJSON(),
      ...tokens
    }
  });
}));

/**
 * POST /api/auth/waiter-login
 * Вход официанта по логину (без пароля)
 */
router.post('/waiter-login', validate(adminLoginSchema), asyncHandler(async (req, res) => {
  const { username } = req.body;

  // Поиск пользователя
  const user = await User.findByUsername(username);
  
  if (!user) {
    logger.logUserAction(null, 'waiter_login_failed', { 
      username, 
      reason: 'user_not_found' 
    });
    
    return res.status(401).json({
      success: false,
      message: 'Пользователь не найден'
    });
  }

  // Проверяем, что это официант
  if (user.role !== 'waiter') {
    logger.logUserAction(user.id, 'waiter_login_failed', { 
      username, 
      reason: 'invalid_role',
      actual_role: user.role
    });
    
    return res.status(403).json({
      success: false,
      message: 'Доступ запрещен. Этот endpoint предназначен только для официантов'
    });
  }

  // Проверяем, что пользователь активен
  if (!user.is_active) {
    logger.logUserAction(user.id, 'waiter_login_failed', { 
      username, 
      reason: 'user_inactive' 
    });
    
    return res.status(403).json({
      success: false,
      message: 'Пользователь неактивен'
    });
  }

  // Обновляем время последнего входа
  await user.updateLastLogin();

  // Генерируем токены
  const tokens = generateTokenPair(user);

  logger.logUserAction(user.id, 'waiter_login_success', { 
    username, 
    role: user.role 
  });

  res.json({
    success: true,
    message: 'Вход выполнен успешно',
    data: {
      user: user.toPublicJSON(),
      ...tokens
    }
  });
}));

/**
 * POST /api/auth/cook-login
 * Вход повара по логину (без пароля)
 */
router.post('/cook-login', validate(adminLoginSchema), asyncHandler(async (req, res) => {
  const { username } = req.body;

  // Поиск пользователя
  const user = await User.findByUsername(username);
  
  if (!user) {
    logger.logUserAction(null, 'cook_login_failed', { 
      username, 
      reason: 'user_not_found' 
    });
    
    return res.status(401).json({
      success: false,
      message: 'Пользователь не найден'
    });
  }

  // Проверяем, что это повар
  if (user.role !== 'cook') {
    logger.logUserAction(user.id, 'cook_login_failed', { 
      username, 
      reason: 'invalid_role',
      actual_role: user.role
    });
    
    return res.status(403).json({
      success: false,
      message: 'Доступ запрещен. Этот endpoint предназначен только для поваров'
    });
  }

  // Проверяем, что пользователь активен
  if (!user.is_active) {
    logger.logUserAction(user.id, 'cook_login_failed', { 
      username, 
      reason: 'user_inactive' 
    });
    
    return res.status(403).json({
      success: false,
      message: 'Пользователь неактивен'
    });
  }

  // Обновляем время последнего входа
  await user.updateLastLogin();

  // Генерируем токены
  const tokens = generateTokenPair(user);

  logger.logUserAction(user.id, 'cook_login_success', { 
    username, 
    role: user.role 
  });

  res.json({
    success: true,
    message: 'Вход выполнен успешно',
    data: {
      user: user.toPublicJSON(),
      ...tokens
    }
  });
}));

/**
 * POST /api/auth/logout
 * Выход из системы
 */
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  const user = req.user;

  logger.logUserAction(user.id, 'logout', { 
    username: user.username 
  });

  res.json({
    success: true,
    message: 'Выход выполнен успешно'
  });
}));

/**
 * GET /api/auth/me
 * Получение информации о текущем пользователе
 */
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    data: {
      user: user.toPublicJSON()
    }
  });
}));

/**
 * POST /api/auth/refresh
 * Обновление токена доступа
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh токен не предоставлен'
    });
  }

  try {
    // Проверяем refresh токен
    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(refreshToken);

    // Получаем пользователя
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден или неактивен'
      });
    }

    // Генерируем новую пару токенов
    const tokens = generateTokenPair(user);

    logger.logUserAction(user.id, 'token_refresh', { 
      username: user.username 
    });

    res.json({
      success: true,
      message: 'Токен обновлен успешно',
      data: tokens
    });

  } catch (error) {
    logger.logError(error, { 
      endpoint: '/api/auth/refresh' 
    });

    return res.status(401).json({
      success: false,
      message: 'Недействительный refresh токен'
    });
  }
}));

/**
 * POST /api/auth/verify
 * Проверка валидности токена
 */
router.post('/verify', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Токен не предоставлен'
    });
  }

  try {
    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(token);

    // Получаем пользователя
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден или неактивен'
      });
    }

    res.json({
      success: true,
      message: 'Токен действителен',
      data: {
        user: user.toPublicJSON(),
        valid: true
      }
    });

  } catch (error) {
    res.json({
      success: false,
      message: 'Токен недействителен',
      data: {
        valid: false
      }
    });
  }
}));

module.exports = router;
