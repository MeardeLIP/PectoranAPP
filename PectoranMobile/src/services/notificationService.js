/**
 * Сервис для работы с push-уведомлениями Firebase Cloud Messaging
 */

import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { usersAPI } from './api';
import { showSuccessToast, showErrorToast } from '../utils/toast';

class NotificationService {
  constructor() {
    this.fcmToken = null;
    this.isInitialized = false;
  }

  /**
   * Инициализация сервиса уведомлений
   */
  async initialize() {
    try {
      // Запрашиваем разрешения
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('❌ [NotificationService] Нет разрешения на уведомления');
        return false;
      }

      // Получаем FCM токен
      this.fcmToken = await this.getFCMToken();
      if (!this.fcmToken) {
        console.log('❌ [NotificationService] Не удалось получить FCM токен');
        return false;
      }

      console.log('✅ [NotificationService] FCM токен получен:', this.fcmToken);

      // Сохраняем токен на сервере
      await this.saveTokenToServer(this.fcmToken);

      // Настраиваем обработчики уведомлений
      this.setupNotificationHandlers();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ [NotificationService] Ошибка инициализации:', error);
      return false;
    }
  }

  /**
   * Запрос разрешений на уведомления
   */
  async requestPermission() {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Разрешение на уведомления',
            message: 'Приложение хочет отправлять уведомления о готовности заказов',
            buttonNeutral: 'Спросить позже',
            buttonNegative: 'Отмена',
            buttonPositive: 'Разрешить',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS
        const authStatus = await messaging().requestPermission();
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
               authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      }
    } catch (error) {
      console.error('❌ [NotificationService] Ошибка запроса разрешений:', error);
      return false;
    }
  }

  /**
   * Получение FCM токена
   */
  async getFCMToken() {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('❌ [NotificationService] Ошибка получения токена:', error);
      return null;
    }
  }

  /**
   * Сохранение токена на сервере
   */
  async saveTokenToServer(token) {
    try {
      await usersAPI.updateFCMToken(token);
      console.log('✅ [NotificationService] Токен сохранен на сервере');
    } catch (error) {
      console.error('❌ [NotificationService] Ошибка сохранения токена:', error);
      showErrorToast('Ошибка настройки уведомлений');
    }
  }

  /**
   * Настройка обработчиков уведомлений
   */
  setupNotificationHandlers() {
    // Обработка уведомлений когда приложение в фоне
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('📱 [NotificationService] Фоновое уведомление:', remoteMessage);
    });

    // Обработка уведомлений когда приложение активно
    messaging().onMessage(async (remoteMessage) => {
      console.log('📱 [NotificationService] Активное уведомление:', remoteMessage);
      
      // Показываем уведомление в приложении
      this.showInAppNotification(remoteMessage);
    });

    // Обработка нажатия на уведомление
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📱 [NotificationService] Уведомление открыто:', remoteMessage);
      this.handleNotificationPress(remoteMessage);
    });

    // Проверяем, было ли приложение открыто по уведомлению
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('📱 [NotificationService] Приложение открыто по уведомлению:', remoteMessage);
          this.handleNotificationPress(remoteMessage);
        }
      });
  }

  /**
   * Показ уведомления в приложении
   */
  showInAppNotification(remoteMessage) {
    const { notification, data } = remoteMessage;
    
    if (notification) {
      const { title, body } = notification;
      
      // Показываем toast с уведомлением
      if (data?.type === 'order_ready') {
        showSuccessToast(`${title}\n${body}`);
      } else if (data?.type === 'new_order') {
        showSuccessToast(`${title}\n${body}`);
      } else {
        showSuccessToast(`${title}\n${body}`);
      }
    }
  }

  /**
   * Обработка нажатия на уведомление
   */
  handleNotificationPress(remoteMessage) {
    const { data } = remoteMessage;
    
    if (data?.type === 'order_ready') {
      // Переходим к экрану заказов официанта
      console.log('🔔 [NotificationService] Переход к заказу:', data.order_id);
      // Здесь можно добавить навигацию к конкретному заказу
    } else if (data?.type === 'new_order') {
      // Переходим к экрану заказов повара
      console.log('🔔 [NotificationService] Переход к новому заказу:', data.order_id);
      // Здесь можно добавить навигацию к списку заказов
    }
  }

  /**
   * Получение текущего FCM токена
   */
  getToken() {
    return this.fcmToken;
  }

  /**
   * Проверка инициализации
   */
  isReady() {
    return this.isInitialized && this.fcmToken !== null;
  }

  /**
   * Обновление токена (если он изменился)
   */
  async refreshToken() {
    try {
      const newToken = await this.getFCMToken();
      if (newToken && newToken !== this.fcmToken) {
        this.fcmToken = newToken;
        await this.saveTokenToServer(newToken);
        console.log('✅ [NotificationService] Токен обновлен');
      }
    } catch (error) {
      console.error('❌ [NotificationService] Ошибка обновления токена:', error);
    }
  }
}

// Экспортируем singleton
export default new NotificationService();
