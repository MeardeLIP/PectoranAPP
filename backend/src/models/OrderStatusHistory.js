/**
 * Модель истории изменения статусов заказов
 * Отслеживает все изменения статусов заказов для аудита и аналитики
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('new', 'accepted', 'preparing', 'ready', 'delivered'),
    allowNull: false,
    validate: {
      isIn: [['new', 'accepted', 'preparing', 'ready', 'delivered']]
    }
  },
  previous_status: {
    type: DataTypes.ENUM('new', 'accepted', 'preparing', 'ready', 'delivered'),
    allowNull: true,
    validate: {
      isIn: [['new', 'accepted', 'preparing', 'ready', 'delivered']]
    }
  },
  changed_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Дополнительные заметки к изменению статуса'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP адрес пользователя, изменившего статус'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User Agent браузера/приложения'
  }
}, {
  tableName: 'order_status_history',
  indexes: [
    {
      fields: ['order_id']
    },
    {
      fields: ['changed_by_user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['order_id', 'timestamp']
    }
  ]
});

/**
 * Статический метод для получения истории изменений заказа
 * @param {number} orderId - ID заказа
 * @returns {Array<OrderStatusHistory>} - История изменений
 */
OrderStatusHistory.getByOrderId = async function(orderId) {
  return await this.findAll({
    where: { order_id: orderId },
    order: [['timestamp', 'ASC']]
  });
};

/**
 * Статический метод для получения статистики по статусам за период
 * @param {Date} startDate - Начальная дата
 * @param {Date} endDate - Конечная дата
 * @returns {Array} - Статистика по статусам
 */
OrderStatusHistory.getStatusStatistics = async function(startDate, endDate) {
  // В PostgreSQL нельзя агрегировать поверх оконной функции.
  // Поэтому сначала считаем разницу во времени на подзапросе, затем агрегируем.
  const [rows] = await sequelize.query(
    `WITH changes AS (
       SELECT
         status,
         order_id,
         timestamp,
         LAG(timestamp) OVER (PARTITION BY order_id ORDER BY timestamp) AS prev_timestamp
       FROM order_status_history
       WHERE timestamp BETWEEN :start AND :end
     )
     SELECT
       status,
       COUNT(*) AS count,
       AVG(EXTRACT(EPOCH FROM (timestamp - prev_timestamp))/60.0) AS avg_duration_minutes
     FROM changes
     WHERE prev_timestamp IS NOT NULL
     GROUP BY status
     ORDER BY status ASC`,
    { replacements: { start: startDate, end: endDate } }
  );

  return rows;
};

/**
 * Статический метод для получения времени обработки заказов
 * @param {Date} startDate - Начальная дата
 * @param {Date} endDate - Конечная дата
 * @returns {Object} - Статистика времени обработки
 */
OrderStatusHistory.getProcessingTimeStats = async function(startDate, endDate) {
  // Считаем время от первого до последнего изменения статуса для каждого заказа,
  // затем агрегируем на внешнем уровне.
  const [rows] = await sequelize.query(
    `WITH per_order AS (
       SELECT
         order_id,
         EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp)))/60.0 AS total_minutes
       FROM order_status_history
       WHERE timestamp BETWEEN :start AND :end
       GROUP BY order_id
     )
     SELECT
       AVG(total_minutes) AS avg_total_time,
       MIN(total_minutes) AS min_total_time,
       MAX(total_minutes) AS max_total_time
     FROM per_order`,
    { replacements: { start: startDate, end: endDate } }
  );

  return rows?.[0] || { avg_total_time: 0, min_total_time: 0, max_total_time: 0 };
};

/**
 * Статический метод для получения активности пользователей
 * @param {Date} startDate - Начальная дата
 * @param {Date} endDate - Конечная дата
 * @returns {Array} - Статистика активности пользователей
 */
OrderStatusHistory.getUserActivity = async function(startDate, endDate) {
  return await this.findAll({
    attributes: [
      'changed_by_user_id',
      [sequelize.fn('COUNT', sequelize.col('id')), 'status_changes_count'],
      [sequelize.fn('COUNT', sequelize.literal('DISTINCT order_id')), 'orders_processed']
    ],
    where: {
      timestamp: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    },
    group: ['changed_by_user_id'],
    order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
  });
};

/**
 * Метод для получения времени в статусе
 * @returns {number|null} - Время в статусе в минутах или null
 */
OrderStatusHistory.prototype.getTimeInStatus = function() {
  if (!this.timestamp) return null;
  
  // Находим следующее изменение статуса для этого заказа
  return this.sequelize.models.OrderStatusHistory.findOne({
    where: {
      order_id: this.order_id,
      timestamp: {
        [sequelize.Sequelize.Op.gt]: this.timestamp
      }
    },
    order: [['timestamp', 'ASC']]
  }).then(nextChange => {
    if (!nextChange) return null;
    
    const currentTime = new Date(this.timestamp);
    const nextTime = new Date(nextChange.timestamp);
    return Math.round((nextTime - currentTime) / (1000 * 60)); // в минутах
  });
};

/**
 * Метод для получения публичной информации о записи истории
 * @returns {Object} - Публичная информация
 */
OrderStatusHistory.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    order_id: this.order_id,
    status: this.status,
    previous_status: this.previous_status,
    changed_by_user_id: this.changed_by_user_id,
    timestamp: this.timestamp,
    notes: this.notes
  };
};

module.exports = OrderStatusHistory;
