/**
 * Настройка подключения к базе данных PostgreSQL
 * Использует Sequelize ORM для работы с БД
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Конфигурация подключения к БД
const sequelize = new Sequelize(
  process.env.DB_NAME || 'pectoran_restaurant',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg), // Логирование SQL запросов в debug режиме
    pool: {
      max: 10, // Максимальное количество соединений
      min: 0,  // Минимальное количество соединений
      acquire: 30000, // Время ожидания получения соединения
      idle: 10000     // Время простоя соединения
    },
    define: {
      timestamps: true, // Автоматические поля created_at и updated_at
      underscored: true, // Использование snake_case для полей
      freezeTableName: true // Не изменять имена таблиц
    }
  }
);

/**
 * Подключение к базе данных
 * Проверяет соединение и синхронизирует модели
 */
async function connectDB() {
  try {
    // Проверка соединения
    await sequelize.authenticate();
    logger.info('✅ Подключение к PostgreSQL установлено успешно');

    // Синхронизация моделей с БД (создание таблиц если их нет)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true }); // В development режиме обновляет структуру
      logger.info('✅ Модели синхронизированы с базой данных');
    } else {
      await sequelize.sync(); // В production только создает отсутствующие таблицы
      logger.info('✅ Модели синхронизированы с базой данных');
    }

  } catch (error) {
    logger.error('❌ Ошибка подключения к базе данных:', error);
    throw error;
  }
}

/**
 * Закрытие соединения с базой данных
 */
async function closeDB() {
  try {
    await sequelize.close();
    logger.info('✅ Соединение с базой данных закрыто');
  } catch (error) {
    logger.error('❌ Ошибка при закрытии соединения с БД:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  connectDB,
  closeDB
};
