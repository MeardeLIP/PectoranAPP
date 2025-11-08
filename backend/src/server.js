/**
 * Главный файл сервера PectoranAPP
 * Настройка Express сервера, подключение к БД, WebSocket, middleware
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const os = require('os');
require('dotenv').config();

const { connectDB } = require('./models/database');
const { connectRedis } = require('./services/redis');
const { seedDatabase } = require('./scripts/seedDatabase');
// const { initializeFirebase } = require('./services/notificationService');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const statsRoutes = require('./routes/stats');
const userRoutes = require('./routes/users');
const { setupSocketIO } = require('./services/socketService');

const app = express();
const server = createServer(app);

// Настройка trust proxy для работы с ngrok и другими прокси
// Это необходимо, чтобы Express правильно обрабатывал заголовки X-Forwarded-For, X-Forwarded-Proto
// Без этого rate limiter будет выдавать ошибки при работе через ngrok
// Используем числовое значение 1, что означает доверие первому прокси в цепочке
// Это более явное указание для express-rate-limit
app.set('trust proxy', 1);

// Функция для получения локального IP адреса
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  // Список приоритетных интерфейсов (обычно Wi-Fi или Ethernet)
  const priorityInterfaces = ['Wi-Fi', 'Ethernet', 'eth0', 'wlan0', 'en0'];
  
  // Сначала проверяем приоритетные интерфейсы
  for (const interfaceName of priorityInterfaces) {
    if (interfaces[interfaceName]) {
      for (const address of interfaces[interfaceName]) {
        if (address.family === 'IPv4' && !address.internal) {
          return address.address;
        }
      }
    }
  }
  
  // Если не нашли в приоритетных, проверяем все интерфейсы
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    for (const address of addresses) {
      // Игнорируем внутренние и не-IPv4 адреса
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  
  return 'localhost';
}

// Функция для проверки ngrok домена
function isNgrokDomain(origin) {
  if (!origin) return false;
  const ngrokPatterns = [
    /^https?:\/\/.*\.ngrok\.io/i,
    /^https?:\/\/.*\.ngrok-free\.app/i,
    /^https?:\/\/.*\.ngrok\.app/i,
    /^https?:\/\/.*\.ngrok\.dev/i
  ];
  return ngrokPatterns.some(pattern => pattern.test(origin));
}

// Настройка Socket.IO
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // В development режиме разрешаем все источники для удобства тестирования
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        return callback(null, true);
      }
      
      // Разрешаем ngrok домены в любом режиме
      if (isNgrokDomain(origin)) {
        return callback(null, true);
      }
      
      // В production используем строгие правила
      const allowedOrigins = [
        process.env.WS_CORS_ORIGIN || "http://localhost:3000",
        "http://localhost:3001"  // TV Display
      ];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"]
  }
});

// Middleware безопасности
app.use(helmet());
app.use(compression());

// CORS настройки
// В development режиме разрешаем все источники для удобства тестирования на реальных устройствах
const corsOptions = process.env.NODE_ENV === 'production' ? {
  origin: function (origin, callback) {
    // Разрешаем ngrok домены
    if (isNgrokDomain(origin)) {
      return callback(null, true);
    }
    
    // Разрешаем указанные домены
    const allowedOrigins = [
      process.env.CORS_ORIGIN || "http://localhost:3000",
      "http://localhost:3001"  // TV Display
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
} : {
  origin: true, // Разрешаем все источники в development (включая ngrok)
  credentials: true
};

app.use(cors(corsOptions));

// Логирование запросов
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Rate limiting
// Настраиваем для правильной работы с прокси (ngrok)
// Благодаря app.set('trust proxy', 1) выше, Express автоматически извлекает реальный IP клиента
// из заголовка X-Forwarded-For, который добавляет ngrok
// Это позволяет rate limiter правильно идентифицировать клиентов
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 минут
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // лимит запросов
  message: 'Слишком много запросов с этого IP, попробуйте позже',
  standardHeaders: true,
  legacyHeaders: false,
  // Используем req.ip, который благодаря trust proxy содержит реальный IP клиента
  // Express автоматически парсит X-Forwarded-For и устанавливает req.ip
  // req.ip будет содержать реальный IP клиента (не IP ngrok) благодаря trust proxy
  keyGenerator: (req) => {
    // req.ip уже содержит правильный IP благодаря app.set('trust proxy', 1)
    // Если trust proxy включен, Express автоматически извлекает IP из X-Forwarded-For
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  // Отключаем валидацию xForwardedForHeader, так как мы правильно настроили trust proxy
  // Это предотвращает ошибку "X-Forwarded-For header is set but trust proxy is false"
  validate: {
    xForwardedForHeader: false,
  },
});
app.use('/api/', limiter);

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статические файлы
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Network info endpoint - для получения информации о сети
app.get('/api/network-info', (req, res) => {
  const localIP = getLocalIPAddress();
  const port = process.env.PORT || 3000;
  
  res.status(200).json({
    success: true,
    data: {
      localIP,
      port,
      apiUrl: `http://${localIP}:${port}/api`,
      wsUrl: `ws://${localIP}:${port}`,
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Эндпоинт не найден',
    path: req.originalUrl
  });
});

// Настройка Socket.IO
setupSocketIO(io);

// Error handling middleware (должен быть последним)
app.use(errorHandler);

// Инициализация сервера
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Подключение к базе данных
    await connectDB();
    logger.info('✅ Подключение к PostgreSQL успешно');

    // Инициализация тестовых данных (если включено)
    if (process.env.SEED_DATABASE === 'true') {
      try {
        await seedDatabase();
        logger.info('✅ Тестовые данные инициализированы');
      } catch (error) {
        logger.warn('⚠️ Ошибка инициализации тестовых данных:', error.message);
      }
    }

    // Подключение к Redis (опционально)
    try {
      await connectRedis();
      logger.info('✅ Подключение к Redis успешно');
    } catch (error) {
      logger.warn('⚠️ Redis недоступен, работаем без кэширования:', error.message);
    }

    // Инициализация Firebase для push-уведомлений
    // try {
    //   await initializeFirebase();
    //   logger.info('✅ Firebase инициализирован');
    // } catch (error) {
    //   logger.warn('⚠️ Firebase недоступен, push-уведомления отключены:', error.message);
    // }

    // Запуск сервера на всех интерфейсах (0.0.0.0) для доступа из локальной сети
    const HOST = '0.0.0.0';
    server.listen(PORT, HOST, () => {
      const localIP = getLocalIPAddress();
      logger.info(`🚀 Сервер запущен на порту ${PORT}`);
      logger.info(`📱 API доступно по адресу:`);
      logger.info(`   - Локально: http://localhost:${PORT}/api`);
      logger.info(`   - В сети: http://${localIP}:${PORT}/api`);
      logger.info(`🔌 WebSocket доступен на:`);
      logger.info(`   - Локально: ws://localhost:${PORT}`);
      logger.info(`   - В сети: ws://${localIP}:${PORT}`);
      logger.info(`🌍 Окружение: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📡 Для тестирования на реальных устройствах используйте IP: ${localIP}`);
    });

  } catch (error) {
    logger.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 Получен SIGTERM, завершение работы сервера...');
  server.close(() => {
    logger.info('✅ Сервер успешно завершил работу');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('🛑 Получен SIGINT, завершение работы сервера...');
  server.close(() => {
    logger.info('✅ Сервер успешно завершил работу');
    process.exit(0);
  });
});

// Обработка необработанных исключений
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Необработанное отклонение Promise:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Необработанное исключение:', error);
  process.exit(1);
});

startServer();

module.exports = { app, server, io };
