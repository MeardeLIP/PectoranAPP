/**
 * Redux slice для меню
 * Управление состоянием меню и категорий
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { menuAPI } from '../../services/api';

// Асинхронные действия
export const fetchMenu = createAsyncThunk(
  'menu/fetchMenu',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 [menuSlice] Запрашиваем меню с сервера...');
      const response = await menuAPI.getMenu();
      console.log('✅ [menuSlice] Получен ответ от сервера:', response);
      
      // Backend возвращает: { success: true, data: { menu: [...] } }
      // menuAPI.getMenu() возвращает response.data, который уже содержит { success, data: { menu } }
      const menu = response?.data?.menu || response?.menu || [];
      
      if (!Array.isArray(menu)) {
        console.error('❌ [menuSlice] menu не является массивом:', menu);
        return rejectWithValue('Неверный формат данных меню');
      }
      
      console.log(`✅ [menuSlice] Загружено ${menu.length} категорий меню`);
      return menu;
    } catch (error) {
      console.error('❌ [menuSlice] Ошибка загрузки меню:', error);
      console.error('❌ [menuSlice] Детали ошибки:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return rejectWithValue(error.response?.data?.message || error.message || 'Ошибка загрузки меню');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'menu/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await menuAPI.getCategories();
      return response.data.categories;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки категорий');
    }
  }
);

export const createCategory = createAsyncThunk(
  'menu/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await menuAPI.createCategory(categoryData);
      return response.data.category;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка создания категории');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'menu/updateCategory',
  async ({ id, categoryData }, { rejectWithValue }) => {
    try {
      const response = await menuAPI.updateCategory(id, categoryData);
      return response.data.category;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка обновления категории');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'menu/deleteCategory',
  async (id, { rejectWithValue }) => {
    try {
      await menuAPI.deleteCategory(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка удаления категории');
    }
  }
);

export const fetchMenuItems = createAsyncThunk(
  'menu/fetchMenuItems',
  async (params, { rejectWithValue }) => {
    try {
      const response = await menuAPI.getMenuItems(params);
      return response.data.items;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки позиций меню');
    }
  }
);

export const createMenuItem = createAsyncThunk(
  'menu/createMenuItem',
  async (itemData, { rejectWithValue }) => {
    try {
      const response = await menuAPI.createMenuItem(itemData);
      return response.data.item;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка создания позиции меню');
    }
  }
);

export const updateMenuItem = createAsyncThunk(
  'menu/updateMenuItem',
  async ({ id, itemData }, { rejectWithValue }) => {
    try {
      const response = await menuAPI.updateMenuItem(id, itemData);
      return response.data.item;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка обновления позиции меню');
    }
  }
);

export const deleteMenuItem = createAsyncThunk(
  'menu/deleteMenuItem',
  async (id, { rejectWithValue }) => {
    try {
      await menuAPI.deleteMenuItem(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка удаления позиции меню');
    }
  }
);

export const toggleItemAvailability = createAsyncThunk(
  'menu/toggleItemAvailability',
  async ({ id, isAvailable }, { rejectWithValue }) => {
    try {
      const response = await menuAPI.toggleAvailability(id, isAvailable);
      return response.data.item;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка изменения доступности');
    }
  }
);

// Начальное состояние
const initialState = {
  menu: [],
  categories: [],
  menuItems: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Создание slice
const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    // Очистка ошибки
    clearError: (state) => {
      state.error = null;
    },
    
    // Очистка меню
    clearMenu: (state) => {
      state.menu = [];
      state.categories = [];
      state.menuItems = [];
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Menu
      .addCase(fetchMenu.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.isLoading = false;
        state.menu = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Category
      .addCase(createCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories.push(action.payload);
        state.error = null;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Category
      .addCase(updateCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.categories.findIndex(cat => cat.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete Category
      .addCase(deleteCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = state.categories.filter(cat => cat.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Menu Items
      .addCase(fetchMenuItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.menuItems = action.payload;
        state.error = null;
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Menu Item
      .addCase(createMenuItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.menuItems.push(action.payload);
        state.error = null;
      })
      .addCase(createMenuItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Menu Item
      .addCase(updateMenuItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.menuItems.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.menuItems[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateMenuItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete Menu Item
      .addCase(deleteMenuItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.menuItems = state.menuItems.filter(item => item.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteMenuItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Toggle Item Availability
      .addCase(toggleItemAvailability.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleItemAvailability.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.menuItems.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.menuItems[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(toggleItemAvailability.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Экспорт действий
export const { clearError, clearMenu } = menuSlice.actions;

// Селекторы
export const selectMenu = (state) => state.menu.menu;
export const selectCategories = (state) => state.menu.categories;
export const selectMenuItems = (state) => state.menu.menuItems;
export const selectMenuLoading = (state) => state.menu.isLoading;
export const selectMenuError = (state) => state.menu.error;
export const selectMenuLastUpdated = (state) => state.menu.lastUpdated;

export default menuSlice.reducer;
