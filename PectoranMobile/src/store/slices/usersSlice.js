/**
 * Redux slice для пользователей
 * Управление состоянием пользователей системы
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersAPI } from '../../services/api';

// Асинхронные действия
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      console.log('🔄 [usersSlice] Запрашиваем пользователей с сервера...', params);
      const response = await usersAPI.getUsers(params);
      console.log('✅ [usersSlice] Получен ответ от сервера:', response);
      
      // Backend возвращает: { success: true, data: { users: [...], total, limit, offset } }
      // usersAPI.getUsers() возвращает response.data, который уже содержит { success, data: { users, total, limit, offset } }
      const data = response?.data || response;
      
      const users = data?.users || [];
      const total = data?.total || 0;
      const limit = data?.limit || 50;
      const offset = data?.offset || 0;
      
      if (!Array.isArray(users)) {
        console.error('❌ [usersSlice] users не является массивом:', users);
        return rejectWithValue('Неверный формат данных пользователей');
      }
      
      console.log(`✅ [usersSlice] Загружено ${users.length} пользователей (всего: ${total})`);
      
      return {
        users,
        total,
        limit,
        offset
      };
    } catch (error) {
      console.error('❌ [usersSlice] Ошибка загрузки пользователей:', error);
      console.error('❌ [usersSlice] Детали ошибки:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return rejectWithValue(error.response?.data?.message || error.message || 'Ошибка загрузки пользователей');
    }
  }
);

export const fetchRoles = createAsyncThunk(
  'users/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getRoles();
      return response.data.roles;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки ролей');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await usersAPI.createUser(userData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка создания пользователя');
    }
  }
);

export const fetchUser = createAsyncThunk(
  'users/fetchUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getUser(userId);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки пользователя');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.updateUser(userId, userData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка обновления пользователя');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await usersAPI.deleteUser(userId);
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка удаления пользователя');
    }
  }
);

export const activateUser = createAsyncThunk(
  'users/activateUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await usersAPI.activateUser(userId);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка активации пользователя');
    }
  }
);

export const deactivateUser = createAsyncThunk(
  'users/deactivateUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await usersAPI.deactivateUser(userId);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка деактивации пользователя');
    }
  }
);

export const fetchUsersByRole = createAsyncThunk(
  'users/fetchUsersByRole',
  async (role, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getUsersByRole(role);
      return response.data.users;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки пользователей по роли');
    }
  }
);

// Начальное состояние
const initialState = {
  users: [],
  currentUser: null,
  roles: [],
  usersByRole: [],
  isLoading: false,
  error: null,
  pagination: {
    total: 0,
    limit: 50,
    offset: 0,
  },
};

// Создание slice
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // Очистка ошибки
    clearError: (state) => {
      state.error = null;
    },
    
    // Очистка пользователей
    clearUsers: (state) => {
      state.users = [];
      state.currentUser = null;
      state.usersByRole = [];
    },
    
    // Обновление пользователя в списке
    updateUserInList: (state, action) => {
      const updatedUser = action.payload;
      const index = state.users.findIndex(user => user.id === updatedUser.id);
      
      if (index !== -1) {
        state.users[index] = updatedUser;
      }
    },
    
    // Добавление пользователя в список
    addUserToList: (state, action) => {
      const newUser = action.payload;
      state.users.unshift(newUser);
    },
    
    // Удаление пользователя из списка
    removeUserFromList: (state, action) => {
      const userId = action.payload;
      state.users = state.users.filter(user => user.id !== userId);
      state.usersByRole = state.usersByRole.filter(user => user.id !== userId);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.pagination = {
          total: action.payload.total,
          limit: action.payload.limit,
          offset: action.payload.offset,
        };
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Roles
      .addCase(fetchRoles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.roles = action.payload;
        state.error = null;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create User
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users.unshift(action.payload);
        state.error = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch User
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
        state.error = null;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update User
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedUser = action.payload;
        
        // Обновляем пользователя в списке
        const index = state.users.findIndex(user => user.id === updatedUser.id);
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
        
        // Обновляем в списке по ролям
        const roleIndex = state.usersByRole.findIndex(user => user.id === updatedUser.id);
        if (roleIndex !== -1) {
          state.usersByRole[roleIndex] = updatedUser;
        }
        
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const userId = action.payload;
        state.users = state.users.filter(user => user.id !== userId);
        state.usersByRole = state.usersByRole.filter(user => user.id !== userId);
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Activate User
      .addCase(activateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(activateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedUser = action.payload;
        
        // Обновляем пользователя в списке
        const index = state.users.findIndex(user => user.id === updatedUser.id);
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
        
        state.error = null;
      })
      .addCase(activateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Deactivate User
      .addCase(deactivateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deactivateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedUser = action.payload;
        
        // Обновляем пользователя в списке
        const index = state.users.findIndex(user => user.id === updatedUser.id);
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
        
        state.error = null;
      })
      .addCase(deactivateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Users By Role
      .addCase(fetchUsersByRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsersByRole.fulfilled, (state, action) => {
        state.isLoading = false;
        state.usersByRole = action.payload;
        state.error = null;
      })
      .addCase(fetchUsersByRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Экспорт действий
export const {
  clearError,
  clearUsers,
  updateUserInList,
  addUserToList,
  removeUserFromList,
} = usersSlice.actions;

// Селекторы
export const selectUsers = (state) => state.users.users;
export const selectCurrentUser = (state) => state.users.currentUser;
export const selectRoles = (state) => state.users.roles;
export const selectUsersByRole = (state) => state.users.usersByRole;
export const selectUsersLoading = (state) => state.users.isLoading;
export const selectUsersError = (state) => state.users.error;
export const selectUsersPagination = (state) => state.users.pagination;

export default usersSlice.reducer;
