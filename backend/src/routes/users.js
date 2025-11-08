/**
 * Маршруты для управления пользователями
 * CRUD операции для пользователей системы
 */

const express = require('express');
const { User } = require('../models');
const { authenticateToken, requireRole, logUserAction } = require('../middleware/auth');
const { validate, createUserSchema } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/users
 * Получение списка пользователей (только для директора)
 */
router.get('/', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('view_users'),
  asyncHandler(async (req, res) => {
    const { role, is_active, limit = 50, offset = 0 } = req.query;
    
    let whereClause = {};
    
    if (role) {
      whereClause.role = role;
    }
    
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        users: users.rows.map(user => user.toPublicJSON()),
        total: users.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  })
);

/**
 * GET /api/users/roles
 * Получение списка ролей и их описаний (только для директора)
 */
router.get('/roles', 
  authenticateToken, 
  requireRole(['director']),
  asyncHandler(async (req, res) => {
    const roles = [
      {
        value: 'waiter',
        label: 'Официант',
        description: 'Принимает заказы, работает с клиентами',
        permissions: ['create_orders', 'view_own_orders', 'update_order_status']
      },
      {
        value: 'cook',
        label: 'Повар',
        description: 'Готовит блюда, управляет статусами заказов',
        permissions: ['view_orders', 'update_order_status']
      },
      {
        value: 'admin',
        label: 'Администратор',
        description: 'Управляет оплатой заказов',
        permissions: ['pay_orders']
      },
      {
        value: 'director',
        label: 'Директор',
        description: 'Полный доступ ко всем функциям системы',
        permissions: ['manage_users', 'manage_menu', 'view_stats', 'view_all_orders']
      }
    ];

    res.json({
      success: true,
      data: { roles }
    });
  })
);


/**
 * GET /api/users/:id
 * Получение информации о конкретном пользователе (только для директора)
 */
router.get('/:id', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('view_user_details'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    res.json({
      success: true,
      data: { user: user.toPublicJSON() }
    });
  })
);



/**
 * PUT /api/users/:id/activate
 * Активация пользователя (только для директора)
 */
router.put('/:id/activate', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('activate_user'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    if (user.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь уже активен'
      });
    }

    await user.update({ is_active: true });

    logger.logUserAction(req.user.id, 'user_activated', {
      targetUserId: user.id,
      targetUserRole: user.role,
      targetUserUsername: user.username
    });

    res.json({
      success: true,
      message: 'Пользователь активирован успешно',
      data: { user: user.toPublicJSON() }
    });
  })
);

/**
 * PUT /api/users/:id/deactivate
 * Деактивация пользователя (только для директора)
 */
router.put('/:id/deactivate', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('deactivate_user'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    if (!user.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь уже деактивирован'
      });
    }

    // Нельзя деактивировать самого себя
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя деактивировать самого себя'
      });
    }

    await user.update({ is_active: false });

    logger.logUserAction(req.user.id, 'user_deactivated', {
      targetUserId: user.id,
      targetUserRole: user.role,
      targetUserUsername: user.username
    });

    res.json({
      success: true,
      message: 'Пользователь деактивирован успешно',
      data: { user: user.toPublicJSON() }
    });
  })
);

/**
 * GET /api/users/role/:role
 * Получение пользователей по роли (только для директора)
 */
router.get('/role/:role', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('view_users_by_role'),
  asyncHandler(async (req, res) => {
    const { role } = req.params;
    
    if (!['waiter', 'cook', 'admin', 'director'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Недопустимая роль'
      });
    }

    const users = await User.findByRole(role);

    res.json({
      success: true,
      data: { 
        users: users.map(user => user.toPublicJSON()),
        role,
        count: users.length
      }
    });
  })
);

/**
 * PUT /api/users/fcm-token
 * Сохранение FCM токена для push-уведомлений
 */
router.put('/fcm-token', 
  authenticateToken, 
  asyncHandler(async (req, res) => {
    const { fcm_token } = req.body;
    const userId = req.user.id;

    if (!fcm_token) {
      return res.status(400).json({
        success: false,
        message: 'FCM токен обязателен'
      });
    }

    await User.update(
      { fcm_token },
      { where: { id: userId } }
    );

    logger.info(`FCM токен обновлен для пользователя ${userId}`);

    res.json({
      success: true,
      message: 'FCM токен сохранен'
    });
  })
);

// ==================== CRUD для пользователей ====================

/**
 * POST /api/users
 * Создание нового пользователя (только для директора)
 */
router.post('/', 
  authenticateToken, 
  requireRole(['director']),
  validate(createUserSchema),
  logUserAction('create_user'),
  asyncHandler(async (req, res) => {
    const { 
      username, 
      password, 
      role, 
      waiter_number, 
      full_name, 
      phone, 
      email 
    } = req.body;

    // Проверяем уникальность username
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким именем уже существует'
      });
    }

    // Проверяем уникальность waiter_number для официантов и поваров
    if (['waiter', 'cook'].includes(role) && waiter_number) {
      const existingWaiter = await User.findOne({ where: { waiter_number } });
      if (existingWaiter) {
        return res.status(400).json({
          success: false,
          message: 'Пользователь с таким номером уже существует'
        });
      }
    }

    const userData = {
      username,
      role,
      waiter_number: ['waiter', 'cook'].includes(role) ? waiter_number : null,
      full_name,
      phone,
      email,
      is_active: true,
      created_by: req.user.id
    };

    // Хешируем пароль если он предоставлен
    if (password) {
      const bcrypt = require('bcryptjs');
      userData.password_hash = await bcrypt.hash(password, 12);
    }

    const user = await User.create(userData);

    logger.info(`Создан пользователь: ${user.username} (${user.role})`);

    res.status(201).json({
      success: true,
      message: 'Пользователь создан успешно',
      data: { user: user.toPublicJSON() }
    });
  })
);

/**
 * PUT /api/users/:id
 * Обновление пользователя (только для директора)
 */
router.put('/:id', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('update_user'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Проверяем уникальность username если он меняется
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await User.findOne({ 
        where: { 
          username: updateData.username,
          id: { [require('sequelize').Op.ne]: id }
        } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Пользователь с таким именем уже существует'
        });
      }
    }

    // Проверяем уникальность waiter_number если он меняется
    if (updateData.waiter_number && updateData.waiter_number !== user.waiter_number) {
      const existingWaiter = await User.findOne({ 
        where: { 
          waiter_number: updateData.waiter_number,
          id: { [require('sequelize').Op.ne]: id }
        } 
      });
      if (existingWaiter) {
        return res.status(400).json({
          success: false,
          message: 'Пользователь с таким номером уже существует'
        });
      }
    }

    // Хешируем новый пароль если он предоставлен
    if (updateData.password) {
      const bcrypt = require('bcryptjs');
      updateData.password_hash = await bcrypt.hash(updateData.password, 12);
      delete updateData.password; // Удаляем plain text пароль
    }

    await user.update(updateData);

    logger.info(`Обновлен пользователь: ${user.username}`);

    res.json({
      success: true,
      message: 'Пользователь обновлен успешно',
      data: { user: user.toPublicJSON() }
    });
  })
);

/**
 * DELETE /api/users/:id
 * Удаление пользователя (только для директора)
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('delete_user'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Нельзя удалить самого себя
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя удалить самого себя'
      });
    }

    await user.destroy();

    logger.info(`Удален пользователь: ${user.username}`);

    res.json({
      success: true,
      message: 'Пользователь удален успешно'
    });
  })
);

/**
 * PUT /api/users/:id/password
 * Смена пароля пользователя (только для директора)
 */
router.put('/:id/password', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('change_user_password'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Пароль должен содержать минимум 6 символов'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(password, 12);

    await user.update({ password_hash });

    logger.info(`Сменен пароль пользователя: ${user.username}`);

    res.json({
      success: true,
      message: 'Пароль изменен успешно'
    });
  })
);

module.exports = router;
