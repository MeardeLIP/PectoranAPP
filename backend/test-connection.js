/**
 * Скрипт для проверки подключения к базе данных
 * Запустите: node test-connection.js
 */

require('dotenv').config();
const { connectDB } = require('./src/models/database');
const User = require('./src/models/User');
const MenuCategory = require('./src/models/MenuCategory');
const MenuItem = require('./src/models/MenuItem');
const logger = require('./src/utils/logger');

async function testConnection() {
  try {
    logger.info('🔍 Тестирование подключения к базе данных...');
    
    // Подключение к базе данных
    await connectDB();
    logger.info('✅ Подключение к PostgreSQL успешно');
    
    // Проверка таблиц
    await User.sync({ force: false });
    await MenuCategory.sync({ force: false });
    await MenuItem.sync({ force: false });
    logger.info('✅ Таблицы синхронизированы');
    
    // Проверка количества записей
    const userCount = await User.count();
    const categoryCount = await MenuCategory.count();
    const itemCount = await MenuItem.count();
    
    logger.info('📊 Статистика базы данных:');
    logger.info(`   - Пользователей: ${userCount}`);
    logger.info(`   - Категорий меню: ${categoryCount}`);
    logger.info(`   - Позиций меню: ${itemCount}`);
    
    // Проверка тестовых пользователей
    const waiters = await User.findAll({ where: { role: 'waiter' } });
    const cooks = await User.findAll({ where: { role: 'cook' } });
    const admins = await User.findAll({ where: { role: 'admin' } });
    const directors = await User.findAll({ where: { role: 'director' } });
    
    logger.info('👥 Пользователи по ролям:');
    logger.info(`   - Официанты: ${waiters.length}`);
    logger.info(`   - Повара: ${cooks.length}`);
    logger.info(`   - Администраторы: ${admins.length}`);
    logger.info(`   - Директора: ${directors.length}`);
    
    if (waiters.length > 0) {
      logger.info('🍽️ Тестовые официанты:');
      waiters.forEach(waiter => {
        logger.info(`   - ${waiter.full_name} (номер: ${waiter.waiter_number})`);
      });
    }
    
    if (cooks.length > 0) {
      logger.info('👨‍🍳 Тестовые повара:');
      cooks.forEach(cook => {
        logger.info(`   - ${cook.full_name} (номер: ${cook.waiter_number})`);
      });
    }
    
    if (admins.length > 0) {
      logger.info('👨‍💼 Администраторы:');
      admins.forEach(admin => {
        logger.info(`   - ${admin.username} (${admin.full_name})`);
      });
    }
    
    if (directors.length > 0) {
      logger.info('👔 Директора:');
      directors.forEach(director => {
        logger.info(`   - ${director.username} (${director.full_name})`);
      });
    }
    
    logger.info('🎉 Тест подключения завершен успешно!');
    logger.info('🚀 Теперь можно запускать сервер: npm run dev');
    
  } catch (error) {
    logger.error('❌ Ошибка тестирования подключения:', error);
    logger.error('💡 Проверьте:');
    logger.error('   1. PostgreSQL запущен');
    logger.error('   2. База данных "pectoran_restaurant" создана');
    logger.error('   3. Пользователь "pectoranuser" имеет права доступа');
    logger.error('   4. Файл .env настроен правильно');
    process.exit(1);
  }
}

testConnection();
