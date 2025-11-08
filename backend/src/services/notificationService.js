/**
 * Сервис для отправки push-уведомлений через Firebase Cloud Messaging
 */

const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Инициализация Firebase Admin SDK
let firebaseApp = null;

const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // В продакшене здесь должен быть путь к service account key файлу
    // Для разработки используем переменную окружения FIREBASE_SERVICE_ACCOUNT
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (!serviceAccount) {
      logger.warn('Firebase service account не настроен. Push-уведомления отключены.');
      return null;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    logger.info('Firebase Admin SDK инициализирован');
    return firebaseApp;
  } catch (error) {
    logger.error('Ошибка инициализации Firebase:', error);
    return null;
  }
};

/**
 * Отправка уведомления конкретному пользователю
 * @param {string} fcmToken - FCM токен пользователя
 * @param {Object} notification - Объект уведомления
 * @param {Object} data - Дополнительные данные
 */
const sendToUser = async (fcmToken, notification, data = {}) => {
  if (!firebaseApp) {
    logger.warn('Firebase не инициализирован. Уведомление не отправлено.');
    return false;
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#FF6B35',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    logger.info('Push-уведомление отправлено:', response);
    return true;
  } catch (error) {
    logger.error('Ошибка отправки push-уведомления:', error);
    return false;
  }
};

/**
 * Отправка уведомления всем пользователям с определенной ролью
 * @param {string} role - Роль пользователей (waiter, cook, admin, director)
 * @param {Object} notification - Объект уведомления
 * @param {Object} data - Дополнительные данные
 */
const sendToRole = async (role, notification, data = {}) => {
  if (!firebaseApp) {
    logger.warn('Firebase не инициализирован. Уведомление не отправлено.');
    return false;
  }

  try {
    const User = require('../models/User');
    const users = await User.findAll({
      where: { 
        role: role,
        fcm_token: { [require('sequelize').Op.ne]: null }
      },
      attributes: ['fcm_token']
    });

    if (users.length === 0) {
      logger.info(`Нет пользователей с ролью ${role} и FCM токенами`);
      return false;
    }

    const tokens = users.map(user => user.fcm_token).filter(Boolean);
    
    const message = {
      tokens: tokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#FF6B35',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().sendMulticast(message);
    logger.info(`Push-уведомление отправлено ${response.successCount} из ${tokens.length} пользователей с ролью ${role}`);
    return response.successCount > 0;
  } catch (error) {
    logger.error('Ошибка отправки push-уведомления по ролям:', error);
    return false;
  }
};

/**
 * Отправка уведомления о готовности заказа официанту
 * @param {Object} order - Объект заказа
 * @param {Object} waiter - Объект официанта
 */
const sendOrderReadyNotification = async (order, waiter) => {
  if (!waiter.fcm_token) {
    logger.info(`У официанта ${waiter.username} нет FCM токена`);
    return false;
  }

  const notification = {
    title: 'Заказ готов! 🍽️',
    body: `Заказ #${order.id} для столика ${order.table_number} готов к подаче`,
  };

  const data = {
    type: 'order_ready',
    order_id: order.id.toString(),
    table_number: order.table_number.toString(),
    waiter_id: waiter.id.toString(),
  };

  return await sendToUser(waiter.fcm_token, notification, data);
};

/**
 * Отправка уведомления о новом заказе поварам
 * @param {Object} order - Объект заказа
 */
const sendNewOrderNotification = async (order) => {
  const notification = {
    title: 'Новый заказ! 📝',
    body: `Поступил заказ #${order.id} для столика ${order.table_number}`,
  };

  const data = {
    type: 'new_order',
    order_id: order.id.toString(),
    table_number: order.table_number.toString(),
    waiter_id: order.waiter_id.toString(),
  };

  return await sendToRole('cook', notification, data);
};

module.exports = {
  initializeFirebase,
  sendToUser,
  sendToRole,
  sendOrderReadyNotification,
  sendNewOrderNotification,
};
