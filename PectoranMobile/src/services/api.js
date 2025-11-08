/**
 * API сервис для взаимодействия с backend
 * Централизованная обработка HTTP запросов
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../constants';
import { showToast } from '../utils/toast';
import { isNgrokDomain } from '../config/network';

// Функция для проверки, является ли URL ngrok доменом
function isNgrokUrl(url) {
  if (!url) return false;
  
  // Нормализуем URL - убираем протокол, пути, параметры
  const normalizedUrl = String(url)
    .replace(/^https?:\/\//, '') // Убираем протокол
    .replace(/\/.*$/, '') // Убираем путь
    .replace(/:.*$/, ''); // Убираем порт
  
  const ngrokPatterns = [
    /\.ngrok\.io$/i,
    /\.ngrok-free\.app$/i,
    /\.ngrok\.app$/i,
    /\.ngrok\.dev$/i,
    /^[a-z0-9]+\.ngrok-free\.app$/i, // Точное совпадение для ngrok-free.app
    /^[a-z0-9]+\.ngrok\.io$/i, // Точное совпадение для ngrok.io
  ];
  
  return ngrokPatterns.some(pattern => pattern.test(normalizedUrl));
}

// Создание экземпляра axios
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена к запросам
api.interceptors.request.use(
  async (config) => {
    try {
      // Определяем полный URL запроса
      const baseURL = config.baseURL || API_CONFIG.BASE_URL;
      const requestUrl = config.url || '';
      const fullUrl = requestUrl ? `${baseURL}${requestUrl.startsWith('/') ? '' : '/'}${requestUrl}` : baseURL;
      
      // Добавляем заголовок для ngrok-free.app (обход warning страницы)
      // Проверяем и baseURL, и полный URL, и API_CONFIG.BASE_URL
      const isNgrok = isNgrokUrl(baseURL) || isNgrokUrl(fullUrl) || isNgrokUrl(API_CONFIG.BASE_URL);
      
      if (isNgrok) {
        config.headers['ngrok-skip-browser-warning'] = 'true';
        console.log(`🔐 [API] Добавлен заголовок ngrok-skip-browser-warning для: ${fullUrl}`);
      }
      
      // Логируем URL запроса для диагностики
      console.log(`📡 [API] ${config.method?.toUpperCase() || 'GET'} ${fullUrl}`);
      
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('❌ [API] Ошибка получения токена:', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ [API] Ошибка в request interceptor:', error);
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ответов
api.interceptors.response.use(
  (response) => {
    // Логируем успешный ответ для диагностики
    console.log(`✅ [API] ${response.config.method?.toUpperCase() || 'GET'} ${response.config.url || ''} - ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const fullUrl = originalRequest?.url ? `${originalRequest.baseURL || API_CONFIG.BASE_URL}${requestUrl}` : (originalRequest?.baseURL || API_CONFIG.BASE_URL);

    // Детальное логирование ошибки
    console.error(`❌ [API] Ошибка запроса: ${originalRequest?.method?.toUpperCase() || 'GET'} ${fullUrl}`);
    
    if (error.response) {
      // Сервер ответил с ошибкой
      const { status, data } = error.response;
      console.error(`❌ [API] Статус: ${status}, Ответ:`, JSON.stringify(data, null, 2));
      
      // Обработка ошибки 401 (Unauthorized)
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Пытаемся обновить токен
          const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (refreshToken) {
            console.log('🔄 [API] Попытка обновить токен...');
            const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken } = response.data.data;
            await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
            console.log('✅ [API] Токен обновлен');

            // Повторяем оригинальный запрос с новым токеном
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('❌ [API] Ошибка обновления токена:', refreshError);
          // Если не удалось обновить токен, очищаем хранилище и перенаправляем на логин
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.USER_DATA,
          ]);
          
          // Здесь можно добавить навигацию на экран логина
          showToast('Сессия истекла. Войдите в систему заново.', 'error');
        }
      }

      // Обработка других ошибок
      const errorMessage = data?.message || data?.error || 'Произошла ошибка';
      
      switch (status) {
        case 400:
          console.error(`❌ [API] Ошибка валидации: ${errorMessage}`);
          showToast(errorMessage, 'error');
          break;
        case 401:
          console.error(`❌ [API] Ошибка авторизации: ${errorMessage}`);
          // Не показываем toast для 401, так как это обрабатывается выше
          break;
        case 403:
          console.error(`❌ [API] Доступ запрещен: ${errorMessage}`);
          showToast(errorMessage || 'Недостаточно прав для выполнения действия', 'error');
          break;
        case 404:
          console.error(`❌ [API] Ресурс не найден: ${errorMessage}`);
          showToast(errorMessage || 'Ресурс не найден', 'error');
          break;
        case 500:
        case 502:
        case 503:
          console.error(`❌ [API] Ошибка сервера (${status}): ${errorMessage}`);
          showToast('Ошибка сервера. Попробуйте позже', 'error');
          break;
        default:
          console.error(`❌ [API] Неизвестная ошибка (${status}): ${errorMessage}`);
          showToast(errorMessage, 'error');
      }
    } else if (error.request) {
      // Запрос был отправлен, но ответа не получено
      console.error('❌ [API] Нет ответа от сервера. URL:', fullUrl);
      console.error('❌ [API] Детали ошибки:', error.message);
      
      // Проверяем, является ли это ngrok домен
      if (isNgrokUrl(fullUrl)) {
        console.error('❌ [API] Проблема с подключением к ngrok. Возможные причины:');
        console.error('   1. Ngrok туннель неактивен или изменился');
        console.error('   2. Проверьте, что backend запущен с ngrok');
        console.error('   3. Обновите URL в network.js');
        showToast('Ошибка подключения к серверу. Проверьте настройки ngrok', 'error');
      } else {
        showToast('Ошибка сети. Проверьте подключение к интернету', 'error');
      }
    } else {
      // Ошибка при настройке запроса
      console.error('❌ [API] Ошибка настройки запроса:', error.message);
      console.error('❌ [API] URL:', fullUrl);
      showToast('Произошла ошибка при отправке запроса', 'error');
    }

    return Promise.reject(error);
  }
);

/**
 * Проверка доступности backend
 * @returns {Promise<boolean>} true если backend доступен
 */
export async function checkBackendAvailability() {
  try {
    // Добавляем заголовок ngrok, если это ngrok домен
    const headers = {};
    if (isNgrokUrl(API_CONFIG.BASE_URL)) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    const healthUrl = API_CONFIG.BASE_URL.replace('/api', '/health');
    console.log('🔍 [API] Проверка доступности backend:', healthUrl);
    
    const response = await axios.get(healthUrl, {
      timeout: 5000,
      headers,
    });
    
    console.log('✅ [API] Backend доступен:', response.status);
    return true;
  } catch (error) {
    console.error('❌ [API] Backend недоступен:', error.message);
    
    // Пробуем проверить через API endpoint
    try {
      // Добавляем заголовок ngrok, если это ngrok домен
      const headers = {};
      if (isNgrokUrl(API_CONFIG.BASE_URL)) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }
      
      const testUrl = `${API_CONFIG.BASE_URL}/auth/me`;
      console.log('🔍 [API] Альтернативная проверка:', testUrl);
      
      await axios.get(testUrl, {
        timeout: 5000,
        headers,
        validateStatus: () => true, // Принимаем любой статус
      });
      
      console.log('✅ [API] Backend доступен (альтернативная проверка)');
      return true;
    } catch (altError) {
      console.error('❌ [API] Backend недоступен (альтернативная проверка):', altError.message);
      return false;
    }
  }
}

/**
 * API методы для аутентификации
 */
export const authAPI = {
  // Вход директора (логин + пароль)
  login: async (username, password) => {
    // Проверяем доступность backend перед запросом
    const isAvailable = await checkBackendAvailability();
    if (!isAvailable) {
      throw new Error('Сервер недоступен. Проверьте настройки сети и ngrok');
    }
    
    const response = await api.post('/auth/login', { username, password });
    // Возвращаем только полезные данные из обёртки { success, message, data }
    return response.data?.data ?? {};
  },

  // Вход администратора (только логин)
  adminLogin: async (username) => {
    // Проверяем доступность backend перед запросом
    const isAvailable = await checkBackendAvailability();
    if (!isAvailable) {
      throw new Error('Сервер недоступен. Проверьте настройки сети и ngrok');
    }
    
    const response = await api.post('/auth/admin-login', { username });
    // Возвращаем только полезные данные из обёртки { success, message, data }
    return response.data?.data ?? {};
  },

  // Вход официанта по логину
  waiterLogin: async (username) => {
    // Проверяем доступность backend перед запросом
    const isAvailable = await checkBackendAvailability();
    if (!isAvailable) {
      throw new Error('Сервер недоступен. Проверьте настройки сети и ngrok');
    }
    
    const response = await api.post('/auth/waiter-login', {
      username,
    });
    return response.data?.data ?? {};
  },

  // Вход повара по логину
  cookLogin: async (username) => {
    // Проверяем доступность backend перед запросом
    const isAvailable = await checkBackendAvailability();
    if (!isAvailable) {
      throw new Error('Сервер недоступен. Проверьте настройки сети и ngrok');
    }
    
    const response = await api.post('/auth/cook-login', {
      username,
    });
    return response.data?.data ?? {};
  },

  // Выход
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data?.data ?? {};
  },

  // Получение информации о текущем пользователе
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data?.data ?? {};
  },

  // Проверка токена
  verifyToken: async (token) => {
    const response = await api.post('/auth/verify', { token });
    return response.data?.data ?? {};
  },
};

/**
 * API методы для меню
 */
export const menuAPI = {
  // Получение меню
  getMenu: async () => {
    console.log('🔄 [menuAPI] Запрос меню с сервера...');
    try {
      const response = await api.get('/menu');
      console.log('✅ [menuAPI] Получен ответ от сервера:', {
        status: response.status,
        data: response.data,
        hasData: !!response.data?.data,
        hasMenu: !!response.data?.data?.menu
      });
      
      // Backend возвращает: { success: true, data: { menu: [...] } }
      // Возвращаем весь response.data, чтобы slice мог правильно извлечь menu
      return response.data;
    } catch (error) {
      console.error('❌ [menuAPI] Ошибка загрузки меню:', error);
      console.error('❌ [menuAPI] Детали ошибки:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  },

  // Получение категорий (только для директора)
  getCategories: async () => {
    const response = await api.get('/menu/categories');
    return response.data;
  },

  // Создание категории (только для директора)
  createCategory: async (categoryData) => {
    const response = await api.post('/menu/categories', categoryData);
    return response.data;
  },

  // Обновление категории (только для директора)
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/menu/categories/${id}`, categoryData);
    return response.data;
  },

  // Удаление категории (только для директора)
  deleteCategory: async (id) => {
    const response = await api.delete(`/menu/categories/${id}`);
    return response.data;
  },

  // Получение позиций меню (только для директора)
  getMenuItems: async (params = {}) => {
    const response = await api.get('/menu/items', { params });
    return response.data;
  },

  // Создание позиции меню (только для директора)
  createMenuItem: async (itemData) => {
    const response = await api.post('/menu/items', itemData);
    return response.data;
  },

  // Обновление позиции меню (только для директора)
  updateMenuItem: async (id, itemData) => {
    const response = await api.put(`/menu/items/${id}`, itemData);
    return response.data;
  },

  // Удаление позиции меню (только для директора)
  deleteMenuItem: async (id) => {
    const response = await api.delete(`/menu/items/${id}`);
    return response.data;
  },

  // Изменение доступности позиции (только для директора)
  toggleAvailability: async (id, isAvailable) => {
    const response = await api.put(`/menu/items/${id}/availability`, {
      is_available: isAvailable,
    });
    return response.data;
  },

  // Получение популярных позиций
  getPopularItems: async (params = {}) => {
    const response = await api.get('/menu/popular', { params });
    return response.data;
  },
};

/**
 * API методы для заказов
 */
export const ordersAPI = {
  // Создание заказа
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Получение заказов
  getOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  // Получение активных заказов
  getActiveOrders: async () => {
    const response = await api.get('/orders/active');
    return response.data;
  },

  // Получение конкретного заказа
  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Изменение статуса заказа
  updateOrderStatus: async (id, status, notes = '') => {
    const response = await api.put(`/orders/${id}/status`, { status, notes });
    return response.data;
  },

  // Получение истории заказа
  getOrderHistory: async (id) => {
    const response = await api.get(`/orders/${id}/history`);
    return response.data;
  },

  // Отмена заказа
  cancelOrder: async (id) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },

  // Отметить заказ как оплаченный (админ/директор)
  payOrder: async (id) => {
    const response = await api.put(`/orders/${id}/pay`);
    return response.data;
  },

  // Повар: переключить готовность позиции
  toggleOrderItemReady: async (itemId) => {
    const response = await api.put(`/orders/items/${itemId}/ready`);
    return response.data;
  },

  // Повар: отметить все позиции как готовые и заказ ready
  markOrderReadyAll: async (orderId) => {
    const response = await api.put(`/orders/${orderId}/ready-all`);
    return response.data;
  },
};

/**
 * API методы для статистики
 */
export const statsAPI = {
  // Получение дневной статистики
  getDailyStats: async (params = {}) => {
    const response = await api.get('/stats/daily', { params });
    return response.data;
  },

  // Получение статистики официанта
  getWaiterStats: async (waiterId, params = {}) => {
    const response = await api.get(`/stats/waiter/${waiterId}`, { params });
    return response.data;
  },

  // Получение популярных позиций
  getPopularItems: async (params = {}) => {
    const response = await api.get('/stats/popular-items', { params });
    return response.data;
  },

  // Получение статистики выручки
  getRevenueStats: async (params = {}) => {
    const response = await api.get('/stats/revenue', { params });
    return response.data;
  },

  // Получение статистики производительности
  getPerformanceStats: async (params = {}) => {
    const response = await api.get('/stats/performance', { params });
    return response.data;
  },
};

/**
 * API методы для пользователей
 */
export const usersAPI = {
  // Получение списка пользователей
  getUsers: async (params = {}) => {
    console.log('🔄 [usersAPI] Запрос пользователей с сервера...', params);
    try {
      const response = await api.get('/users', { params });
      console.log('✅ [usersAPI] Получен ответ от сервера:', {
        status: response.status,
        data: response.data,
        hasData: !!response.data?.data,
        hasUsers: !!response.data?.data?.users,
        usersCount: response.data?.data?.users?.length
      });
      
      // Backend возвращает: { success: true, data: { users: [...], total, limit, offset } }
      // Возвращаем весь response.data, чтобы slice мог правильно извлечь users
      return response.data;
    } catch (error) {
      console.error('❌ [usersAPI] Ошибка загрузки пользователей:', error);
      console.error('❌ [usersAPI] Детали ошибки:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  },

  // Получение ролей
  getRoles: async () => {
    const response = await api.get('/users/roles');
    return response.data;
  },

  // Создание пользователя
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Получение пользователя
  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Обновление пользователя
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Удаление пользователя
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Активация пользователя
  activateUser: async (id) => {
    const response = await api.put(`/users/${id}/activate`);
    return response.data;
  },

  // Деактивация пользователя
  deactivateUser: async (id) => {
    const response = await api.put(`/users/${id}/deactivate`);
    return response.data;
  },

  // Получение пользователей по роли
  getUsersByRole: async (role) => {
    const response = await api.get(`/users/role/${role}`);
    return response.data;
  },

  // Обновление FCM токена
  updateFCMToken: async (fcmToken) => {
    const response = await api.put('/users/fcm-token', { fcm_token: fcmToken });
    return response.data;
  },
};

export default api;
