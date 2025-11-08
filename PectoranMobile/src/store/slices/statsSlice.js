/**
 * Redux slice для статистики
 * Управление состоянием статистики и аналитики
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { statsAPI } from '../../services/api';

// Асинхронные действия
export const fetchDailyStats = createAsyncThunk(
  'stats/fetchDailyStats',
  async (params, { rejectWithValue }) => {
    try {
      const response = await statsAPI.getDailyStats(params);
      console.log('Stats API Response:', response);
      // Извлекаем данные из response.data.stats
      const stats = response?.data?.stats || response?.stats || response;
      console.log('Extracted stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Ошибка загрузки статистики');
    }
  }
);

export const fetchWaiterStats = createAsyncThunk(
  'stats/fetchWaiterStats',
  async ({ waiterId, params }, { rejectWithValue }) => {
    try {
      const response = await statsAPI.getWaiterStats(waiterId, params);
      return response.data.stats;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки статистики официанта');
    }
  }
);

export const fetchPopularItems = createAsyncThunk(
  'stats/fetchPopularItems',
  async (params, { rejectWithValue }) => {
    try {
      const response = await statsAPI.getPopularItems(params);
      return response.data.popular_items;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки популярных позиций');
    }
  }
);

export const fetchRevenueStats = createAsyncThunk(
  'stats/fetchRevenueStats',
  async (params, { rejectWithValue }) => {
    try {
      const response = await statsAPI.getRevenueStats(params);
      return response.data.stats;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки статистики выручки');
    }
  }
);

export const fetchPerformanceStats = createAsyncThunk(
  'stats/fetchPerformanceStats',
  async (params, { rejectWithValue }) => {
    try {
      const response = await statsAPI.getPerformanceStats(params);
      return response.data.stats;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки статистики производительности');
    }
  }
);

// Начальное состояние
const initialState = {
  dailyStats: null,
  waiterStats: null,
  popularItems: [],
  revenueStats: null,
  performanceStats: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Создание slice
const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    // Очистка ошибки
    clearError: (state) => {
      state.error = null;
    },
    
    // Очистка статистики
    clearStats: (state) => {
      state.dailyStats = null;
      state.waiterStats = null;
      state.popularItems = [];
      state.revenueStats = null;
      state.performanceStats = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Daily Stats
      .addCase(fetchDailyStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDailyStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dailyStats = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDailyStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Waiter Stats
      .addCase(fetchWaiterStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWaiterStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.waiterStats = action.payload;
        state.error = null;
      })
      .addCase(fetchWaiterStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Popular Items
      .addCase(fetchPopularItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPopularItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.popularItems = action.payload;
        state.error = null;
      })
      .addCase(fetchPopularItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Revenue Stats
      .addCase(fetchRevenueStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRevenueStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.revenueStats = action.payload;
        state.error = null;
      })
      .addCase(fetchRevenueStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Performance Stats
      .addCase(fetchPerformanceStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPerformanceStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.performanceStats = action.payload;
        state.error = null;
      })
      .addCase(fetchPerformanceStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Экспорт действий
export const { clearError, clearStats } = statsSlice.actions;

// Селекторы
export const selectDailyStats = (state) => state.stats.dailyStats;
export const selectWaiterStats = (state) => state.stats.waiterStats;
export const selectPopularItems = (state) => state.stats.popularItems;
export const selectRevenueStats = (state) => state.stats.revenueStats;
export const selectPerformanceStats = (state) => state.stats.performanceStats;
export const selectStatsLoading = (state) => state.stats.isLoading;
export const selectStatsError = (state) => state.stats.error;
export const selectStatsLastUpdated = (state) => state.stats.lastUpdated;

export default statsSlice.reducer;
