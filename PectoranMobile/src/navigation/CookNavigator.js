/**
 * Навигатор для повара
 * Управление экранами повара
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Импорт экранов повара
import OrdersScreen from '../screens/cook/OrdersScreen';
import CookOrderDetailsScreen from '../screens/cook/CookOrderDetailsScreen';
import ProfileScreen from '../screens/cook/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Стек для работы с заказами
const OrdersStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="OrdersList" 
      component={OrdersScreen}
      options={{ title: 'Активные заказы' }}
    />
    <Stack.Screen 
      name="CookOrderDetails" 
      component={CookOrderDetailsScreen}
      options={{ title: 'Детали заказа' }}
    />
  </Stack.Navigator>
);

const CookNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Orders':
              iconName = focused ? 'chef-hat' : 'chef-hat-outline';
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
        name="Orders" 
        component={OrdersStack}
        options={{ title: 'Заказы' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Профиль' }}
      />
    </Tab.Navigator>
  );
};

export default CookNavigator;
