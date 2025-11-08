/**
 * Маршруты для управления меню
 * CRUD операции для категорий и позиций меню
 */

const express = require('express');
const { MenuCategory, MenuItem } = require('../models');
const { authenticateToken, requireRole, logUserAction } = require('../middleware/auth');
const { validate, createMenuCategorySchema, createMenuItemSchema } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { cacheMenu, getCachedMenu } = require('../services/redis');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/menu
 * Получение активного меню (для всех ролей)
 */
router.get('/', asyncHandler(async (req, res) => {
  // Пытаемся получить меню из кэша
  let menu = await getCachedMenu();
  
  if (!menu) {
    // Если в кэше нет, получаем из БД
    const categories = await MenuCategory.getActiveCategories();
    
    menu = await Promise.all(categories.map(async (category) => {
      const items = await category.getActiveItems();
      return {
        ...category.toPublicJSON(),
        items: items.map(item => item.toPublicJSON())
      };
    }));
    
    // Кэшируем меню
    await cacheMenu(menu);
  }

  res.json({
    success: true,
    data: { menu }
  });
}));

/**
 * GET /api/menu/categories
 * Получение всех категорий меню (только для директора)
 */
router.get('/categories', 
  authenticateToken, 
  requireRole(['director']), 
  asyncHandler(async (req, res) => {
    const categories = await MenuCategory.findAll({
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: { categories: categories.map(cat => cat.toPublicJSON()) }
    });
  })
);

/**
 * POST /api/menu/categories
 * Создание новой категории меню (только для директора)
 */
router.post('/categories', 
  authenticateToken, 
  requireRole(['director']),
  validate(createMenuCategorySchema),
  logUserAction('create_menu_category'),
  asyncHandler(async (req, res) => {
    const category = await MenuCategory.createWithAutoSort(req.body);

    logger.logUserAction(req.user.id, 'menu_category_created', {
      categoryId: category.id,
      categoryName: category.name
    });

    res.status(201).json({
      success: true,
      message: 'Категория создана успешно',
      data: { category: category.toPublicJSON() }
    });
  })
);

/**
 * PUT /api/menu/categories/:id
 * Обновление категории меню (только для директора)
 */
router.put('/categories/:id', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('update_menu_category'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await MenuCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    await category.update(req.body);

    logger.logUserAction(req.user.id, 'menu_category_updated', {
      categoryId: category.id,
      categoryName: category.name
    });

    res.json({
      success: true,
      message: 'Категория обновлена успешно',
      data: { category: category.toPublicJSON() }
    });
  })
);

/**
 * DELETE /api/menu/categories/:id
 * Удаление категории меню (только для директора)
 */
router.delete('/categories/:id', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('delete_menu_category'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await MenuCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    await category.softDelete();

    logger.logUserAction(req.user.id, 'menu_category_deleted', {
      categoryId: category.id,
      categoryName: category.name
    });

    res.json({
      success: true,
      message: 'Категория удалена успешно'
    });
  })
);

/**
 * GET /api/menu/items
 * Получение всех позиций меню (только для директора)
 */
router.get('/items', 
  authenticateToken, 
  requireRole(['director']), 
  asyncHandler(async (req, res) => {
    const { category_id, search, min_price, max_price } = req.query;
    
    let whereClause = {};
    
    if (category_id) {
      whereClause.category_id = category_id;
    }
    
    if (search) {
      whereClause.name = {
        [require('sequelize').Op.iLike]: `%${search}%`
      };
    }
    
    if (min_price && max_price) {
      whereClause.price = {
        [require('sequelize').Op.between]: [min_price, max_price]
      };
    }

    const items = await MenuItem.findAll({
      where: whereClause,
      include: ['category'],
      order: [['category_id', 'ASC'], ['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: { 
        items: items.map(item => ({
          ...item.toPublicJSON(),
          category: item.category?.toPublicJSON()
        }))
      }
    });
  })
);

/**
 * POST /api/menu/items
 * Создание новой позиции меню (только для директора)
 */
router.post('/items', 
  authenticateToken, 
  requireRole(['director']),
  validate(createMenuItemSchema),
  logUserAction('create_menu_item'),
  asyncHandler(async (req, res) => {
    const itemData = {
      ...req.body,
      created_by: req.user.id
    };

    const item = await MenuItem.create(itemData);

    logger.logUserAction(req.user.id, 'menu_item_created', {
      itemId: item.id,
      itemName: item.name,
      price: item.price
    });

    res.status(201).json({
      success: true,
      message: 'Позиция меню создана успешно',
      data: { item: item.toPublicJSON() }
    });
  })
);

/**
 * PUT /api/menu/items/:id
 * Обновление позиции меню (только для директора)
 */
router.put('/items/:id', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('update_menu_item'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await MenuItem.findByPk(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Позиция меню не найдена'
      });
    }

    await item.update(req.body);

    logger.logUserAction(req.user.id, 'menu_item_updated', {
      itemId: item.id,
      itemName: item.name,
      price: item.price
    });

    res.json({
      success: true,
      message: 'Позиция меню обновлена успешно',
      data: { item: item.toPublicJSON() }
    });
  })
);

/**
 * DELETE /api/menu/items/:id
 * Удаление позиции меню (только для директора)
 */
router.delete('/items/:id', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('delete_menu_item'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await MenuItem.findByPk(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Позиция меню не найдена'
      });
    }

    await item.softDelete();

    logger.logUserAction(req.user.id, 'menu_item_deleted', {
      itemId: item.id,
      itemName: item.name
    });

    res.json({
      success: true,
      message: 'Позиция меню удалена успешно'
    });
  })
);

/**
 * PUT /api/menu/items/:id/availability
 * Изменение доступности позиции меню (только для директора)
 */
router.put('/items/:id/availability', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('toggle_menu_item_availability'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_available } = req.body;
    
    const item = await MenuItem.findByPk(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Позиция меню не найдена'
      });
    }

    await item.setAvailability(is_available);

    logger.logUserAction(req.user.id, 'menu_item_availability_changed', {
      itemId: item.id,
      itemName: item.name,
      is_available
    });

    res.json({
      success: true,
      message: `Позиция ${is_available ? 'доступна' : 'недоступна'} для заказа`,
      data: { item: item.toPublicJSON() }
    });
  })
);

/**
 * GET /api/menu/popular
 * Получение популярных позиций меню (только для директора)
 */
router.get('/popular', 
  authenticateToken, 
  requireRole(['director']), 
  asyncHandler(async (req, res) => {
    const { limit = 10, start_date, end_date } = req.query;
    
    let dateRange = {};
    if (start_date && end_date) {
      dateRange = {
        created_at: {
          [require('sequelize').Op.between]: [new Date(start_date), new Date(end_date)]
        }
      };
    }

    const popularItems = await MenuItem.getPopularItems(parseInt(limit));

    res.json({
      success: true,
      data: { 
        popularItems: popularItems.map(item => item.toPublicJSON())
      }
    });
  })
);

// ==================== CRUD для категорий меню ====================

/**
 * POST /api/menu/categories
 * Создание новой категории меню (только для директора)
 */
router.post('/categories', 
  authenticateToken, 
  requireRole(['director']),
  validate(createMenuCategorySchema),
  logUserAction('create_menu_category'),
  asyncHandler(async (req, res) => {
    const { name, description, sort_order } = req.body;

    const category = await MenuCategory.create({
      name,
      description,
      sort_order: sort_order || 0,
      is_active: true
    });

    // Очищаем кэш меню
    await cacheMenu(null);

    logger.info(`Создана категория меню: ${category.name}`);

    res.status(201).json({
      success: true,
      message: 'Категория создана успешно',
      data: { category: category.toPublicJSON() }
    });
  })
);

/**
 * PUT /api/menu/categories/:id
 * Обновление категории меню (только для директора)
 */
router.put('/categories/:id', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('update_menu_category'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, sort_order, is_active } = req.body;

    const category = await MenuCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      sort_order: sort_order !== undefined ? sort_order : category.sort_order,
      is_active: is_active !== undefined ? is_active : category.is_active
    });

    // Очищаем кэш меню
    await cacheMenu(null);

    logger.info(`Обновлена категория меню: ${category.name}`);

    res.json({
      success: true,
      message: 'Категория обновлена успешно',
      data: { category: category.toPublicJSON() }
    });
  })
);

/**
 * DELETE /api/menu/categories/:id
 * Удаление категории меню (только для директора)
 */
router.delete('/categories/:id', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('delete_menu_category'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await MenuCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    // Проверяем, есть ли активные позиции в категории
    const activeItemsCount = await MenuItem.count({
      where: { 
        category_id: id, 
        is_active: true 
      }
    });

    if (activeItemsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя удалить категорию с активными позициями'
      });
    }

    await category.destroy();

    // Очищаем кэш меню
    await cacheMenu(null);

    logger.info(`Удалена категория меню: ${category.name}`);

    res.json({
      success: true,
      message: 'Категория удалена успешно'
    });
  })
);

// ==================== CRUD для позиций меню ====================

/**
 * POST /api/menu/items
 * Создание новой позиции меню (только для директора)
 */
router.post('/items', 
  authenticateToken, 
  requireRole(['director']),
  validate(createMenuItemSchema),
  logUserAction('create_menu_item'),
  asyncHandler(async (req, res) => {
    const { 
      name, 
      description, 
      price, 
      category_id, 
      preparation_time, 
      is_vegetarian, 
      is_spicy, 
      allergens, 
      sort_order 
    } = req.body;

    // Проверяем существование категории
    const category = await MenuCategory.findByPk(category_id);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    const item = await MenuItem.create({
      name,
      description,
      price,
      category_id,
      preparation_time: preparation_time || 15,
      is_vegetarian: is_vegetarian || false,
      is_spicy: is_spicy || false,
      allergens: allergens || [],
      sort_order: sort_order || 0,
      is_active: true,
      is_available: true
    });

    // Очищаем кэш меню
    await cacheMenu(null);

    logger.info(`Создана позиция меню: ${item.name}`);

    res.status(201).json({
      success: true,
      message: 'Позиция создана успешно',
      data: { item: item.toPublicJSON() }
    });
  })
);

/**
 * PUT /api/menu/items/:id
 * Обновление позиции меню (только для директора)
 */
router.put('/items/:id', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('update_menu_item'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const item = await MenuItem.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Позиция не найдена'
      });
    }

    // Если меняется категория, проверяем её существование
    if (updateData.category_id && updateData.category_id !== item.category_id) {
      const category = await MenuCategory.findByPk(updateData.category_id);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Категория не найдена'
        });
      }
    }

    await item.update(updateData);

    // Очищаем кэш меню
    await cacheMenu(null);

    logger.info(`Обновлена позиция меню: ${item.name}`);

    res.json({
      success: true,
      message: 'Позиция обновлена успешно',
      data: { item: item.toPublicJSON() }
    });
  })
);

/**
 * DELETE /api/menu/items/:id
 * Удаление позиции меню (только для директора)
 */
router.delete('/items/:id', 
  authenticateToken, 
  requireRole(['director']),
  logUserAction('delete_menu_item'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const item = await MenuItem.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Позиция не найдена'
      });
    }

    await item.destroy();

    // Очищаем кэш меню
    await cacheMenu(null);

    logger.info(`Удалена позиция меню: ${item.name}`);

    res.json({
      success: true,
      message: 'Позиция удалена успешно'
    });
  })
);

module.exports = router;
