/**
 * Модель заказа
 * Основная модель для управления заказами в ресторане
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  table_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 999
    }
  },
  waiter_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('new', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'),
    allowNull: false,
    defaultValue: 'new',
    validate: {
      isIn: [['new', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled']]
    }
  },
  is_paid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Флаг оплаты заказа админом/директором'
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0.00
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Дополнительные заметки к заказу'
  },
  customer_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Имя клиента (опционально)'
  },
  customer_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Телефон клиента (опционально)'
  },
  estimated_ready_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Предполагаемое время готовности заказа'
  },
  actual_ready_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Фактическое время готовности заказа'
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Время доставки заказа клиенту'
  }
}, {
  tableName: 'orders',
  indexes: [
    {
      fields: ['waiter_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['table_number']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['waiter_id', 'status']
    }
  ]
});

/**
 * Статический метод для получения заказов по статусу
 * @param {string} status - Статус заказа
 * @param {number} waiterId - ID официанта (опционально)
 * @returns {Array<Order>} - Массив заказов
 */
Order.getByStatus = async function(status, waiterId = null) {
  const whereClause = { status };
  
  if (waiterId) {
    whereClause.waiter_id = waiterId;
  }
  
  return await this.findAll({
    where: whereClause,
    order: [['created_at', 'ASC']]
  });
};

/**
 * Статический метод для получения активных заказов (не доставленных)
 * @param {number} waiterId - ID официанта (опционально)
 * @returns {Array<Order>} - Массив активных заказов
 */
Order.getActiveOrders = async function(waiterId = null) {
  const whereClause = {
    status: {
      [sequelize.Sequelize.Op.in]: ['new', 'accepted', 'preparing', 'ready']
    }
  };
  
  if (waiterId) {
    whereClause.waiter_id = waiterId;
  }
  
  return await this.findAll({
    where: whereClause,
    order: [['created_at', 'ASC']]
  });
};

/**
 * Статический метод для получения активных заказов для повара
 * Повар видит только заказы со статусами 'new' и 'preparing' (без 'ready')
 * @returns {Array<Order>} - Массив активных заказов для повара
 */
Order.getActiveOrdersForCook = async function() {
  return await this.findAll({
    where: {
      status: {
        [sequelize.Sequelize.Op.in]: ['new', 'preparing']
      }
    },
    order: [['created_at', 'ASC']]
  });
};

/**
 * Статический метод для получения заказов за период
 * @param {Date} startDate - Начальная дата
 * @param {Date} endDate - Конечная дата
 * @param {number} waiterId - ID официанта (опционально)
 * @returns {Array<Order>} - Массив заказов за период
 */
Order.getByDateRange = async function(startDate, endDate, waiterId = null) {
  const whereClause = {
    created_at: {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    }
  };
  
  if (waiterId) {
    whereClause.waiter_id = waiterId;
  }
  
  return await this.findAll({
    where: whereClause,
    order: [['created_at', 'DESC']]
  });
};

/**
 * Статический метод для получения статистики заказов
 * @param {Date} startDate - Начальная дата
 * @param {Date} endDate - Конечная дата
 * @returns {Object} - Статистика заказов
 */
Order.getStatistics = async function(startDate, endDate) {
  const stats = await this.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
      [sequelize.fn('AVG', sequelize.col('total_amount')), 'average_order_value'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'delivered\' THEN 1 END')), 'completed_orders']
    ],
    where: {
      created_at: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    }
  });
  
  return stats[0] || {
    total_orders: 0,
    total_revenue: 0,
    average_order_value: 0,
    completed_orders: 0
  };
};

/**
 * Метод для обновления статуса заказа
 * @param {string} newStatus - Новый статус
 * @param {number} changedByUserId - ID пользователя, изменившего статус
 * @returns {boolean} - Результат операции
 */
Order.prototype.updateStatus = async function(newStatus, changedByUserId) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Обновляем соответствующие временные метки
  const now = new Date();
  switch (newStatus) {
    case 'accepted':
      // Статус уже обновлен
      break;
    case 'preparing':
      // Статус уже обновлен
      break;
    case 'ready':
      this.actual_ready_time = now;
      break;
    case 'delivered':
      this.delivered_at = now;
      break;
  }
  
  await this.save();
  
  // Записываем в историю изменения статуса
  const OrderStatusHistory = require('./OrderStatusHistory');
  await OrderStatusHistory.create({
    order_id: this.id,
    status: newStatus,
    changed_by_user_id: changedByUserId,
    previous_status: oldStatus
  });
  
  return true;
};

/**
 * Метод для расчета общего времени обработки заказа
 * @returns {number|null} - Время в минутах или null если заказ не завершен
 */
Order.prototype.getProcessingTime = function() {
  if (this.status !== 'delivered' || !this.delivered_at) {
    return null;
  }
  
  const startTime = new Date(this.created_at);
  const endTime = new Date(this.delivered_at);
  return Math.round((endTime - startTime) / (1000 * 60)); // в минутах
};

/**
 * Метод для получения публичной информации о заказе
 * @param {boolean} includePrices - Включать ли цены (для поваров = false)
 * @returns {Object} - Публичная информация
 */
Order.prototype.toPublicJSON = function(includePrices = true) {
  const result = {
    id: this.id,
    table_number: this.table_number,
    waiter_id: this.waiter_id,
    status: this.status,
    is_paid: this.is_paid,
    notes: this.notes,
    customer_name: this.customer_name,
    customer_phone: this.customer_phone,
    created_at: this.created_at,
    updated_at: this.updated_at
  };
  
  if (includePrices) {
    result.total_amount = parseFloat(this.total_amount);
  }
  
  if (this.estimated_ready_time) {
    result.estimated_ready_time = this.estimated_ready_time;
  }
  
  if (this.actual_ready_time) {
    result.actual_ready_time = this.actual_ready_time;
  }
  
  if (this.delivered_at) {
    result.delivered_at = this.delivered_at;
  }
  
  return result;
};

module.exports = Order;
