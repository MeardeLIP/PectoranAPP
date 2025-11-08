/**
 * Redux store конфигурация
 * Централизованное управление состоянием приложения
 */

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Импорт слайсов
import authSlice from './slices/authSlice';
import menuSlice from './slices/menuSlice';
import ordersSlice from './slices/ordersSlice';
import statsSlice from './slices/statsSlice';
import usersSlice from './slices/usersSlice';
import appSlice from './slices/appSlice';

// Конфигурация persist
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'app'], // Сохраняем только auth и app в localStorage
};

// Объединение всех редьюсеров
const rootReducer = combineReducers({
  auth: authSlice,
  menu: menuSlice,
  orders: ordersSlice,
  stats: statsSlice,
  users: usersSlice,
  app: appSlice,
});

// Создание персистентного редьюсера
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Конфигурация store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: __DEV__,
});

// Создание persistor
export const persistor = persistStore(store);

export default store;
