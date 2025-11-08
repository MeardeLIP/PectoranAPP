/**
 * Главный навигатор приложения
 * Управление навигацией между экранами на основе роли пользователя
 */

import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { ActivityIndicator, View } from 'react-native';

import { selectIsAuthenticated, selectUserRole, selectIsLoading } from '../store/slices/authSlice';
import { setAppReady } from '../store/slices/appSlice';

// Импорт экранов
import LoginScreen from '../screens/auth/LoginScreen';
import WaiterNavigator from './WaiterNavigator';
import CookNavigator from './CookNavigator';
import AdminNavigator from './AdminNavigator';
import DirectorNavigator from './DirectorNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);
  const isLoading = useSelector(selectIsLoading);

  useEffect(() => {
    // Инициализация приложения
    const initApp = async () => {
      try {
        // Здесь можно добавить дополнительную инициализацию
        // Например, проверку токена, загрузку настроек и т.д.
        
        dispatch(setAppReady(true));
      } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
        dispatch(setAppReady(true));
      }
    };

    initApp();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      {!isAuthenticated ? (
        // Экран входа для неавторизованных пользователей
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        // Навигация на основе роли пользователя
        <>
          {userRole === 'waiter' && (
            <Stack.Screen name="Waiter" component={WaiterNavigator} />
          )}
          {userRole === 'cook' && (
            <Stack.Screen name="Cook" component={CookNavigator} />
          )}
          {userRole === 'admin' && (
            <Stack.Screen name="Admin" component={AdminNavigator} />
          )}
          {userRole === 'director' && (
            <Stack.Screen name="Director" component={DirectorNavigator} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
