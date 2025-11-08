/**
 * Сервис WebSocket для real-time коммуникации
 * Обрабатывает события заказов и уведомления
 */

const logger = require('../utils/logger');
const { Order, User } = require('../models');

let io = null;

/**
 * Настройка Socket.IO сервера
 * @param {Server} socketIO - Экземпляр Socket.IO сервера
 */
function setupSocketIO(socketIO) {
  io = socketIO;
  
  io.on('connection', (socket) => {
    logger.logWebSocketEvent('connection', { 
      socketId: socket.id,
      clientIP: socket.handshake.address 
    });

    // Обработка аутентификации пользователя
    socket.on('authenticate', async (data) => {
      try {
        const { userId, role } = data;
        
        if (!userId || !role) {
          socket.emit('auth_error', { message: 'Неверные данные аутентификации' });
          return;
        }

        // Проверяем существование пользователя
        const user = await User.findByPk(userId);
        if (!user || !user.is_active) {
          socket.emit('auth_error', { message: 'Пользователь не найден или неактивен' });
          return;
        }

        // Присваиваем пользователя к сокету
        socket.userId = userId;
        socket.userRole = role;
        socket.join(`role:${role}`); // Присоединяем к комнате по роли
        
        logger.logWebSocketEvent('authenticate', { 
          socketId: socket.id,
          userId,
          role 
        });

        socket.emit('authenticated', { 
          message: 'Аутентификация успешна',
          userId,
          role 
        });

      } catch (error) {
        logger.logError(error, { 
          socketId: socket.id,
          event: 'authenticate' 
        });
        socket.emit('auth_error', { message: 'Ошибка аутентификации' });
      }
    });

    // Обработка создания заказа
    socket.on('order:create', async (data) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Необходима аутентификация' });
          return;
        }

        const { orderId, tableNumber, items } = data;
        
        logger.logWebSocketEvent('order:create', { 
          socketId: socket.id,
          userId: socket.userId,
          orderId,
          tableNumber 
        });

        // Уведомляем поваров о новом заказе
        io.to('role:cook').emit('order:new', {
          orderId,
          tableNumber,
          items,
          timestamp: new Date().toISOString()
        });

        // Уведомляем администраторов
        io.to('role:admin').to('role:director').emit('order:new', {
          orderId,
          tableNumber,
          items,
          waiterId: socket.userId,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        logger.logError(error, { 
          socketId: socket.id,
          event: 'order:create' 
        });
        socket.emit('error', { message: 'Ошибка создания заказа' });
      }
    });

    // Обработка изменения статуса заказа
    socket.on('order:status_change', async (data) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Необходима аутентификация' });
          return;
        }

        const { orderId, newStatus, previousStatus } = data;
        
        logger.logWebSocketEvent('order:status_change', { 
          socketId: socket.id,
          userId: socket.userId,
          orderId,
          newStatus,
          previousStatus 
        });

        // Получаем информацию о заказе
        const order = await Order.findByPk(orderId, {
          include: ['waiter', 'orderItems']
        });

        if (!order) {
          socket.emit('error', { message: 'Заказ не найден' });
          return;
        }

        // Уведомляем всех о изменении статуса
        io.emit('order:updated', {
          orderId,
          status: newStatus,
          previousStatus,
          changedBy: socket.userId,
          timestamp: new Date().toISOString()
        });

        // Специальные уведомления для разных статусов
        if (newStatus === 'ready') {
          // Уведомляем официанта о готовности заказа
          io.to(`user:${order.waiter_id}`).emit('order:ready', {
            orderId,
            tableNumber: order.table_number,
            timestamp: new Date().toISOString()
          });
        }

      } catch (error) {
        logger.logError(error, { 
          socketId: socket.id,
          event: 'order:status_change' 
        });
        socket.emit('error', { message: 'Ошибка изменения статуса заказа' });
      }
    });

    // Обработка отключения
    socket.on('disconnect', (reason) => {
      logger.logWebSocketEvent('disconnect', { 
        socketId: socket.id,
        userId: socket.userId,
        reason 
      });
    });

    // Обработка ошибок
    socket.on('error', (error) => {
      logger.logError(error, { 
        socketId: socket.id,
        userId: socket.userId 
      });
    });
  });

  logger.info('✅ WebSocket сервер настроен и готов к работе');
}

/**
 * Отправка уведомления конкретному пользователю
 * @param {number} userId - ID пользователя
 * @param {string} event - Название события
 * @param {any} data - Данные для отправки
 */
function sendToUser(userId, event, data) {
  if (!io) {
    logger.warn('⚠️ WebSocket сервер не инициализирован');
    return;
  }

  io.to(`user:${userId}`).emit(event, data);
  logger.logWebSocketEvent('send_to_user', { userId, event });
}

/**
 * Отправка уведомления всем пользователям с определенной ролью
 * @param {string} role - Роль пользователей
 * @param {string} event - Название события
 * @param {any} data - Данные для отправки
 */
function sendToRole(role, event, data) {
  if (!io) {
    logger.warn('⚠️ WebSocket сервер не инициализирован');
    return;
  }

  io.to(`role:${role}`).emit(event, data);
  logger.logWebSocketEvent('send_to_role', { role, event });
}

/**
 * Отправка уведомления всем подключенным пользователям
 * @param {string} event - Название события
 * @param {any} data - Данные для отправки
 */
function broadcast(event, data) {
  if (!io) {
    logger.warn('⚠️ WebSocket сервер не инициализирован');
    return;
  }

  io.emit(event, data);
  logger.logWebSocketEvent('broadcast', { event });
}

/**
 * Получение количества подключенных пользователей
 * @returns {number} - Количество подключений
 */
function getConnectedUsersCount() {
  if (!io) {
    return 0;
  }
  return io.engine.clientsCount;
}

/**
 * Получение статистики подключений по ролям
 * @returns {Object} - Статистика подключений
 */
function getConnectionStats() {
  if (!io) {
    return {};
  }

  const stats = {};
  const rooms = io.sockets.adapter.rooms;
  
  // Подсчитываем пользователей по ролям
  for (const [roomName, room] of rooms) {
    if (roomName.startsWith('role:')) {
      const role = roomName.replace('role:', '');
      stats[role] = room.size;
    }
  }

  return {
    total: getConnectedUsersCount(),
    byRole: stats
  };
}

module.exports = {
  setupSocketIO,
  sendToUser,
  sendToRole,
  broadcast,
  getConnectedUsersCount,
  getConnectionStats
};
