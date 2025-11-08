/**
 * Константы приложения
 * Централизованное хранение всех констант
 */

import { getApiBaseUrl, getWebSocketUrl } from '../config/network';

// API Configuration
// Используем динамическое определение URL из конфигурации сети
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  WS_URL: getWebSocketUrl(),
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};

// WebSocket Events
export const WS_EVENTS = {
  // Client to Server
  AUTHENTICATE: 'authenticate',
  ORDER_CREATE: 'order:create',
  ORDER_STATUS_CHANGE: 'order:status_change',
  
  // Server to Client
  AUTHENTICATED: 'authenticated',
  AUTH_ERROR: 'auth_error',
  ORDER_NEW: 'order:new',
  ORDER_UPDATED: 'order:updated',
  ORDER_READY: 'order:ready',
  ORDER_CANCELLED: 'order:cancelled',
  ERROR: 'error'
};

// User Roles
export const USER_ROLES = {
  WAITER: 'waiter',
  COOK: 'cook',
  ADMIN: 'admin',
  DIRECTOR: 'director'
};

// Order Statuses
export const ORDER_STATUS = {
  NEW: 'new',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Order Status Labels (Russian)
export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.NEW]: 'Новый',
  [ORDER_STATUS.ACCEPTED]: 'Принят',
  [ORDER_STATUS.PREPARING]: 'Готовится',
  [ORDER_STATUS.READY]: 'Готов',
  [ORDER_STATUS.DELIVERED]: 'Доставлен',
  [ORDER_STATUS.CANCELLED]: 'Отменен'
};

// Order Status Colors
export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.NEW]: '#2196F3',
  [ORDER_STATUS.ACCEPTED]: '#FF9800',
  [ORDER_STATUS.PREPARING]: '#FF5722',
  [ORDER_STATUS.READY]: '#4CAF50',
  [ORDER_STATUS.DELIVERED]: '#9E9E9E',
  [ORDER_STATUS.CANCELLED]: '#F44336'
};

// Table Numbers
export const TABLE_NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);

// App Colors
export const COLORS = {
  PRIMARY: '#1976D2',
  PRIMARY_DARK: '#1565C0',
  SECONDARY: '#FFC107',
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
  LIGHT: '#F5F5F5',
  DARK: '#212121',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY: '#9E9E9E',
  LIGHT_GRAY: '#E0E0E0',
  DARK_GRAY: '#616161'
};

// Typography
export const TYPOGRAPHY = {
  H1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40
  },
  H2: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32
  },
  H3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28
  },
  H4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24
  },
  BODY: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 24
  },
  CAPTION: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 16
  },
  BUTTON: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24
  }
};

// Spacing
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48
};

// Border Radius
export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  ROUND: 50
};

// Shadows
export const SHADOWS = {
  SM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  MD: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4
  },
  LG: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8
  }
};

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  MENU_CACHE: 'menu_cache',
  SETTINGS: 'settings',
  NOTIFICATIONS_ENABLED: 'notifications_enabled'
};

// Push Notification Types
export const NOTIFICATION_TYPES = {
  ORDER_READY: 'order_ready',
  ORDER_NEW: 'order_new',
  ORDER_UPDATED: 'order_updated'
};

// Menu Categories
export const MENU_CATEGORIES = {
  DRINKS: 'Напитки',
  APPETIZERS: 'Закуски',
  MAIN_DISHES: 'Основные блюда',
  DESSERTS: 'Десерты',
  SALADS: 'Салаты'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже.',
  AUTH_ERROR: 'Ошибка авторизации. Войдите в систему заново.',
  VALIDATION_ERROR: 'Ошибка валидации данных.',
  UNKNOWN_ERROR: 'Произошла неизвестная ошибка.',
  ORDER_NOT_FOUND: 'Заказ не найден.',
  MENU_ITEM_NOT_FOUND: 'Позиция меню не найдена.',
  INSUFFICIENT_PERMISSIONS: 'Недостаточно прав для выполнения действия.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  ORDER_CREATED: 'Заказ создан успешно',
  ORDER_UPDATED: 'Заказ обновлен успешно',
  ORDER_CANCELLED: 'Заказ отменен',
  LOGIN_SUCCESS: 'Вход выполнен успешно',
  LOGOUT_SUCCESS: 'Выход выполнен успешно',
  SETTINGS_SAVED: 'Настройки сохранены'
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'PectoranAPP',
  VERSION: '1.0.0',
  MIN_ORDER_AMOUNT: 100,
  MAX_ORDER_ITEMS: 50,
  ORDER_TIMEOUT: 300000, // 5 minutes
  MENU_CACHE_DURATION: 3600000, // 1 hour
  NOTIFICATION_SOUND: true,
  VIBRATION_ENABLED: true
};

// Table Layout
export const TABLE_LAYOUT = {
  GRID_COLUMNS: 4,
  GRID_SPACING: 16,
  TABLE_SIZE: 80
};

// Menu Item Configuration
export const MENU_ITEM_CONFIG = {
  MAX_QUANTITY: 99,
  MIN_QUANTITY: 1,
  DEFAULT_QUANTITY: 1
};

// Order Configuration
export const ORDER_CONFIG = {
  MAX_NOTES_LENGTH: 500,
  MAX_CUSTOMER_NAME_LENGTH: 100,
  MAX_CUSTOMER_PHONE_LENGTH: 20
};

export default {
  API_CONFIG,
  WS_EVENTS,
  USER_ROLES,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  TABLE_NUMBERS,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  ANIMATION_DURATION,
  STORAGE_KEYS,
  NOTIFICATION_TYPES,
  MENU_CATEGORIES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  APP_CONFIG,
  TABLE_LAYOUT,
  MENU_ITEM_CONFIG,
  ORDER_CONFIG
};
