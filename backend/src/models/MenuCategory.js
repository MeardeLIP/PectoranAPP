/**
 * Модель категории меню
 * Группирует позиции меню по категориям (Напитки, Закуски, Основные блюда и т.д.)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const MenuCategory = sequelize.define('MenuCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 100],
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Название иконки для отображения в UI'
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: /^#[0-9A-F]{6}$/i // HEX цвет
    },
    comment: 'Цвет категории в HEX формате'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'menu_categories',
  indexes: [
    {
      unique: true,
      fields: ['name']
    },
    {
      fields: ['sort_order']
    },
    {
      fields: ['is_active']
    }
  ]
});

/**
 * Статический метод для получения всех активных категорий, отсортированных по sort_order
 * @returns {Array<MenuCategory>} - Массив активных категорий
 */
MenuCategory.getActiveCategories = async function() {
  return await this.findAll({
    where: {
      is_active: true
    },
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
};

/**
 * Статический метод для создания новой категории с автоматическим sort_order
 * @param {Object} categoryData - Данные категории
 * @returns {MenuCategory} - Созданная категория
 */
MenuCategory.createWithAutoSort = async function(categoryData) {
  // Находим максимальный sort_order среди активных категорий
  const maxOrder = await this.max('sort_order', {
    where: { is_active: true }
  });
  
  return await this.create({
    ...categoryData,
    sort_order: (maxOrder || 0) + 1
  });
};

/**
 * Метод для получения количества активных позиций в категории
 * @returns {number} - Количество активных позиций
 */
MenuCategory.prototype.getActiveItemsCount = async function() {
  const MenuItem = require('./MenuItem');
  return await MenuItem.count({
    where: {
      category_id: this.id,
      is_active: true
    }
  });
};

/**
 * Метод для получения всех активных позиций в категории
 * @returns {Array<MenuItem>} - Массив активных позиций
 */
MenuCategory.prototype.getActiveItems = async function() {
  const MenuItem = require('./MenuItem');
  return await MenuItem.findAll({
    where: {
      category_id: this.id,
      is_active: true
    },
    order: [['name', 'ASC']]
  });
};

/**
 * Метод для мягкого удаления категории (установка is_active = false)
 * @returns {boolean} - Результат операции
 */
MenuCategory.prototype.softDelete = async function() {
  // Проверяем, есть ли активные позиции в категории
  const itemsCount = await this.getActiveItemsCount();
  if (itemsCount > 0) {
    throw new Error('Нельзя удалить категорию, в которой есть активные позиции меню');
  }
  
  this.is_active = false;
  await this.save();
  return true;
};

/**
 * Метод для получения публичной информации о категории
 * @returns {Object} - Публичная информация
 */
MenuCategory.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    name: this.name,
    description: this.description,
    sort_order: this.sort_order,
    icon: this.icon,
    color: this.color,
    is_active: this.is_active,
    created_at: this.created_at,
    updated_at: this.updated_at
  };
};

module.exports = MenuCategory;
