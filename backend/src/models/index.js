/**
 * Главный файл моделей
 * Инициализирует все модели и устанавливает связи между ними
 */

const { sequelize } = require('./database');

// Импорт всех моделей
const User = require('./User');
const MenuCategory = require('./MenuCategory');
const MenuItem = require('./MenuItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const OrderStatusHistory = require('./OrderStatusHistory');

// Установка связей между моделями

// User -> Order (один ко многим)
User.hasMany(Order, {
  foreignKey: 'waiter_id',
  as: 'orders'
});
Order.belongsTo(User, {
  foreignKey: 'waiter_id',
  as: 'waiter'
});

// User -> OrderStatusHistory (один ко многим)
User.hasMany(OrderStatusHistory, {
  foreignKey: 'changed_by_user_id',
  as: 'statusChanges'
});
OrderStatusHistory.belongsTo(User, {
  foreignKey: 'changed_by_user_id',
  as: 'changedBy'
});

// User -> User (самосвязь для created_by)
User.hasMany(User, {
  foreignKey: 'created_by',
  as: 'createdUsers'
});
User.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

// MenuCategory -> MenuItem (один ко многим)
MenuCategory.hasMany(MenuItem, {
  foreignKey: 'category_id',
  as: 'menuItems'
});
MenuItem.belongsTo(MenuCategory, {
  foreignKey: 'category_id',
  as: 'category'
});

// User -> MenuItem (один ко многим для created_by)
User.hasMany(MenuItem, {
  foreignKey: 'created_by',
  as: 'createdMenuItems'
});
MenuItem.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

// Order -> OrderItem (один ко многим)
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'orderItems'
});
OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});

// Order -> OrderStatusHistory (один ко многим)
Order.hasMany(OrderStatusHistory, {
  foreignKey: 'order_id',
  as: 'statusHistory'
});
OrderStatusHistory.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});

// MenuItem -> OrderItem (один ко многим)
MenuItem.hasMany(OrderItem, {
  foreignKey: 'menu_item_id',
  as: 'orderItems'
});
OrderItem.belongsTo(MenuItem, {
  foreignKey: 'menu_item_id',
  as: 'menuItem'
});

// Экспорт всех моделей и sequelize
module.exports = {
  sequelize,
  User,
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  OrderStatusHistory
};
