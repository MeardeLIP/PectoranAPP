/**
 * Скрипт для инициализации базы данных тестовыми данными
 * Создает пользователей, категории меню и позиции меню
 */

const { connectDB } = require('../models/database');
const User = require('../models/User');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const logger = require('../utils/logger');

/**
 * Создание тестовых пользователей
 */
async function createUsers() {
  logger.info('👥 Создание тестовых пользователей...');

  const users = [
    // Официанты
    {
      username: 'waiter1',
      password_hash: null, // Официанты входят по номеру
      role: 'waiter',
      waiter_number: 1,
      full_name: 'Анна Смирнова',
      phone: '+79001234567',
      is_active: true
    },
    {
      username: 'waiter2',
      password_hash: null,
      role: 'waiter',
      waiter_number: 2,
      full_name: 'Дмитрий Петров',
      phone: '+79001234568',
      is_active: true
    },
    {
      username: 'waiter3',
      password_hash: null,
      role: 'waiter',
      waiter_number: 3,
      full_name: 'Елена Козлова',
      phone: '+79001234569',
      is_active: true
    },
    {
      username: 'waiter4',
      password_hash: null,
      role: 'waiter',
      waiter_number: 4,
      full_name: 'Михаил Волков',
      phone: '+79001234570',
      is_active: true
    },
    // Повара
    {
      username: 'cook101',
      password_hash: null, // Повара входят по номеру
      role: 'cook',
      waiter_number: 101,
      full_name: 'Игорь Шеф-повар',
      phone: '+79001234571',
      is_active: true
    },
    {
      username: 'cook102',
      password_hash: null,
      role: 'cook',
      waiter_number: 102,
      full_name: 'Ольга Су-шеф',
      phone: '+79001234572',
      is_active: true
    },
    // Администратор
    {
      username: 'admin',
      password_hash: 'admin123', // Будет захеширован автоматически
      role: 'admin',
      waiter_number: null,
      full_name: 'Администратор Системы',
      phone: '+79001234573',
      is_active: true
    },
    // Директор
    {
      username: 'director',
      password_hash: 'admin123', // Будет захеширован автоматически
      role: 'director',
      waiter_number: null,
      full_name: 'Директор Ресторана',
      phone: '+79001234574',
      is_active: true
    }
  ];

  for (const userData of users) {
    try {
      const existingUser = await User.findOne({
        where: {
          [userData.waiter_number ? 'waiter_number' : 'username']: 
            userData.waiter_number || userData.username
        }
      });

      if (!existingUser) {
        await User.create(userData);
        logger.info(`✅ Создан пользователь: ${userData.full_name} (${userData.role})`);
      } else {
        logger.info(`⚠️ Пользователь уже существует: ${userData.full_name}`);
      }
    } catch (error) {
      logger.error(`❌ Ошибка создания пользователя ${userData.full_name}:`, error.message);
      logger.error(`   Детали ошибки:`, error);
      if (error.errors) {
        error.errors.forEach(err => {
          logger.error(`   - ${err.message}`);
        });
      }
    }
  }
}

/**
 * Создание категорий меню
 */
async function createMenuCategories() {
  logger.info('📋 Создание категорий меню...');

  const categories = [
    {
      name: 'Горячие блюда',
      description: 'Основные горячие блюда',
      sort_order: 1,
      is_active: true
    },
    {
      name: 'Салаты',
      description: 'Свежие салаты и закуски',
      sort_order: 2,
      is_active: true
    },
    {
      name: 'Напитки',
      description: 'Горячие и холодные напитки',
      sort_order: 3,
      is_active: true
    },
    {
      name: 'Десерты',
      description: 'Сладкие блюда и выпечка',
      sort_order: 4,
      is_active: true
    },
    {
      name: 'Алкоголь',
      description: 'Алкогольные напитки',
      sort_order: 5,
      is_active: true
    }
  ];

  for (const categoryData of categories) {
    try {
      const existingCategory = await MenuCategory.findOne({
        where: { name: categoryData.name }
      });

      if (!existingCategory) {
        await MenuCategory.create(categoryData);
        logger.info(`✅ Создана категория: ${categoryData.name}`);
      } else {
        logger.info(`⚠️ Категория уже существует: ${categoryData.name}`);
      }
    } catch (error) {
      logger.error(`❌ Ошибка создания категории ${categoryData.name}:`, error.message);
    }
  }
}

/**
 * Создание позиций меню
 */
async function createMenuItems() {
  logger.info('🍽️ Создание позиций меню...');

  // Получаем категории
  const hotDishes = await MenuCategory.findOne({ where: { name: 'Горячие блюда' } });
  const salads = await MenuCategory.findOne({ where: { name: 'Салаты' } });
  const drinks = await MenuCategory.findOne({ where: { name: 'Напитки' } });
  const desserts = await MenuCategory.findOne({ where: { name: 'Десерты' } });
  const alcohol = await MenuCategory.findOne({ where: { name: 'Алкоголь' } });

  const menuItems = [
    // Горячие блюда
    {
      name: 'Стейк Рибай',
      description: 'Сочный стейк из говядины с картофелем фри',
      price: 1200.00,
      category_id: hotDishes?.id,
      preparation_time: 25,
      is_available: true,
      sort_order: 1
    },
    {
      name: 'Паста Карбонара',
      description: 'Спагетти с беконом, яйцом и пармезаном',
      price: 450.00,
      category_id: hotDishes?.id,
      preparation_time: 15,
      is_available: true,
      sort_order: 2
    },
    {
      name: 'Рыба на гриле',
      description: 'Лосось на гриле с овощами',
      price: 680.00,
      category_id: hotDishes?.id,
      preparation_time: 20,
      is_available: true,
      sort_order: 3
    },
    // Салаты
    {
      name: 'Цезарь с курицей',
      description: 'Классический салат Цезарь с куриной грудкой',
      price: 320.00,
      category_id: salads?.id,
      preparation_time: 10,
      is_available: true,
      sort_order: 1
    },
    {
      name: 'Греческий салат',
      description: 'Свежие овощи с фетой и оливками',
      price: 280.00,
      category_id: salads?.id,
      preparation_time: 8,
      is_available: true,
      sort_order: 2
    },
    // Напитки
    {
      name: 'Кофе американо',
      description: 'Крепкий черный кофе',
      price: 120.00,
      category_id: drinks?.id,
      preparation_time: 3,
      is_available: true,
      sort_order: 1
    },
    {
      name: 'Капучино',
      description: 'Кофе с молочной пенкой',
      price: 150.00,
      category_id: drinks?.id,
      preparation_time: 5,
      is_available: true,
      sort_order: 2
    },
    {
      name: 'Свежевыжатый апельсиновый сок',
      description: 'Натуральный апельсиновый сок',
      price: 180.00,
      category_id: drinks?.id,
      preparation_time: 2,
      is_available: true,
      sort_order: 3
    },
    // Десерты
    {
      name: 'Тирамису',
      description: 'Классический итальянский десерт',
      price: 250.00,
      category_id: desserts?.id,
      preparation_time: 5,
      is_available: true,
      sort_order: 1
    },
    {
      name: 'Чизкейк',
      description: 'Нежный чизкейк с ягодным соусом',
      price: 220.00,
      category_id: desserts?.id,
      preparation_time: 5,
      is_available: true,
      sort_order: 2
    },
    // Алкоголь
    {
      name: 'Вино красное сухое',
      description: 'Домашнее красное вино, 150мл',
      price: 350.00,
      category_id: alcohol?.id,
      preparation_time: 1,
      is_available: true,
      sort_order: 1
    },
    {
      name: 'Пиво разливное',
      description: 'Светлое пиво, 0.5л',
      price: 180.00,
      category_id: alcohol?.id,
      preparation_time: 1,
      is_available: true,
      sort_order: 2
    }
  ];

  for (const itemData of menuItems) {
    try {
      const existingItem = await MenuItem.findOne({
        where: { name: itemData.name }
      });

      if (!existingItem) {
        await MenuItem.create(itemData);
        logger.info(`✅ Создана позиция: ${itemData.name} - ${itemData.price}₽`);
      } else {
        logger.info(`⚠️ Позиция уже существует: ${itemData.name}`);
      }
    } catch (error) {
      logger.error(`❌ Ошибка создания позиции ${itemData.name}:`, error.message);
    }
  }
}

/**
 * Основная функция инициализации
 */
async function seedDatabase() {
  try {
    logger.info('🌱 Начинаем инициализацию базы данных...');

    // Подключение к базе данных
    await connectDB();
    logger.info('✅ Подключение к базе данных установлено');

    // Создание таблиц
    await User.sync({ force: false });
    await MenuCategory.sync({ force: false });
    await MenuItem.sync({ force: false });
    logger.info('✅ Таблицы базы данных синхронизированы');

    // Создание тестовых данных
    await createUsers();
    await createMenuCategories();
    await createMenuItems();

    logger.info('🎉 Инициализация базы данных завершена успешно!');
    logger.info('📊 Создано:');
    logger.info('   - 8 пользователей (4 официанта, 2 повара, 1 админ, 1 директор)');
    logger.info('   - 5 категорий меню');
    logger.info('   - 12 позиций меню');

  } catch (error) {
    logger.error('❌ Ошибка инициализации базы данных:', error);
    throw error;
  }
}

// Запуск скрипта, если он вызван напрямую
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('✅ Скрипт инициализации завершен');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Ошибка выполнения скрипта:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
