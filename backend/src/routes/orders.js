/**
 * Маршруты для управления заказами
 * CRUD операции для заказов и их позиций
 */

const express = require('express');
const { Order, OrderItem, MenuItem, User } = require('../models');
const { authenticateToken, requireRole, checkOrderAccess, logUserAction } = require('../middleware/auth');
const { validate, createOrderSchema, updateOrderStatusSchema } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendToRole, sendToUser } = require('../services/socketService');
// const { sendOrderReadyNotification, sendNewOrderNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/orders
 * Создание нового заказа (только для официантов)
 */
router.post('/', 
  authenticateToken, 
  requireRole(['waiter']),
  // validate(createOrderSchema), // ВРЕМЕННО ОТКЛЮЧЕНО
  logUserAction('create_order'),
  asyncHandler(async (req, res) => {
    console.log('🛒 [orders.js] Получен запрос на создание заказа:', req.body);
    const { table_number, items, notes, customer_name, customer_phone } = req.body;
    const waiterId = req.user.id;
    console.log('🛒 [orders.js] Данные заказа:', { table_number, items, notes, customer_name, customer_phone, waiterId });

    // Создаем заказ
    const order = await Order.create({
      table_number,
      waiter_id: waiterId,
      notes,
      customer_name,
      customer_phone,
      total_amount: 0 // Будет рассчитано при создании позиций
    });

    // Создаем позиции заказа
    const orderItems = await OrderItem.createOrderItems(order.id, items);

    // Рассчитываем общую сумму
    const totalAmount = orderItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    await order.update({ total_amount: totalAmount });

    // Получаем полную информацию о заказе с позициями и меню
    const fullOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: MenuItem,
              as: 'menuItem'
            }
          ]
        },
        {
          model: User,
          as: 'waiter'
        }
      ]
    });

    logger.logOrderEvent(order.id, 'order_created', {
      tableNumber: table_number,
      waiterId,
      itemsCount: items.length,
      totalAmount
    });

    // Подготавливаем данные заказа для WebSocket
    const orderData = {
      id: fullOrder.id,
      table_number: fullOrder.table_number,
      status: fullOrder.status,
      total_amount: parseFloat(fullOrder.total_amount),
      waiter: {
        id: fullOrder.waiter.id,
        full_name: fullOrder.waiter.full_name,
        waiter_number: fullOrder.waiter.waiter_number
      },
      items: fullOrder.orderItems.map(item => ({
        id: item.id,
        menu_item_id: item.menu_item_id,
        name: item.menuItem?.name || 'Unknown',
        quantity: item.quantity,
        price_at_order: parseFloat(item.price_at_order),
        total_price: parseFloat(item.total_price),
        notes: item.notes,
        is_ready: item.is_ready
      })),
      created_at: fullOrder.created_at,
      timestamp: new Date().toISOString()
    };

    // Отправляем уведомления через WebSocket
    const { broadcast } = require('../services/socketService');
    
    // Отправляем всем (повара, админы, TV Display)
    broadcast('order:new', orderData);
    
    sendToRole('cook', 'order:new', orderData);
    sendToRole('admin', 'order:new', orderData);

    // Отправляем push-уведомление поварам о новом заказе
    // await sendNewOrderNotification(fullOrder);

    res.status(201).json({
      success: true,
      message: 'Заказ создан успешно',
      data: { 
        order: {
          ...fullOrder.toPublicJSON(true),
          orderItems: orderItems.map(item => item.toPublicJSON(true))
        }
      }
    });
  })
);

/**
 * PUT /api/order-items/:id/ready
 * Переключить готовность позиции (повар)
 */
router.put('/items/:itemId/ready',
  authenticateToken,
  requireRole(['cook']),
  logUserAction('order_item_ready_toggle'),
  asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const userId = req.user.id;

    const item = await OrderItem.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Позиция заказа не найдена' });
    }

    // Переключаем готовность
    const newReady = !item.is_ready;
    await item.setReady(newReady);

    // Проверяем, все ли позиции готовы — если да, ставим заказ в ready
    const order = await Order.findByPk(item.order_id);
    const items = await OrderItem.findAll({ where: { order_id: order.id } });
    const allReady = items.every(i => i.is_ready);

    if (allReady && order.status !== 'ready') {
      await order.updateStatus('ready', userId);

      // Уведомляем официанта и админов
      sendToUser(order.waiter_id, 'order:ready', {
        orderId: order.id,
        tableNumber: order.table_number,
        timestamp: new Date().toISOString()
      });
      sendToRole('admin', 'order:updated', {
        orderId: order.id,
        status: 'ready',
        timestamp: new Date().toISOString()
      });
      // Уведомляем повара, чтобы заказ исчез из его списка
      sendToRole('cook', 'order:updated', {
        orderId: order.id,
        status: 'ready',
        previousStatus: order.status,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Статус позиции обновлен',
      data: {
        item: item.toPublicJSON(true),
        orderReady: allReady || order.status === 'ready'
      }
    });
  })
);

/**
 * PUT /api/orders/:id/ready-all
 * Отметить все позиции как готовые и поставить заказ в ready (повар)
 */
router.put('/:id/ready-all',
  authenticateToken,
  requireRole(['cook']),
  logUserAction('order_ready_all'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Заказ не найден' });
    }

    const items = await OrderItem.findAll({ where: { order_id: order.id } });
    for (const it of items) {
      if (!it.is_ready) {
        await it.setReady(true);
      }
    }

    if (order.status !== 'ready') {
      const oldStatus = order.status;
      await order.updateStatus('ready', userId);
      sendToUser(order.waiter_id, 'order:ready', {
        orderId: order.id,
        tableNumber: order.table_number,
        timestamp: new Date().toISOString()
      });
      sendToRole('admin', 'order:updated', {
        orderId: order.id,
        status: 'ready',
        timestamp: new Date().toISOString()
      });
      // Уведомляем повара, чтобы заказ исчез из его списка
      sendToRole('cook', 'order:updated', {
        orderId: order.id,
        status: 'ready',
        previousStatus: oldStatus,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true, message: 'Все позиции отмечены как готовые' });
  })
);

/**
 * PUT /api/orders/:id/pay
 * Отметить заказ как оплаченный (только админ/директор)
 */
router.put('/:id/pay',
  authenticateToken,
  requireRole(['admin', 'director']),
  logUserAction('order_paid'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }

    if (order.is_paid === true) {
      return res.status(200).json({
        success: true,
        message: 'Заказ уже оплачен',
        data: { order: order.toPublicJSON(true) }
      });
    }

    await order.update({ is_paid: true });

    logger.logOrderEvent(order.id, 'order_paid', {
      paidBy: userId,
      status: order.status
    });

    // WebSocket уведомления
    sendToRole('admin', 'order:paid', {
      orderId: order.id,
      tableNumber: order.table_number,
      timestamp: new Date().toISOString()
    });
    sendToUser(order.waiter_id, 'order:paid', {
      orderId: order.id,
      tableNumber: order.table_number,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Заказ отмечен как оплаченный',
      data: { order: order.toPublicJSON(true) }
    });
  })
);

/**
 * GET /api/orders
 * Получение заказов (с фильтрацией по роли)
 */
router.get('/', 
  authenticateToken, 
  asyncHandler(async (req, res) => {
    const { status, table_number, waiter_id, is_paid, limit = 50, offset = 0 } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    let whereClause = {};
    
    // Фильтрация по статусу
    if (status) {
      whereClause.status = status;
    }
    
    // Фильтрация по номеру столика
    if (table_number) {
      whereClause.table_number = table_number;
    }
    
    // Фильтрация по официанту
    if (waiter_id) {
      whereClause.waiter_id = waiter_id;
    }

    // Фильтрация по оплате
    if (typeof is_paid !== 'undefined') {
      // поддержка значений 'true' | 'false' | true | false
      const normalized = String(is_paid).toLowerCase();
      if (normalized === 'true' || normalized === '1') {
        whereClause.is_paid = true;
      } else if (normalized === 'false' || normalized === '0') {
        whereClause.is_paid = false;
      }
    }
    
    // Официанты видят только свои заказы
    if (userRole === 'waiter') {
      whereClause.waiter_id = userId;
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: ['menuItem']
        },
        'waiter'
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        orders: orders.rows.map(order => ({
          ...order.toPublicJSON(userRole !== 'cook'), // Повары не видят цены
          orderItems: order.orderItems.map(item => item.toPublicJSON(userRole !== 'cook')),
          waiter: order.waiter?.toPublicJSON()
        })),
        total: orders.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  })
);

/**
 * GET /api/orders/active
 * Получение активных заказов (не доставленных)
 * Для повара возвращаются только заказы со статусами 'new' и 'preparing' (без 'ready')
 */
router.get('/active', 
  authenticateToken, 
  asyncHandler(async (req, res) => {
    const userRole = req.user.role;
    const userId = req.user.id;

    let orders;
    
    if (userRole === 'waiter') {
      // Официант видит свои заказы со статусами: new, accepted, preparing, ready
      orders = await Order.getActiveOrders(userId);
    } else if (userRole === 'cook') {
      // Повар видит только заказы со статусами: new, preparing (без ready)
      orders = await Order.getActiveOrdersForCook();
    } else {
      // Админы и директора видят все активные заказы
      orders = await Order.getActiveOrders();
    }

    // Получаем полную информацию о заказах
    const fullOrders = await Promise.all(orders.map(async (order) => {
      const orderItems = await OrderItem.getByOrderId(order.id);
      return {
        ...order.toPublicJSON(userRole !== 'cook'),
        orderItems: orderItems.map(item => item.toPublicJSON(userRole !== 'cook'))
      };
    }));

    res.json({
      success: true,
      data: { orders: fullOrders }
    });
  })
);

/**
 * GET /api/orders/:id
 * Получение конкретного заказа
 */
router.get('/:id', 
  authenticateToken, 
  checkOrderAccess,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: ['menuItem']
        },
        'waiter'
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }

    res.json({
      success: true,
      data: {
        order: {
          ...order.toPublicJSON(userRole !== 'cook'),
          orderItems: order.orderItems.map(item => item.toPublicJSON(userRole !== 'cook')),
          waiter: order.waiter?.toPublicJSON()
        }
      }
    });
  })
);

/**
 * PUT /api/orders/:id/status
 * Изменение статуса заказа
 */
router.put('/:id/status', 
  authenticateToken, 
  requireRole(['cook', 'waiter']),
  validate(updateOrderStatusSchema),
  checkOrderAccess,
  logUserAction('update_order_status'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status: newStatus, notes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }

    const oldStatus = order.status;

    // Проверяем права на изменение статуса
    if (userRole === 'waiter' && !['ready', 'delivered'].includes(newStatus)) {
      return res.status(403).json({
        success: false,
        message: 'Официант может изменять только статусы "готов" и "доставлен"'
      });
    }

    if (userRole === 'cook' && !['preparing', 'ready'].includes(newStatus)) {
      return res.status(403).json({
        success: false,
        message: 'Повар может изменять только статусы "готовится" и "готов"'
      });
    }

    // Обновляем статус
    await order.updateStatus(newStatus, userId);

    logger.logOrderEvent(order.id, 'status_changed', {
      oldStatus,
      newStatus,
      changedBy: userId,
      userRole
    });

    // Отправляем уведомления через WebSocket
    if (newStatus === 'ready') {
      sendToUser(order.waiter_id, 'order:ready', {
        orderId: order.id,
        tableNumber: order.table_number,
        timestamp: new Date().toISOString()
      });

      // Отправляем push-уведомление официанту
      // const waiter = await User.findByPk(order.waiter_id);
      // if (waiter) {
      //   await sendOrderReadyNotification(order, waiter);
      // }
    }

    sendToRole('admin', 'order:updated', {
      orderId: order.id,
      status: newStatus,
      previousStatus: oldStatus,
      changedBy: userId,
      timestamp: new Date().toISOString()
    });

    // Уведомляем повара об изменении статуса (особенно важно для статуса 'ready')
    // чтобы заказ исчез из его списка активных заказов
    if (userRole === 'cook' || newStatus === 'ready') {
      sendToRole('cook', 'order:updated', {
        orderId: order.id,
        status: newStatus,
        previousStatus: oldStatus,
        changedBy: userId,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Статус заказа обновлен успешно',
      data: { 
        order: order.toPublicJSON(userRole !== 'cook')
      }
    });
  })
);

/**
 * GET /api/orders/:id/history
 * Получение истории изменений заказа
 */
router.get('/:id/history', 
  authenticateToken, 
  checkOrderAccess,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const OrderStatusHistory = require('../models/OrderStatusHistory');

    const history = await OrderStatusHistory.getByOrderId(id);

    res.json({
      success: true,
      data: { 
        history: history.map(record => record.toPublicJSON())
      }
    });
  })
);

/**
 * DELETE /api/orders/all
 * ВРЕМЕННЫЙ endpoint для удаления всех заказов (только для тестирования)
 * Доступен для поваров, официантов, админов и директоров
 */
router.delete('/all',
  authenticateToken,
  requireRole(['cook', 'admin', 'director', 'waiter']),
  logUserAction('delete_all_orders'),
  asyncHandler(async (req, res) => {
    try {
      const OrderStatusHistory = require('../models/OrderStatusHistory');

      // Удаляем историю изменений статусов заказов
      await OrderStatusHistory.destroy({
        where: {},
        force: true // Физическое удаление
      });

      // Удаляем все позиции заказов
      await OrderItem.destroy({
        where: {},
        force: true // Физическое удаление
      });

      // Удаляем все заказы
      const deletedCount = await Order.destroy({
        where: {},
        force: true // Физическое удаление
      });

      logger.warn(`⚠️ [orders.js] Все заказы удалены пользователем ${req.user.id} (${req.user.role})`);

      res.json({
        success: true,
        message: `Удалено заказов: ${deletedCount}`,
        deletedCount
      });
    } catch (error) {
      logger.error('❌ [orders.js] Ошибка удаления всех заказов:', error);
      throw error;
    }
  })
);

/**
 * DELETE /api/orders/:id
 * Отмена заказа (только для официантов и админов)
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(['waiter', 'admin', 'director']),
  checkOrderAccess,
  logUserAction('cancel_order'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }

    // Проверяем, можно ли отменить заказ
    if (['delivered'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя отменить уже доставленный заказ'
      });
    }

    // Мягкое удаление заказа
    await order.update({ status: 'cancelled' });

    logger.logOrderEvent(order.id, 'order_cancelled', {
      cancelledBy: userId,
      previousStatus: order.status
    });

    // Уведомляем через WebSocket
    sendToRole('cook', 'order:cancelled', {
      orderId: order.id,
      tableNumber: order.table_number,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Заказ отменен успешно'
    });
  })
);

module.exports = router;
