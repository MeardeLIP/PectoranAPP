/**
 * WebSocket сервис для real-time коммуникации
 * Обработка WebSocket соединения и событий
 */

import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, WS_EVENTS, STORAGE_KEYS } from '../constants';
import { showToast } from '../utils/toast';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000;
    this.baseReconnectInterval = 5000;
    this.maxReconnectInterval = 30000;
    this.listeners = new Map();
    this.isManualDisconnect = false;
    this.reconnectTimeout = null;
    this.errorShownAfterAttempts = 3; // Показывать ошибку только после 3 попыток
  }

  /**
   * Подключение к WebSocket серверу
   */
  async connect() {
    try {
      // Проверяем, не идет ли уже процесс подключения
      if (this.isConnecting) {
        console.log('WebSocket: подключение уже выполняется, пропускаем');
        return;
      }

      // Если уже подключен, не делаем ничего
      if (this.socket && this.isConnected) {
        console.log('WebSocket: уже подключен');
        return;
      }

      this.isConnecting = true;
      this.isManualDisconnect = false;

      // Очищаем старое соединение, если оно есть
      if (this.socket) {
        console.log('WebSocket: очистка старого соединения');
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      // Получаем токен из хранилища
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      if (!token || !userData) {
        throw new Error('Нет данных аутентификации');
      }

      const user = JSON.parse(userData);

      console.log(`WebSocket: попытка подключения (попытка ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

      // Создаем соединение с увеличенным timeout
      this.socket = io(API_CONFIG.WS_URL, {
        transports: ['websocket'],
        timeout: 20000, // Увеличено с 10000 до 20000 мс
        forceNew: true,
        reconnection: false, // Отключаем автоматическое переподключение, управляем вручную
      });

      this.setupEventListeners();

      // Аутентификация после подключения
      this.socket.on('connect', () => {
        console.log('✅ WebSocket: подключен успешно');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        this.socket.emit(WS_EVENTS.AUTHENTICATE, {
          userId: user.id,
          role: user.role,
        });
      });

    } catch (error) {
      console.error('❌ WebSocket: ошибка при создании соединения:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  /**
   * Настройка обработчиков событий
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Удаляем все существующие обработчики перед установкой новых
    this.socket.removeAllListeners();

    // Обработка успешной аутентификации
    this.socket.on(WS_EVENTS.AUTHENTICATED, (data) => {
      console.log('✅ WebSocket: аутентификация успешна');
      this.emit('authenticated', data);
    });

    // Обработка ошибки аутентификации
    this.socket.on(WS_EVENTS.AUTH_ERROR, (data) => {
      console.error('❌ WebSocket: ошибка аутентификации', data);
      showToast(data.message || 'Ошибка аутентификации', 'error');
      this.emit('auth_error', data);
    });

    // Обработка новых заказов
    this.socket.on(WS_EVENTS.ORDER_NEW, (data) => {
      console.log('📦 WebSocket: новый заказ:', data);
      this.emit('order_new', data);
    });

    // Обработка обновлений заказов
    this.socket.on(WS_EVENTS.ORDER_UPDATED, (data) => {
      console.log('🔄 WebSocket: заказ обновлен:', data);
      this.emit('order_updated', data);
    });

    // Обработка готовности заказа
    this.socket.on(WS_EVENTS.ORDER_READY, (data) => {
      console.log('✅ WebSocket: заказ готов:', data);
      this.emit('order_ready', data);
      showToast(`Заказ №${data.orderId} готов!`, 'success');
    });

    // Обработка отмены заказа
    this.socket.on(WS_EVENTS.ORDER_CANCELLED, (data) => {
      console.log('❌ WebSocket: заказ отменен:', data);
      this.emit('order_cancelled', data);
    });

    // Обработка ошибок
    this.socket.on(WS_EVENTS.ERROR, (data) => {
      console.error('❌ WebSocket: ошибка:', data);
      showToast(data.message || 'Ошибка соединения', 'error');
      this.emit('error', data);
    });

    // Обработка отключения
    this.socket.on('disconnect', (reason) => {
      console.log(`🔌 WebSocket: отключен (${reason})`);
      this.isConnected = false;
      this.isConnecting = false;
      this.emit('disconnect', reason);
      
      // Переподключаемся только если отключение не было инициировано вручную
      if (!this.isManualDisconnect && reason !== 'io client disconnect') {
        console.log('🔄 WebSocket: инициируем переподключение');
        this.handleReconnect();
      } else {
        console.log('ℹ️ WebSocket: переподключение не требуется (ручное отключение)');
      }
    });

    // Обработка ошибок соединения
    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
      
      // Определяем тип ошибки
      const errorType = this.getErrorType(error);
      const errorMsg = error?.message || error?.toString() || String(error);
      console.error(`❌ WebSocket: ошибка подключения (${errorType}):`, errorMsg);
      
      // Показываем ошибку пользователю только после нескольких неудачных попыток
      if (this.reconnectAttempts >= this.errorShownAfterAttempts) {
        const errorMessage = this.getErrorMessage(errorType);
        console.warn(`⚠️ WebSocket: попытки переподключения продолжаются (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        // Не показываем toast для каждой ошибки, только логируем
        // Показываем toast только при превышении максимального количества попыток (это делается в handleReconnect)
      }
      
      this.emit('connect_error', error);
      this.handleReconnect();
    });
  }

  /**
   * Определение типа ошибки
   */
  getErrorType(error) {
    if (!error) return 'unknown';
    
    let errorMessage = '';
    if (error.message) {
      errorMessage = error.message.toLowerCase();
    } else if (typeof error === 'string') {
      errorMessage = error.toLowerCase();
    } else if (error.toString && typeof error.toString === 'function') {
      errorMessage = error.toString().toLowerCase();
    } else {
      errorMessage = JSON.stringify(error).toLowerCase();
    }
    
    if (errorMessage.includes('timeout')) {
      return 'timeout';
    } else if (errorMessage.includes('network') || errorMessage.includes('eai_again')) {
      return 'network';
    } else if (errorMessage.includes('server') || errorMessage.includes('500') || errorMessage.includes('503')) {
      return 'server';
    } else if (errorMessage.includes('refused') || errorMessage.includes('econnrefused')) {
      return 'connection_refused';
    }
    
    return 'unknown';
  }

  /**
   * Получение сообщения об ошибке в зависимости от типа
   */
  getErrorMessage(errorType) {
    switch (errorType) {
      case 'timeout':
        return 'Таймаут подключения. Проверьте подключение к интернету';
      case 'network':
        return 'Ошибка сети. Проверьте подключение к интернету';
      case 'server':
        return 'Ошибка сервера. Попробуйте позже';
      case 'connection_refused':
        return 'Соединение отклонено. Проверьте доступность сервера';
      default:
        return 'Ошибка подключения. Проверьте подключение к интернету';
    }
  }

  /**
   * Обработка переподключения
   */
  handleReconnect() {
    // Проверяем, не идет ли уже переподключение
    if (this.reconnectTimeout) {
      console.log('WebSocket: переподключение уже запланировано');
      return;
    }

    // Проверяем, не было ли ручного отключения
    if (this.isManualDisconnect) {
      console.log('WebSocket: переподключение отменено (ручное отключение)');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ WebSocket: превышено максимальное количество попыток (${this.maxReconnectAttempts})`);
      showToast('Ошибка соединения. Проверьте подключение к интернету', 'error');
      this.isConnecting = false;
      return;
    }

    this.reconnectAttempts++;
    
    // Экспоненциальная задержка: увеличиваем интервал с каждой попыткой
    const delay = Math.min(
      this.baseReconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectInterval
    );
    
    console.log(`🔄 WebSocket: переподключение через ${delay}мс (попытка ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  /**
   * Отправка события создания заказа
   */
  emitOrderCreate(orderData) {
    if (this.socket && this.isConnected) {
      this.socket.emit(WS_EVENTS.ORDER_CREATE, orderData);
    } else {
      console.warn('WebSocket не подключен, событие не отправлено');
    }
  }

  /**
   * Отправка события изменения статуса заказа
   */
  emitOrderStatusChange(orderId, newStatus, previousStatus) {
    if (this.socket && this.isConnected) {
      this.socket.emit(WS_EVENTS.ORDER_STATUS_CHANGE, {
        orderId,
        newStatus,
        previousStatus,
      });
    } else {
      console.warn('WebSocket не подключен, событие не отправлено');
    }
  }

  /**
   * Подписка на событие
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Отписка от события
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Эмиссия события для внутренних слушателей
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Ошибка в обработчике события ${event}:`, error);
        }
      });
    }
  }

  /**
   * Отключение от WebSocket
   */
  disconnect() {
    console.log('WebSocket: инициируем отключение');
    this.isManualDisconnect = true;
    this.isConnecting = false;
    
    // Отменяем запланированное переподключение
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.listeners.clear();
    console.log('✅ WebSocket: отключен');
  }

  /**
   * Принудительное переподключение с очисткой состояния
   */
  async forceReconnect() {
    console.log('🔄 WebSocket: принудительное переподключение');
    
    // Очищаем состояние
    this.disconnect();
    
    // Сбрасываем флаг ручного отключения
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;
    
    // Ждем немного перед переподключением
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Подключаемся заново
    await this.connect();
  }

  /**
   * Проверка статуса подключения
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      isManualDisconnect: this.isManualDisconnect,
    };
  }
}

// Создаем единственный экземпляр сервиса
const webSocketService = new WebSocketService();

export default webSocketService;
