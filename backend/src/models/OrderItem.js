/**
 * Модель позиции в заказе
 * Связывает заказы с позициями меню и содержит количество и цену на момент заказа
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const OrderItem = sequelize.define('OrderItem', {
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
  menu_item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'menu_items',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 99
    }
  },
  price_at_order: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    },
    comment: 'Цена позиции на момент создания заказа'
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    },
    comment: 'Общая цена позиции (quantity * price_at_order)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Дополнительные пожелания к позиции'
  },
  is_ready: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Готовность позиции (для повара)'
  }
}, {
  tableName: 'order_items',
  indexes: [
    {
      fields: ['order_id']
    },
    {
      fields: ['menu_item_id']
    },
    {
      fields: ['is_ready']
    }
  ],
  hooks: {
    // Автоматический расчет total_price при создании/обновлении
    beforeValidate: (orderItem) => {
      if (orderItem.quantity && orderItem.price_at_order) {
        orderItem.total_price = parseFloat(orderItem.quantity) * parseFloat(orderItem.price_at_order);
      }
    },
    beforeCreate: (orderItem) => {
      if (orderItem.quantity && orderItem.price_at_order && !orderItem.total_price) {
        orderItem.total_price = parseFloat(orderItem.quantity) * parseFloat(orderItem.price_at_order);
      }
    },
    beforeUpdate: (orderItem) => {
      if (orderItem.changed('quantity') || orderItem.changed('price_at_order')) {
        orderItem.total_price = parseFloat(orderItem.quantity) * parseFloat(orderItem.price_at_order);
      }
    }
  }
});

/**
 * Статический метод для создания позиций заказа
 * @param {number} orderId - ID заказа
 * @param {Array} items - Массив позиций с menu_item_id, quantity, notes
 * @returns {Array<OrderItem>} - Созданные позиции заказа
 */
OrderItem.createOrderItems = async function(orderId, items) {
  const MenuItem = require('./MenuItem');
  const createdItems = [];
  
  for (const item of items) {
    // Получаем актуальную цену позиции меню
    const menuItem = await MenuItem.findByPk(item.menu_item_id);
    if (!menuItem) {
      throw new Error(`Позиция меню с ID ${item.menu_item_id} не найдена`);
    }
    
    if (!menuItem.is_active || !menuItem.is_available) {
      throw new Error(`Позиция "${menuItem.name}" недоступна для заказа`);
    }
    
    const orderItem = await this.create({
      order_id: orderId,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price_at_order: menuItem.price,
      notes: item.notes || null
    });
    
    createdItems.push(orderItem);
  }
  
  return createdItems;
};

/**
 * Статический метод для получения позиций заказа
 * @param {number} orderId - ID заказа
 * @param {boolean} includeMenuItem - Включать ли связанный MenuItem (по умолчанию true)
 * @returns {Array<OrderItem>} - Позиции заказа
 */
OrderItem.getByOrderId = async function(orderId, includeMenuItem = true) {
  const MenuItem = require('./MenuItem');
  const options = {
    where: { order_id: orderId },
    order: [['created_at', 'ASC']]
  };
  
  if (includeMenuItem) {
    options.include = [{
      model: MenuItem,
      as: 'menuItem',
      attributes: ['id', 'name', 'description', 'price', 'image_url', 'is_active', 'is_available']
    }];
  }
  
  return await this.findAll(options);
};

/**
 * Статический метод для получения статистики по позициям меню
 * @param {Date} startDate - Начальная дата
 * @param {Date} endDate - Конечная дата
 * @param {number} limit - Количество позиций
 * @returns {Array} - Статистика популярности позиций
 */
OrderItem.getPopularityStats = async function(startDate, endDate, limit = 10) {
  return await this.findAll({
    attributes: [
      'menu_item_id',
      [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'total_quantity'],
      [sequelize.fn('COUNT', sequelize.col('OrderItem.id')), 'order_count'],
      [sequelize.fn('SUM', sequelize.col('OrderItem.total_price')), 'total_revenue']
    ],
    include: [{
      model: require('./Order'),
      as: 'order',
      attributes: [],
      where: {
        created_at: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      }
    }],
    group: ['menu_item_id'],
    order: [[sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'DESC']],
    limit: limit
  });
};

/**
 * Метод для обновления статуса готовности позиции
 * @param {boolean} ready - Готовность
 * @returns {boolean} - Результат операции
 */
OrderItem.prototype.setReady = async function(ready) {
  this.is_ready = ready;
  await this.save();
  return true;
};

/**
 * Метод для получения публичной информации о позиции заказа
 * @param {boolean} includePrices - Включать ли цены
 * @returns {Object} - Публичная информация
 */
OrderItem.prototype.toPublicJSON = function(includePrices = true) {
  const result = {
    id: this.id,
    order_id: this.order_id,
    menu_item_id: this.menu_item_id,
    quantity: this.quantity,
    notes: this.notes,
    is_ready: this.is_ready,
    created_at: this.created_at
  };
  
  // Включаем информацию о меню-позиции, если она была загружена
  if (this.menuItem) {
    result.menuItem = {
      id: this.menuItem.id,
      name: this.menuItem.name,
      description: this.menuItem.description,
      image_url: this.menuItem.image_url,
      is_active: this.menuItem.is_active,
      is_available: this.menuItem.is_available
    };
    
    // Включаем цену из меню, если не включены цены заказа
    if (!includePrices) {
      result.menuItem.price = parseFloat(this.menuItem.price);
    }
  }
  
  if (includePrices) {
    result.price_at_order = parseFloat(this.price_at_order);
    result.total_price = parseFloat(this.total_price);
  }
  
  return result;
};

module.exports = OrderItem;
