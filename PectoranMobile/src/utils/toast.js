/**
 * Утилиты для показа уведомлений
 * Централизованная система toast сообщений
 */

import Toast from 'react-native-toast-message';
import { COLORS } from '../constants';

/**
 * Показать toast сообщение
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип сообщения ('success', 'error', 'info', 'warning')
 * @param {Object} options - Дополнительные опции
 */
export const showToast = (message, type = 'info', options = {}) => {
  const config = {
    type,
    text1: message,
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 60,
    ...options,
  };

  // Настройка цветов для разных типов
  switch (type) {
    case 'success':
      config.props = {
        style: { backgroundColor: COLORS.SUCCESS },
        text1Style: { color: COLORS.WHITE, fontSize: 16 },
      };
      break;
    case 'error':
      config.props = {
        style: { backgroundColor: COLORS.ERROR },
        text1Style: { color: COLORS.WHITE, fontSize: 16 },
      };
      break;
    case 'warning':
      config.props = {
        style: { backgroundColor: COLORS.WARNING },
        text1Style: { color: COLORS.WHITE, fontSize: 16 },
      };
      break;
    case 'info':
    default:
      config.props = {
        style: { backgroundColor: COLORS.INFO },
        text1Style: { color: COLORS.WHITE, fontSize: 16 },
      };
      break;
  }

  Toast.show(config);
};

/**
 * Показать успешное сообщение
 * @param {string} message - Текст сообщения
 * @param {Object} options - Дополнительные опции
 */
export const showSuccessToast = (message, options = {}) => {
  showToast(message, 'success', options);
};

/**
 * Показать сообщение об ошибке
 * @param {string} message - Текст сообщения
 * @param {Object} options - Дополнительные опции
 */
export const showErrorToast = (message, options = {}) => {
  showToast(message, 'error', options);
};

/**
 * Показать предупреждение
 * @param {string} message - Текст сообщения
 * @param {Object} options - Дополнительные опции
 */
export const showWarningToast = (message, options = {}) => {
  showToast(message, 'warning', options);
};

/**
 * Показать информационное сообщение
 * @param {string} message - Текст сообщения
 * @param {Object} options - Дополнительные опции
 */
export const showInfoToast = (message, options = {}) => {
  showToast(message, 'info', options);
};

/**
 * Скрыть все toast сообщения
 */
export const hideToast = () => {
  Toast.hide();
};

export default {
  showToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  hideToast,
};
