/**
 * Redux slice для аутентификации
 * Управление состоянием пользователя и авторизации
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../services/api';
import { STORAGE_KEYS, USER_ROLES } from '../../constants';
import webSocketService from '../../services/websocket';

// Асинхронные действия
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const data = await authAPI.login(username, password);
      console.log('✅ [authSlice] login response:', data);
      
      // Проверяем наличие обязательных полей
      if (!data.accessToken || !data.user) {
        console.error('❌ [authSlice] Missing required fields:', data);
        return rejectWithValue('Неверный формат ответа сервера');
      }
      
      // Сохраняем токены в AsyncStorage
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, data.accessToken],
        [STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken || ''],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(data.user)],
      ]);

      // Подключаем WebSocket после успешного входа
      try {
        await webSocketService.connect();
        console.log('✅ [authSlice] WebSocket подключен после входа');
      } catch (wsError) {
        console.error('❌ [authSlice] Ошибка подключения WebSocket:', wsError);
      }

      console.log('✅ [authSlice] Token saved, returning data');
      return data;
    } catch (error) {
      console.error('❌ [authSlice] login error:', error);
      console.error('❌ [authSlice] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Детальная обработка ошибок
      if (error.response) {
        // Сервер ответил с ошибкой
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Ошибка входа';
        return rejectWithValue(errorMessage);
      } else if (error.request) {
        // Запрос был отправлен, но ответа не получено
        return rejectWithValue('Не удалось подключиться к серверу. Проверьте настройки сети');
      } else {
        // Ошибка при настройке запроса
        return rejectWithValue(error.message || 'Ошибка входа');
      }
    }
  }
);

export const adminLogin = createAsyncThunk(
  'auth/adminLogin',
  async (username, { rejectWithValue }) => {
    try {
      const data = await authAPI.adminLogin(username);
      console.log('✅ [authSlice] adminLogin response:', data);
      
      // Проверяем наличие обязательных полей
      if (!data.accessToken || !data.user) {
        console.error('❌ [authSlice] Missing required fields:', data);
        return rejectWithValue('Неверный формат ответа сервера');
      }
      
      // Сохраняем токены в AsyncStorage
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, data.accessToken],
        [STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken || ''],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(data.user)],
      ]);

      // Подключаем WebSocket после успешного входа
      try {
        await webSocketService.connect();
        console.log('✅ [authSlice] WebSocket подключен после входа администратора');
      } catch (wsError) {
        console.error('❌ [authSlice] Ошибка подключения WebSocket:', wsError);
      }

      console.log('✅ [authSlice] Token saved, returning data');
      return data;
    } catch (error) {
      console.error('❌ [authSlice] adminLogin error:', error);
      console.error('❌ [authSlice] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Детальная обработка ошибок
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Ошибка входа';
        return rejectWithValue(errorMessage);
      } else if (error.request) {
        return rejectWithValue('Не удалось подключиться к серверу. Проверьте настройки сети');
      } else {
        return rejectWithValue(error.message || 'Ошибка входа');
      }
    }
  }
);

export const waiterLogin = createAsyncThunk(
  'auth/waiterLogin',
  async (username, { rejectWithValue }) => {
    try {
      const data = await authAPI.waiterLogin(username);
      console.log('✅ [authSlice] waiterLogin response:', data);
      
      // Проверяем наличие обязательных полей
      if (!data.accessToken || !data.user) {
        console.error('❌ [authSlice] Missing required fields:', data);
        return rejectWithValue('Неверный формат ответа сервера');
      }
      
      // Сохраняем токены в AsyncStorage
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, data.accessToken],
        [STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken || ''],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(data.user)],
      ]);

      // Подключаем WebSocket после успешного входа официанта
      try {
        await webSocketService.connect();
        console.log('✅ [authSlice] WebSocket подключен после входа официанта');
      } catch (wsError) {
        console.error('❌ [authSlice] Ошибка подключения WebSocket:', wsError);
      }

      console.log('✅ [authSlice] Token saved, returning data');
      return data;
    } catch (error) {
      console.error('❌ [authSlice] waiterLogin error:', error);
      console.error('❌ [authSlice] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Детальная обработка ошибок
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Ошибка входа';
        return rejectWithValue(errorMessage);
      } else if (error.request) {
        return rejectWithValue('Не удалось подключиться к серверу. Проверьте настройки сети');
      } else {
        return rejectWithValue(error.message || 'Ошибка входа');
      }
    }
  }
);

export const cookLogin = createAsyncThunk(
  'auth/cookLogin',
  async (username, { rejectWithValue }) => {
    try {
      const data = await authAPI.cookLogin(username);
      console.log('✅ [authSlice] cookLogin response:', data);
      
      // Проверяем наличие обязательных полей
      if (!data.accessToken || !data.user) {
        console.error('❌ [authSlice] Missing required fields:', data);
        return rejectWithValue('Неверный формат ответа сервера');
      }
      
      // Сохраняем токены в AsyncStorage
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, data.accessToken],
        [STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken || ''],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(data.user)],
      ]);

      // Подключаем WebSocket после успешного входа повара
      try {
        await webSocketService.connect();
        console.log('✅ [authSlice] WebSocket подключен после входа повара');
      } catch (wsError) {
        console.error('❌ [authSlice] Ошибка подключения WebSocket:', wsError);
      }

      console.log('✅ [authSlice] Token saved, returning data');
      return data;
    } catch (error) {
      console.error('❌ [authSlice] cookLogin error:', error);
      console.error('❌ [authSlice] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Детальная обработка ошибок
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Ошибка входа';
        return rejectWithValue(errorMessage);
      } else if (error.request) {
        return rejectWithValue('Не удалось подключиться к серверу. Проверьте настройки сети');
      } else {
        return rejectWithValue(error.message || 'Ошибка входа');
      }
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      
      // Отключаем WebSocket перед выходом
      try {
        webSocketService.disconnect();
        console.log('✅ [authSlice] WebSocket отключен при выходе');
      } catch (wsError) {
        console.error('❌ [authSlice] Ошибка отключения WebSocket:', wsError);
      }
      
      // Очищаем AsyncStorage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);

      return true;
    } catch (error) {
      // Даже если запрос на сервер не удался, очищаем локальные данные
      // Отключаем WebSocket
      try {
        webSocketService.disconnect();
      } catch (wsError) {
        console.error('❌ [authSlice] Ошибка отключения WebSocket:', wsError);
      }
      
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      
      return true;
    }
  }
);

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authAPI.getMe();
      return data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка получения данных пользователя');
    }
  }
);

export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (token, { rejectWithValue }) => {
    try {
      const data = await authAPI.verifyToken(token);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Токен недействителен');
    }
  }
);

// Начальное состояние
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  loginMethod: null, // 'admin', 'waiter', 'cook'
};

// Создание slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Очистка ошибки
    clearError: (state) => {
      state.error = null;
    },
    
    // Установка токена (для восстановления сессии)
    setToken: (state, action) => {
      state.token = action.payload;
    },
    
    // Установка пользователя (для восстановления сессии)
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    
    // Сброс состояния аутентификации
    resetAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.loginMethod = null;
    },

    // Принудительное снятие индикатора загрузки
    resetLoading: (state) => {
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        console.log('🔄 [authSlice] login.pending');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log('✅ [authSlice] login.fulfilled', action.payload);
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        // login используется только для директора
        state.loginMethod = 'admin'; // Директор использует опцию "Администратор"
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        console.error('❌ [authSlice] login.rejected', action.payload);
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Admin Login
      .addCase(adminLogin.pending, (state) => {
        console.log('🔄 [authSlice] adminLogin.pending');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        console.log('✅ [authSlice] adminLogin.fulfilled', action.payload);
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.loginMethod = 'admin';
        state.error = null;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        console.error('❌ [authSlice] adminLogin.rejected', action.payload);
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Waiter Login
      .addCase(waiterLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(waiterLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.loginMethod = 'waiter';
        state.error = null;
      })
      .addCase(waiterLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Cook Login
      .addCase(cookLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cookLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.loginMethod = 'cook';
        state.error = null;
      })
      .addCase(cookLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.loginMethod = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        // Даже если logout не удался, очищаем состояние
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.loginMethod = null;
      })
      
      // Get Me
      .addCase(getMe.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getMe.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        // Если не удалось получить данные пользователя, сбрасываем аутентификацию
        state.user = null;
        state.isAuthenticated = false;
      })
      
      // Verify Token
      .addCase(verifyToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = action.payload.valid;
        state.error = null;
      })
      .addCase(verifyToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });
  },
});

// Экспорт действий
export const { clearError, setToken, setUser, resetAuth, resetLoading } = authSlice.actions;

// Селекторы
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectError = (state) => state.auth.error;
export const selectLoginMethod = (state) => state.auth.loginMethod;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectIsAdmin = (state) => [USER_ROLES.ADMIN, USER_ROLES.DIRECTOR].includes(state.auth.user?.role);
export const selectIsDirector = (state) => state.auth.user?.role === USER_ROLES.DIRECTOR;
export const selectIsWaiter = (state) => state.auth.user?.role === USER_ROLES.WAITER;
export const selectIsCook = (state) => state.auth.user?.role === USER_ROLES.COOK;

export default authSlice.reducer;
