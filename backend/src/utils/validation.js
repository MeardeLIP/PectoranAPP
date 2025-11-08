/**
 * Схемы валидации для API endpoints
 * Использует Joi для валидации входящих данных
 */

const Joi = require('joi');

/**
 * Схема валидации для входа директора (требует пароль)
 */
const directorLoginSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.min': 'Имя пользователя должно содержать минимум 3 символа',
      'string.max': 'Имя пользователя не должно превышать 50 символов',
      'any.required': 'Имя пользователя обязательно'
    }),
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'Пароль должен содержать минимум 6 символов',
      'string.max': 'Пароль не должен превышать 100 символов',
      'any.required': 'Пароль обязателен'
    })
});

/**
 * Схема валидации для входа администратора (только логин)
 */
const adminLoginSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.min': 'Имя пользователя должно содержать минимум 3 символа',
      'string.max': 'Имя пользователя не должно превышать 50 символов',
      'any.required': 'Имя пользователя обязательно'
    })
});

/**
 * Схема валидации для быстрого входа официанта/повара
 */
const quickLoginSchema = Joi.object({
  // Допускаем либо числовой номер, либо строковый идентификатор (например, cook1)
  waiter_number: Joi.alternatives().try(
    Joi.number().integer().min(1).max(999),
    Joi.string().min(2).max(50)
  )
  .required()
  .messages({
    'any.required': 'Номер обязателен',
  }),
  role: Joi.string()
    .valid('waiter', 'cook')
    .required()
    .messages({
      'any.only': 'Роль должна быть "waiter" или "cook"',
      'any.required': 'Роль обязательна'
    })
});

/**
 * Схема валидации для создания пользователя
 */
const createUserSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.min': 'Имя пользователя должно содержать минимум 3 символа',
      'string.max': 'Имя пользователя не должно превышать 50 символов',
      'any.required': 'Имя пользователя обязательно'
    }),
  password: Joi.string()
    .min(6)
    .max(100)
    .when('role', {
      is: Joi.string().valid('director'),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.min': 'Пароль должен содержать минимум 6 символов',
      'string.max': 'Пароль не должен превышать 100 символов'
    }),
  role: Joi.string()
    .valid('waiter', 'cook', 'admin', 'director')
    .required()
    .messages({
      'any.only': 'Роль должна быть одной из: waiter, cook, admin, director',
      'any.required': 'Роль обязательна'
    }),
  waiter_number: Joi.number()
    .integer()
    .min(1)
    .max(999)
    .when('role', {
      is: Joi.string().valid('waiter', 'cook'),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'number.base': 'Номер должен быть числом',
      'number.integer': 'Номер должен быть целым числом',
      'number.min': 'Номер должен быть больше 0',
      'number.max': 'Номер не должен превышать 999'
    }),
  full_name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Полное имя должно содержать минимум 2 символа',
      'string.max': 'Полное имя не должно превышать 100 символов'
    }),
  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Неверный формат телефона'
    })
});

/**
 * Схема валидации для создания категории меню
 */
const createMenuCategorySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Название категории должно содержать минимум 2 символа',
      'string.max': 'Название категории не должно превышать 100 символов',
      'any.required': 'Название категории обязательно'
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Описание не должно превышать 500 символов'
    }),
  icon: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Название иконки не должно превышать 50 символов'
    }),
  color: Joi.string()
    .pattern(/^#[0-9A-F]{6}$/i)
    .optional()
    .messages({
      'string.pattern.base': 'Цвет должен быть в HEX формате (#RRGGBB)'
    })
});

/**
 * Схема валидации для создания позиции меню
 */
const createMenuItemSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.min': 'Название позиции должно содержать минимум 2 символа',
      'string.max': 'Название позиции не должно превышать 200 символов',
      'any.required': 'Название позиции обязательно'
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Описание не должно превышать 1000 символов'
    }),
  price: Joi.number()
    .positive()
    .precision(2)
    .max(999999.99)
    .required()
    .messages({
      'number.positive': 'Цена должна быть положительной',
      'number.precision': 'Цена должна иметь максимум 2 знака после запятой',
      'number.max': 'Цена не должна превышать 999999.99',
      'any.required': 'Цена обязательна'
    }),
  category_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID категории должен быть числом',
      'number.integer': 'ID категории должен быть целым числом',
      'number.positive': 'ID категории должен быть положительным',
      'any.required': 'ID категории обязателен'
    }),
  image_url: Joi.string()
    .uri()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Неверный формат URL изображения',
      'string.max': 'URL изображения не должен превышать 500 символов'
    }),
  preparation_time: Joi.number()
    .integer()
    .min(1)
    .max(999)
    .optional()
    .messages({
      'number.base': 'Время приготовления должно быть числом',
      'number.integer': 'Время приготовления должно быть целым числом',
      'number.min': 'Время приготовления должно быть больше 0',
      'number.max': 'Время приготовления не должно превышать 999 минут'
    }),
  calories: Joi.number()
    .integer()
    .min(0)
    .max(9999)
    .optional()
    .messages({
      'number.base': 'Калории должны быть числом',
      'number.integer': 'Калории должны быть целым числом',
      'number.min': 'Калории не могут быть отрицательными',
      'number.max': 'Калории не должны превышать 9999'
    }),
  allergens: Joi.array()
    .items(Joi.string().max(50))
    .optional()
    .messages({
      'array.base': 'Аллергены должны быть массивом',
      'string.max': 'Название аллергена не должно превышать 50 символов'
    }),
  ingredients: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Список ингредиентов не должен превышать 1000 символов'
    })
});

/**
 * Схема валидации для создания заказа
 */
const createOrderSchema = Joi.object({
  table_number: Joi.number()
    .integer()
    .min(1)
    .max(999)
    .required()
    .messages({
      'number.base': 'Номер столика должен быть числом',
      'number.integer': 'Номер столика должен быть целым числом',
      'number.min': 'Номер столика должен быть больше 0',
      'number.max': 'Номер столика не должен превышать 999',
      'any.required': 'Номер столика обязателен'
    }),
  items: Joi.array()
    .items(Joi.object({
      menu_item_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
          'number.base': 'ID позиции меню должен быть числом',
          'number.integer': 'ID позиции меню должен быть целым числом',
          'number.positive': 'ID позиции меню должен быть положительным',
          'any.required': 'ID позиции меню обязательно'
        }),
      quantity: Joi.number()
        .integer()
        .min(1)
        .max(99)
        .required()
        .messages({
          'number.base': 'Количество должно быть числом',
          'number.integer': 'Количество должно быть целым числом',
          'number.min': 'Количество должно быть больше 0',
          'number.max': 'Количество не должно превышать 99',
          'any.required': 'Количество обязательно'
        }),
      notes: Joi.string()
        .max(200)
        .optional()
        .allow('')
        .messages({
          'string.max': 'Заметки не должны превышать 200 символов'
        })
    }))
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'Заказ должен содержать минимум 1 позицию',
      'array.max': 'Заказ не должен содержать более 50 позиций',
      'any.required': 'Позиции заказа обязательны'
    }),
  notes: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Заметки к заказу не должны превышать 500 символов'
    }),
  customer_name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.min': 'Имя клиента должно содержать минимум 2 символа',
      'string.max': 'Имя клиента не должно превышать 100 символов'
    }),
  customer_phone: Joi.any().optional()
});

/**
 * Схема валидации для изменения статуса заказа
 */
const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('new', 'accepted', 'preparing', 'ready', 'delivered')
    .required()
    .messages({
      'any.only': 'Статус должен быть одним из: new, accepted, preparing, ready, delivered',
      'any.required': 'Статус обязателен'
    }),
  notes: Joi.string()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Заметки не должны превышать 200 символов'
    })
});

/**
 * Схема валидации для параметров запроса статистики
 */
const statsQuerySchema = Joi.object({
  start_date: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Дата начала должна быть в формате ISO 8601'
    }),
  end_date: Joi.date()
    .iso()
    .min(Joi.ref('start_date'))
    .optional()
    .messages({
      'date.format': 'Дата окончания должна быть в формате ISO 8601',
      'date.min': 'Дата окончания должна быть больше или равна дате начала'
    }),
  waiter_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID официанта должен быть числом',
      'number.integer': 'ID официанта должен быть целым числом',
      'number.positive': 'ID официанта должен быть положительным'
    })
});

/**
 * Middleware для валидации запроса
 * @param {Object} schema - Схема валидации Joi
 * @param {string} property - Свойство запроса для валидации ('body', 'query', 'params')
 * @returns {Function} - Middleware функция
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    console.log('🔍 [validation] Валидируем данные:', req[property]);
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      console.error('❌ [validation] Ошибка валидации:', error.details);
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Заменяем валидированные данные
    req[property] = value;
    next();
  };
};

module.exports = {
  adminLoginSchema,
  directorLoginSchema,
  quickLoginSchema,
  createUserSchema,
  createMenuCategorySchema,
  createMenuItemSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  statsQuerySchema,
  validate
};
