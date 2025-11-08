/**
 * Централизованный обработчик ошибок
 * Обрабатывает все ошибки приложения и возвращает соответствующие HTTP ответы
 */

const logger = require('../utils/logger');

/**
 * Основной обработчик ошибок
 * @param {Error} err - Ошибка
 * @param {Object} req - Запрос
 * @param {Object} res - Ответ
 * @param {Function} next - Следующий middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Логируем ошибку
  logger.logError(err, {
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    userId: req.user?.id
  });

  // Ошибки валидации Sequelize
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(error => error.message).join(', ');
    error = {
      message: `Ошибка валидации: ${message}`,
      statusCode: 400
    };
  }

  // Ошибки уникальности Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'поле';
    error = {
      message: `Значение для поля "${field}" уже существует`,
      statusCode: 409
    };
  }

  // Ошибки внешнего ключа Sequelize
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = {
      message: 'Нарушение связи с другой записью',
      statusCode: 400
    };
  }

  // Ошибки ограничений Sequelize
  if (err.name === 'SequelizeDatabaseError') {
    error = {
      message: 'Ошибка базы данных',
      statusCode: 500
    };
  }

  // Ошибки JWT
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Недействительный токен',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Токен истек',
      statusCode: 401
    };
  }

  // Ошибки валидации Joi
  if (err.isJoi) {
    const message = err.details.map(detail => detail.message).join(', ');
    error = {
      message: `Ошибка валидации: ${message}`,
      statusCode: 400
    };
  }

  // Ошибки Multer (загрузка файлов)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: 'Файл слишком большой',
      statusCode: 413
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      message: 'Неожиданное поле файла',
      statusCode: 400
    };
  }

  // Ошибки Redis
  if (err.code === 'ECONNREFUSED' && err.syscall === 'connect') {
    error = {
      message: 'Сервис временно недоступен',
      statusCode: 503
    };
  }

  // Ошибки WebSocket
  if (err.type === 'TransportError') {
    error = {
      message: 'Ошибка соединения',
      statusCode: 503
    };
  }

  // Ошибки по умолчанию
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Внутренняя ошибка сервера';

  // Формируем ответ
  const response = {
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  };

  // Добавляем дополнительную информацию для определенных ошибок
  if (statusCode === 400 && err.errors) {
    response.errors = err.errors;
  }

  if (statusCode === 404) {
    response.message = 'Ресурс не найден';
  }

  if (statusCode === 500) {
    response.message = 'Внутренняя ошибка сервера';
  }

  res.status(statusCode).json(response);
};

/**
 * Обработчик для несуществующих маршрутов
 * @param {Object} req - Запрос
 * @param {Object} res - Ответ
 * @param {Function} next - Следующий middleware
 */
const notFound = (req, res, next) => {
  const error = new Error(`Маршрут ${req.originalUrl} не найден`);
  error.statusCode = 404;
  next(error);
};

/**
 * Обработчик для асинхронных функций
 * Обертывает асинхронные функции для автоматической обработки ошибок
 * @param {Function} fn - Асинхронная функция
 * @returns {Function} - Обернутая функция
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Обработчик для WebSocket ошибок
 * @param {Error} err - Ошибка
 * @param {Object} socket - WebSocket соединение
 */
const socketErrorHandler = (err, socket) => {
  logger.logError(err, {
    socketId: socket.id,
    userId: socket.userId,
    type: 'websocket_error'
  });

  socket.emit('error', {
    message: 'Произошла ошибка',
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message 
    })
  });
};

/**
 * Обработчик для необработанных отклонений Promise
 * @param {Error} reason - Причина отклонения
 * @param {Promise} promise - Отклоненный Promise
 */
const unhandledRejectionHandler = (reason, promise) => {
  logger.logError(reason, {
    type: 'unhandled_rejection',
    promise: promise.toString()
  });
};

/**
 * Обработчик для необработанных исключений
 * @param {Error} error - Исключение
 */
const uncaughtExceptionHandler = (error) => {
  logger.logError(error, {
    type: 'uncaught_exception'
  });
  
  // Graceful shutdown
  process.exit(1);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  socketErrorHandler,
  unhandledRejectionHandler,
  uncaughtExceptionHandler
};
