/**
 * Навигатор для официанта
 * Управление экранами официанта
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Импорт экранов официанта
import TableSelectionScreen from '../screens/waiter/TableSelectionScreen';
import MenuScreen from '../screens/waiter/MenuScreen';
import MyOrdersScreen from '../screens/waiter/MyOrdersScreen';
import ProfileScreen from '../screens/waiter/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Стек для работы с заказами
const OrdersStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="OrdersList" 
      component={MyOrdersScreen}
      options={{ title: 'Мои заказы' }}
    />
  </Stack.Navigator>
);

// Стек для работы с меню
const MenuStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="TableSelection" 
      component={TableSelectionScreen}
      options={{ title: 'Выбор столика' }}
    />
    <Stack.Screen 
      name="MenuScreen" 
      component={MenuScreen}
      options={{ title: 'Меню' }}
    />
  </Stack.Navigator>
);

const WaiterNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Tables':
              iconName = focused ? 'table' : 'table-outline';
              break;
            case 'Orders':
              iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
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
        name="Tables" 
        component={MenuStack}
        options={{ title: 'Столики' }}
      />
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

export default WaiterNavigator;
