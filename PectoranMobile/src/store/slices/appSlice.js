/**
 * Redux slice для приложения
 * Управление общим состоянием приложения
 */

import { createSlice } from '@reduxjs/toolkit';

// Начальное состояние
const initialState = {
  // Навигация
  currentScreen: 'Login',
  
  // Настройки приложения
  settings: {
    notificationsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    theme: 'light', // 'light' | 'dark'
    language: 'ru',
  },
  
  // Состояние загрузки
  isAppReady: false,
  isOnline: true,
  
  // Уведомления
  notifications: [],
  unreadNotifications: 0,
  
  // Ошибки
  globalError: null,
  
  // Модальные окна
  modals: {
    orderDetails: false,
    userProfile: false,
    settings: false,
  },
  
  // Фильтры и поиск
  filters: {
    orders: {
      status: null,
      dateFrom: null,
      dateTo: null,
      waiterId: null,
    },
    menu: {
      category: null,
      search: '',
      priceRange: null,
    },
  },
  
  // Кэш
  cache: {
    lastMenuUpdate: null,
    lastOrdersUpdate: null,
    lastStatsUpdate: null,
  },
};

// Создание slice
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // Навигация
    setCurrentScreen: (state, action) => {
      state.currentScreen = action.payload;
    },
    
    // Настройки
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    setNotificationsEnabled: (state, action) => {
      state.settings.notificationsEnabled = action.payload;
    },
    
    setSoundEnabled: (state, action) => {
      state.settings.soundEnabled = action.payload;
    },
    
    setVibrationEnabled: (state, action) => {
      state.settings.vibrationEnabled = action.payload;
    },
    
    setTheme: (state, action) => {
      state.settings.theme = action.payload;
    },
    
    setLanguage: (state, action) => {
      state.settings.language = action.payload;
    },
    
    // Состояние приложения
    setAppReady: (state, action) => {
      state.isAppReady = action.payload;
    },
    
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    
    // Уведомления
    addNotification: (state, action) => {
      const notification = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      };
      state.notifications.unshift(notification);
      state.unreadNotifications += 1;
    },
    
    markNotificationAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
      }
    },
    
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadNotifications = 0;
    },
    
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
      }
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadNotifications = 0;
    },
    
    // Ошибки
    setGlobalError: (state, action) => {
      state.globalError = action.payload;
    },
    
    clearGlobalError: (state) => {
      state.globalError = null;
    },
    
    // Модальные окна
    openModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = true;
      }
    },
    
    closeModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = false;
      }
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modal => {
        state.modals[modal] = false;
      });
    },
    
    // Фильтры
    updateOrdersFilter: (state, action) => {
      state.filters.orders = { ...state.filters.orders, ...action.payload };
    },
    
    updateMenuFilter: (state, action) => {
      state.filters.menu = { ...state.filters.menu, ...action.payload };
    },
    
    clearFilters: (state) => {
      state.filters = {
        orders: {
          status: null,
          dateFrom: null,
          dateTo: null,
          waiterId: null,
        },
        menu: {
          category: null,
          search: '',
          priceRange: null,
        },
      };
    },
    
    // Кэш
    updateCache: (state, action) => {
      const { key, timestamp } = action.payload;
      state.cache[key] = timestamp;
    },
    
    clearCache: (state) => {
      state.cache = {
        lastMenuUpdate: null,
        lastOrdersUpdate: null,
        lastStatsUpdate: null,
      };
    },
    
    // Сброс состояния приложения
    resetApp: (state) => {
      return { ...initialState, isAppReady: false };
    },
  },
});

// Экспорт действий
export const {
  setCurrentScreen,
  updateSettings,
  setNotificationsEnabled,
  setSoundEnabled,
  setVibrationEnabled,
  setTheme,
  setLanguage,
  setAppReady,
  setOnlineStatus,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearAllNotifications,
  setGlobalError,
  clearGlobalError,
  openModal,
  closeModal,
  closeAllModals,
  updateOrdersFilter,
  updateMenuFilter,
  clearFilters,
  updateCache,
  clearCache,
  resetApp,
} = appSlice.actions;

// Селекторы
export const selectCurrentScreen = (state) => state.app.currentScreen;
export const selectSettings = (state) => state.app.settings;
export const selectIsAppReady = (state) => state.app.isAppReady;
export const selectIsOnline = (state) => state.app.isOnline;
export const selectNotifications = (state) => state.app.notifications;
export const selectUnreadNotifications = (state) => state.app.unreadNotifications;
export const selectGlobalError = (state) => state.app.globalError;
export const selectModals = (state) => state.app.modals;
export const selectFilters = (state) => state.app.filters;
export const selectCache = (state) => state.app.cache;

export default appSlice.reducer;
