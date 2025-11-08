/**
 * Навигатор для администратора
 * Управление экранами администратора: только Оплата и Профиль
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Импорт экранов администратора
import UnpaidOrdersScreen from '../screens/admin/UnpaidOrdersScreen';
import ProfileScreen from '../screens/admin/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Стек для неоплаченных заказов
const UnpaidOrdersStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="UnpaidOrdersList" 
      component={UnpaidOrdersScreen}
      options={{ title: 'Неоплаченные заказы' }}
    />
  </Stack.Navigator>
);

const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Unpaid':
              iconName = focused ? 'cash-check' : 'cash';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1976D2',
        tabBarInactiveTintColor: '#9E9E9E',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Unpaid" 
        component={UnpaidOrdersStack}
        options={{ title: 'Оплата' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Профиль' }}
      />
    </Tab.Navigator>
  );
};

export default AdminNavigator;
