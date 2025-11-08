/**
 * Главный файл приложения PectoranAPP
 * Настройка навигации, провайдеров и роутинга
 */

import React, { useEffect } from 'react';
import { StatusBar, Platform, ActivityIndicator, View } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { store, persistor } from './src/store';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { setToken, setUser } from './src/store/slices/authSlice';
import { theme } from './src/constants/theme';
import { COLORS, STORAGE_KEYS } from './src/constants';
import webSocketService from './src/services/websocket';
// import notificationService from './src/services/notificationService';

const App = () => {
  useEffect(() => {
    // Настройка статус-бара
    StatusBar.setBarStyle('light-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(COLORS.PRIMARY, true);
    }
  }, []);

  const AppContent = () => {
    const dispatch = useDispatch();
    const auth = useSelector((state: any) => state.auth);
    const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

    useEffect(() => {
      // Проверка сохраненной сессии при старте
      const checkSavedSession = async () => {
        try {
          const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
          const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
          
          if (token && userDataStr) {
            const userData = JSON.parse(userDataStr);
            console.log('✅ [App] Восстановление сессии:', userData.role);
            dispatch(setToken(token));
            dispatch(setUser(userData));
            
            // Подключаем WebSocket после восстановления сессии
            try {
              await webSocketService.connect();
              console.log('✅ [App] WebSocket подключен после восстановления сессии');
            } catch (wsError) {
              console.error('❌ [App] Ошибка подключения WebSocket:', wsError);
            }
          }

          // Инициализируем уведомления для всех ролей
          // await notificationService.initialize();
        } catch (error) {
          console.error('❌ [App] Ошибка проверки сессии:', error);
        } finally {
          setIsCheckingAuth(false);
        }
      };

      checkSavedSession();
    }, [dispatch]);

    if (isCheckingAuth) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      );
    }

    return (
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    );
  };

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <AppContent />
            <Toast />
          </PaperProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
