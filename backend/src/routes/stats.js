/**
 * Маршруты для статистики и аналитики
 * Получение различных отчетов и метрик
 */

const express = require('express');
const { Order, OrderItem, User, OrderStatusHistory, MenuItem } = require('../models');
const { authenticateToken, requireRole, logUserAction } = require('../middleware/auth');
const { validate, statsQuerySchema } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { cacheStats, getCachedStats } = require('../services/redis');
const logger = require('../utils/logger');
const { sequelize } = require('../models/database');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * GET /api/stats/daily
 * Получение статистики за день (только для директора)
 */
router.get('/daily', 
  authenticateToken, 
  requireRole(['director']),
  validate(statsQuerySchema, 'query'),
  logUserAction('view_daily_stats'),
  asyncHandler(async (req, res) => {
    const { start_date, end_date, waiter_id } = req.query;
    
    // Определяем период
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    
    // Проверяем кэш
    const cacheKey = `daily_stats_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}_${waiter_id || 'all'}`;
    let stats = await getCachedStats(cacheKey);
    
    if (!stats) {
      // Получаем статистику из БД
      const whereClause = {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      };
      
      if (waiter_id) {
        whereClause.waiter_id = waiter_id;
      }

      // Основная статистика заказов
      const orderStats = await Order.getStatistics(startDate, endDate);
      
      // Статистика по статусам
      const statusStats = await OrderStatusHistory.getStatusStatistics(startDate, endDate);
      
      // Время обработки заказов
      const processingTimeStats = await OrderStatusHistory.getProcessingTimeStats(startDate, endDate);
      
      // Популярные позиции с информацией о MenuItem
      const popularItemsRaw = await OrderItem.findAll({
        attributes: [
          'menu_item_id',
          [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'total_quantity'],
          [sequelize.fn('COUNT', sequelize.col('OrderItem.id')), 'order_count'],
          [sequelize.fn('SUM', sequelize.col('OrderItem.total_price')), 'total_revenue']
        ],
        include: [{
          model: Order,
          as: 'order',
          attributes: [],
          where: {
            created_at: {
              [Op.between]: [startDate, endDate]
            }
          }
        }, {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'name'],
          required: true
        }],
        group: ['menu_item_id', 'menuItem.id', 'menuItem.name'],
        order: [[sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'DESC']],
        limit: 10
      });
      
      // Подсчет активных заказов (не доставленных и не отмененных)
      const activeOrdersCount = await Order.count({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          status: {
            [Op.in]: ['new', 'accepted', 'preparing', 'ready']
          }
        }
      });
      
      // Статистика по официантам
      const waiterStats = await Order.findAll({
        attributes: [
          'waiter_id',
          [sequelize.fn('COUNT', sequelize.col('Order.id')), 'orders_count'],
          [sequelize.fn('SUM', sequelize.col('Order.total_amount')), 'total_revenue'],
          [sequelize.fn('AVG', sequelize.col('Order.total_amount')), 'avg_order_value']
        ],
        where: whereClause,
        include: [{
          model: User,
          as: 'waiter',
          attributes: ['id', 'username', 'full_name', 'waiter_number']
        }],
        group: ['waiter_id', 'waiter.id', 'waiter.username', 'waiter.full_name', 'waiter.waiter_number'],
        order: [[sequelize.fn('COUNT', sequelize.col('Order.id')), 'DESC']]
      });

      // Формируем статистику в формате, ожидаемом frontend
      stats = {
        // Основные метрики для frontend
        totalOrders: parseInt(orderStats.total_orders) || 0,
        totalRevenue: parseFloat(orderStats.total_revenue) || 0,
        averageCheck: parseFloat(orderStats.average_order_value) || 0,
        activeOrders: activeOrdersCount || 0,
        
        // Популярные блюда в формате для frontend
        popularItems: popularItemsRaw.map(item => {
          // Извлекаем данные из Sequelize результата
          // При использовании агрегатных функций и GROUP BY, данные могут быть в dataValues
          const dataValues = item.dataValues || {};
          const menuItem = item.menuItem || null;
          const menuItemData = menuItem ? (menuItem.dataValues || menuItem) : null;
          
          // Извлекаем агрегированные значения
          const orderCount = dataValues.order_count || item.order_count || 0;
          const totalRevenue = dataValues.total_revenue || item.total_revenue || 0;
          const menuItemId = dataValues.menu_item_id || item.menu_item_id;
          
          return {
            id: menuItemData?.id || menuItemId,
            name: menuItemData?.name || 'Неизвестное блюдо',
            orderCount: parseInt(String(orderCount)) || 0,
            totalRevenue: parseFloat(String(totalRevenue)) || 0
          };
        }),
        
        // Дополнительная информация (для будущего использования)
        period: {
          start: startDate,
          end: endDate
        },
        orders: {
          total: parseInt(orderStats.total_orders) || 0,
          completed: parseInt(orderStats.completed_orders) || 0,
          total_revenue: parseFloat(orderStats.total_revenue) || 0,
          average_order_value: parseFloat(orderStats.average_order_value) || 0
        },
        status_breakdown: statusStats.map(stat => ({
          status: stat.status,
          count: parseInt(stat.count),
          avg_duration: parseFloat(stat.avg_duration_minutes) || 0
        })),
        processing_time: {
          average: parseFloat(processingTimeStats.avg_total_time) || 0,
          minimum: parseFloat(processingTimeStats.min_total_time) || 0,
          maximum: parseFloat(processingTimeStats.max_total_time) || 0
        },
        waiters: waiterStats.map(stat => ({
          waiter: stat.waiter?.toPublicJSON(),
          orders_count: parseInt(stat.dataValues.orders_count),
          total_revenue: parseFloat(stat.dataValues.total_revenue),
          avg_order_value: parseFloat(stat.dataValues.avg_order_value)
        }))
      };
      
      // Кэшируем статистику на 5 минут
      await cacheStats(cacheKey, stats, 300);
    }

    res.json({
      success: true,
      data: { stats }
    });
  })
);

/**
 * GET /api/stats/waiter/:id
 * Получение статистики конкретного официанта
 */
router.get('/waiter/:id', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('view_waiter_stats'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { start_date, end_date } = req.query;
    
    // Определяем период
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // По умолчанию неделя

    const waiter = await User.findByPk(id);
    if (!waiter || waiter.role !== 'waiter') {
      return res.status(404).json({
        success: false,
        message: 'Официант не найден'
      });
    }

    // Статистика заказов официанта
    const orders = await Order.getByDateRange(startDate, endDate, id);
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Статистика по дням
    const dailyStats = {};
    orders.forEach(order => {
      const date = order.created_at.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { orders: 0, revenue: 0 };
      }
      dailyStats[date].orders++;
      dailyStats[date].revenue += parseFloat(order.total_amount);
    });

    const stats = {
      waiter: waiter.toPublicJSON(),
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        total_orders: orders.length,
        total_revenue: totalRevenue,
        average_order_value: avgOrderValue,
        days_worked: Object.keys(dailyStats).length
      },
      daily_breakdown: Object.entries(dailyStats).map(([date, data]) => ({
        date,
        orders: data.orders,
        revenue: data.revenue,
        avg_order_value: data.revenue / data.orders
      }))
    };

    res.json({
      success: true,
      data: { stats }
    });
  })
);

/**
 * GET /api/stats/popular-items
 * Получение популярных позиций меню
 */
router.get('/popular-items', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('view_popular_items'),
  asyncHandler(async (req, res) => {
    const { start_date, end_date, limit = 20 } = req.query;
    
    // Определяем период
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // По умолчанию месяц

    const popularItems = await OrderItem.getPopularityStats(startDate, endDate, parseInt(limit));

    // Получаем информацию о позициях меню
    const itemsWithDetails = await Promise.all(popularItems.map(async (item) => {
      const menuItem = await require('../models/MenuItem').findByPk(item.menu_item_id);
      return {
        menu_item: menuItem?.toPublicJSON(),
        total_quantity: parseInt(item.total_quantity),
        order_count: parseInt(item.order_count),
        total_revenue: parseFloat(item.total_revenue)
      };
    }));

    res.json({
      success: true,
      data: { 
        popular_items: itemsWithDetails,
        period: {
          start: startDate,
          end: endDate
        }
      }
    });
  })
);

/**
 * GET /api/stats/revenue
 * Получение статистики выручки
 */
router.get('/revenue', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('view_revenue_stats'),
  asyncHandler(async (req, res) => {
    const { start_date, end_date, group_by = 'day' } = req.query;
    
    // Определяем период
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // По умолчанию месяц

    let groupFormat;
    switch (group_by) {
      case 'hour':
        groupFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'day':
        groupFormat = '%Y-%m-%d';
        break;
      case 'week':
        groupFormat = '%Y-%u';
        break;
      case 'month':
        groupFormat = '%Y-%m';
        break;
      default:
        groupFormat = '%Y-%m-%d';
    }

    const revenueStats = await Order.findAll({
      attributes: [
        [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('Order.created_at'), groupFormat), 'period'],
        [require('sequelize').fn('COUNT', require('sequelize').col('Order.id')), 'orders_count'],
        [require('sequelize').fn('SUM', require('sequelize').col('Order.total_amount')), 'total_revenue'],
        [require('sequelize').fn('AVG', require('sequelize').col('Order.total_amount')), 'avg_order_value']
      ],
      where: {
        created_at: {
          [require('sequelize').Op.between]: [startDate, endDate]
        },
        status: 'delivered' // Только завершенные заказы
      },
      group: [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('Order.created_at'), groupFormat)],
      order: [[require('sequelize').fn('DATE_FORMAT', require('sequelize').col('Order.created_at'), groupFormat), 'ASC']]
    });

    const stats = {
      period: {
        start: startDate,
        end: endDate,
        group_by
      },
      revenue_breakdown: revenueStats.map(stat => ({
        period: stat.dataValues.period,
        orders_count: parseInt(stat.dataValues.orders_count),
        total_revenue: parseFloat(stat.dataValues.total_revenue),
        avg_order_value: parseFloat(stat.dataValues.avg_order_value)
      })),
      total: {
        orders_count: revenueStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.orders_count), 0),
        total_revenue: revenueStats.reduce((sum, stat) => sum + parseFloat(stat.dataValues.total_revenue), 0)
      }
    };

    res.json({
      success: true,
      data: { stats }
    });
  })
);

/**
 * GET /api/stats/performance
 * Получение статистики производительности
 */
router.get('/performance', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('view_performance_stats'),
  asyncHandler(async (req, res) => {
    const { start_date, end_date } = req.query;
    
    // Определяем период
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // По умолчанию неделя

    // Статистика времени обработки
    const processingTimeStats = await OrderStatusHistory.getProcessingTimeStats(startDate, endDate);
    
    // Активность пользователей
    const userActivity = await OrderStatusHistory.getUserActivity(startDate, endDate);
    
    // Статистика по статусам
    const statusStats = await OrderStatusHistory.getStatusStatistics(startDate, endDate);

    const stats = {
      period: {
        start: startDate,
        end: endDate
      },
      processing_time: {
        average: parseFloat(processingTimeStats.avg_total_time) || 0,
        minimum: parseFloat(processingTimeStats.min_total_time) || 0,
        maximum: parseFloat(processingTimeStats.max_total_time) || 0
      },
      user_activity: userActivity.map(activity => ({
        user_id: activity.changed_by_user_id,
        status_changes_count: parseInt(activity.dataValues.status_changes_count),
        orders_processed: parseInt(activity.dataValues.orders_processed)
      })),
      status_breakdown: statusStats.map(stat => ({
        status: stat.status,
        count: parseInt(stat.count),
        avg_duration: parseFloat(stat.avg_duration_minutes) || 0
      }))
    };

    res.json({
      success: true,
      data: { stats }
    });
  })
);

module.exports = router;
