/**
 * Модель позиции меню
 * Содержит информацию о блюдах/напитках в меню ресторана
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const MenuItem = sequelize.define('MenuItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [2, 200],
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01,
      max: 999999.99
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'menu_categories',
      key: 'id'
    }
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  preparation_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 999
    },
    comment: 'Время приготовления в минутах'
  },
  calories: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 9999
    },
    comment: 'Калории на 100г'
  },
  allergens: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Массив аллергенов в JSON формате'
  },
  ingredients: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Список ингредиентов'
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Доступность для заказа'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Активность позиции в меню'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'menu_items',
  indexes: [
    {
      fields: ['category_id']
    },
    {
      fields: ['is_active', 'is_available']
    },
    {
      fields: ['sort_order']
    },
    {
      fields: ['price']
    },
    {
      fields: ['name']
    }
  ]
});

/**
 * Статический метод для получения всех активных и доступных позиций меню
 * @param {number} categoryId - ID категории (опционально)
 * @returns {Array<MenuItem>} - Массив позиций меню
 */
MenuItem.getActiveItems = async function(categoryId = null) {
  const whereClause = {
    is_active: true,
    is_available: true
  };
  
  if (categoryId) {
    whereClause.category_id = categoryId;
  }
  
  return await this.findAll({
    where: whereClause,
    order: [['category_id', 'ASC'], ['sort_order', 'ASC'], ['name', 'ASC']]
  });
};

/**
 * Статический метод для поиска позиций по названию
 * @param {string} searchTerm - Поисковый запрос
 * @returns {Array<MenuItem>} - Массив найденных позиций
 */
MenuItem.searchByName = async function(searchTerm) {
  return await this.findAll({
    where: {
      name: {
        [sequelize.Sequelize.Op.iLike]: `%${searchTerm}%`
      },
      is_active: true,
      is_available: true
    },
    order: [['name', 'ASC']]
  });
};

/**
 * Статический метод для получения позиций по ценовому диапазону
 * @param {number} minPrice - Минимальная цена
 * @param {number} maxPrice - Максимальная цена
 * @returns {Array<MenuItem>} - Массив позиций в ценовом диапазоне
 */
MenuItem.getByPriceRange = async function(minPrice, maxPrice) {
  return await this.findAll({
    where: {
      price: {
        [sequelize.Sequelize.Op.between]: [minPrice, maxPrice]
      },
      is_active: true,
      is_available: true
    },
    order: [['price', 'ASC']]
  });
};

/**
 * Статический метод для получения популярных позиций (по количеству заказов)
 * @param {number} limit - Количество позиций
 * @returns {Array<MenuItem>} - Массив популярных позиций
 */
MenuItem.getPopularItems = async function(limit = 10) {
  const OrderItem = require('./OrderItem');
  
  return await this.findAll({
    attributes: [
      'id', 'name', 'description', 'price', 'category_id', 'image_url',
      [sequelize.fn('COUNT', sequelize.col('OrderItems.id')), 'order_count']
    ],
    include: [{
      model: OrderItem,
      as: 'orderItems',
      attributes: []
    }],
    where: {
      is_active: true,
      is_available: true
    },
    group: ['MenuItem.id'],
    order: [[sequelize.fn('COUNT', sequelize.col('OrderItems.id')), 'DESC']],
    limit: limit
  });
};

/**
 * Метод для обновления доступности позиции
 * @param {boolean} available - Доступность
 * @returns {boolean} - Результат операции
 */
MenuItem.prototype.setAvailability = async function(available) {
  this.is_available = available;
  await this.save();
  return true;
};

/**
 * Метод для мягкого удаления позиции (установка is_active = false)
 * @returns {boolean} - Результат операции
 */
MenuItem.prototype.softDelete = async function() {
  this.is_active = false;
  this.is_available = false;
  await this.save();
  return true;
};

/**
 * Метод для получения публичной информации о позиции
 * @returns {Object} - Публичная информация
 */
MenuItem.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    name: this.name,
    description: this.description,
    price: parseFloat(this.price),
    category_id: this.category_id,
    image_url: this.image_url,
    preparation_time: this.preparation_time,
    calories: this.calories,
    allergens: this.allergens,
    ingredients: this.ingredients,
    is_available: this.is_available,
    sort_order: this.sort_order,
    created_at: this.created_at,
    updated_at: this.updated_at
  };
};

module.exports = MenuItem;
