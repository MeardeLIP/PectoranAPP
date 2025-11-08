/**
 * Redux slice для заказов
 * Управление состоянием заказов и корзины
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersAPI } from '../../services/api';

// Асинхронные действия
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      console.log('🔄 [ordersSlice] Создаем заказ:', orderData);
      const response = await ordersAPI.createOrder(orderData);
      console.log('✅ [ordersSlice] Заказ создан успешно:', response.data);
      return response.data.order;
    } catch (error) {
      console.error('❌ [ordersSlice] Ошибка создания заказа:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Ошибка создания заказа');
    }
  }
);

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getOrders(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки заказов');
    }
  }
);

export const fetchActiveOrders = createAsyncThunk(
  'orders/fetchActiveOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getActiveOrders();
      return response.data.orders;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки активных заказов');
    }
  }
);

export const fetchOrder = createAsyncThunk(
  'orders/fetchOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getOrder(orderId);
      return response.data.order;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки заказа');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, status, notes }, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.updateOrderStatus(orderId, status, notes);
      return response.data.order;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка изменения статуса заказа');
    }
  }
);

export const fetchOrderHistory = createAsyncThunk(
  'orders/fetchOrderHistory',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getOrderHistory(orderId);
      return response.data.history;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки истории заказа');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      await ordersAPI.cancelOrder(orderId);
      return orderId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка отмены заказа');
    }
  }
);

export const payOrder = createAsyncThunk(
  'orders/payOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.payOrder(orderId);
      return response.data.order;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка оплаты заказа');
    }
  }
);

// Начальное состояние
const initialState = {
  orders: [],
  activeOrders: [],
  currentOrder: null,
  orderHistory: [],
  cartItems: [],
  cartTotal: 0,
  isLoading: false,
  error: null,
  pagination: {
    total: 0,
    limit: 50,
    offset: 0,
  },
};

// Создание slice
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // Очистка ошибки
    clearError: (state) => {
      state.error = null;
    },
    
    // Корзина
    addToCart: (state, action) => {
      const { menuItem, quantity, notes } = action.payload;
      const existingItem = state.cartItems.find(item => item.menuItem.id === menuItem.id);
      
      if (existingItem) {
        existingItem.quantity += quantity || 1;
      } else {
        state.cartItems.push({
          menuItem,
          quantity: quantity || 1,
          notes: notes || '',
        });
      }
      
      // Пересчитываем общую сумму
      state.cartTotal = state.cartItems.reduce((total, item) => 
        total + (item.menuItem.price * item.quantity), 0
      );
    },
    
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.cartItems = state.cartItems.filter(item => item.menuItem.id !== itemId);
      
      // Пересчитываем общую сумму
      state.cartTotal = state.cartItems.reduce((total, item) => 
        total + (item.menuItem.price * item.quantity), 0
      );
    },
    
    updateCartItemQuantity: (state, action) => {
      const { itemId, quantity } = action.payload;
      const item = state.cartItems.find(item => item.menuItem.id === itemId);
      
      if (item) {
        item.quantity = quantity;
        
        // Пересчитываем общую сумму
        state.cartTotal = state.cartItems.reduce((total, item) => 
          total + (item.menuItem.price * item.quantity), 0
        );
      }
    },
    
    updateCartItemNotes: (state, action) => {
      const { itemId, notes } = action.payload;
      const item = state.cartItems.find(item => item.menuItem.id === itemId);
      
      if (item) {
        item.notes = notes;
      }
    },
    
    clearCart: (state) => {
      state.cartItems = [];
      state.cartTotal = 0;
    },
    
    // Обновление заказа в списке
    updateOrderInList: (state, action) => {
      const updatedOrder = action.payload;
      const index = state.orders.findIndex(order => order.id === updatedOrder.id);
      
      if (index !== -1) {
        state.orders[index] = updatedOrder;
      }
      
      const activeIndex = state.activeOrders.findIndex(order => order.id === updatedOrder.id);
      if (activeIndex !== -1) {
        state.activeOrders[activeIndex] = updatedOrder;
      }
    },
    
    // Добавление нового заказа в список
    addOrderToList: (state, action) => {
      const newOrder = action.payload;
      state.orders.unshift(newOrder);
      state.activeOrders.unshift(newOrder);
    },
    
    // Удаление заказа из списка
    removeOrderFromList: (state, action) => {
      const orderId = action.payload;
      state.orders = state.orders.filter(order => order.id !== orderId);
      state.activeOrders = state.activeOrders.filter(order => order.id !== orderId);
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders.unshift(action.payload);
        state.activeOrders.unshift(action.payload);
        state.cartItems = [];
        state.cartTotal = 0;
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders;
        state.pagination = {
          total: action.payload.total,
          limit: action.payload.limit,
          offset: action.payload.offset,
        };
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Active Orders
      .addCase(fetchActiveOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActiveOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeOrders = action.payload;
        state.error = null;
      })
      .addCase(fetchActiveOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Order
      .addCase(fetchOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
        state.error = null;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Order Status
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedOrder = action.payload;
        
        // Обновляем заказ в списках
        const ordersIndex = state.orders.findIndex(order => order.id === updatedOrder.id);
        if (ordersIndex !== -1) {
          state.orders[ordersIndex] = updatedOrder;
        }
        
        const activeIndex = state.activeOrders.findIndex(order => order.id === updatedOrder.id);
        if (activeIndex !== -1) {
          state.activeOrders[activeIndex] = updatedOrder;
        }
        
        // Если заказ завершен, удаляем из активных
        if (['delivered', 'cancelled'].includes(updatedOrder.status)) {
          state.activeOrders = state.activeOrders.filter(order => order.id !== updatedOrder.id);
        }
        
        state.error = null;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Order History
      .addCase(fetchOrderHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderHistory = action.payload;
        state.error = null;
      })
      .addCase(fetchOrderHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Cancel Order
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const orderId = action.payload;
        
        // Удаляем заказ из активных
        state.activeOrders = state.activeOrders.filter(order => order.id !== orderId);
        
        // Обновляем статус в общем списке
        const orderIndex = state.orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = 'cancelled';
        }
        
        state.error = null;
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Pay Order
      .addCase(payOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(payOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedOrder = action.payload;
        // Обновляем заказ в списках
        const idx = state.orders.findIndex(o => o.id === updatedOrder.id);
        if (idx !== -1) state.orders[idx] = updatedOrder;
        const aidx = state.activeOrders.findIndex(o => o.id === updatedOrder.id);
        if (aidx !== -1) state.activeOrders[aidx] = updatedOrder;
        state.error = null;
      })
      .addCase(payOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Экспорт действий
export const {
  clearError,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  updateCartItemNotes,
  clearCart,
  updateOrderInList,
  addOrderToList,
  removeOrderFromList,
} = ordersSlice.actions;

// Селекторы
export const selectOrders = (state) => state.orders.orders;
export const selectActiveOrders = (state) => state.orders.activeOrders;
export const selectCurrentOrder = (state) => state.orders.currentOrder;
export const selectOrderHistory = (state) => state.orders.orderHistory;
export const selectCartItems = (state) => state.orders.cartItems;
export const selectCartTotal = (state) => state.orders.cartTotal;
export const selectOrdersLoading = (state) => state.orders.isLoading;
export const selectOrdersError = (state) => state.orders.error;
export const selectOrdersPagination = (state) => state.orders.pagination;

// Селектор для заказов конкретного официанта
export const selectWaiterOrders = (waiterId) => (state) => 
  state.orders.orders.filter(order => order.waiter_id === waiterId);

export default ordersSlice.reducer;
