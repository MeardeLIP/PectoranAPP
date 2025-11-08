/**
 * Централизованная система логирования
 * Использует Winston для структурированного логирования
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Создание папки для логов если её нет
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Определение уровней логирования
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Цвета для консольного вывода
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Формат логов
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Транспорты для логирования
const transports = [
  // Консольный вывод
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: format
  }),
  
  // Файл для всех логов
  new winston.transports.File({
    filename: path.join(logDir, 'app.log'),
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // Файл только для ошибок
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Создание логгера
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
  exitOnError: false
});

// Специальные методы для разных типов логов
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id || 'anonymous'
  };
  
  logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms`, logData);
};

logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context
  });
};

logger.logUserAction = (userId, action, details = {}) => {
  logger.info(`User Action: ${action}`, {
    userId,
    action,
    ...details,
    timestamp: new Date().toISOString()
  });
};

logger.logOrderEvent = (orderId, event, details = {}) => {
  logger.info(`Order Event: ${event}`, {
    orderId,
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

logger.logWebSocketEvent = (event, data = {}) => {
  logger.debug(`WebSocket Event: ${event}`, {
    event,
    ...data,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;
