/**
 * Навигатор для директора
 * Управление экранами директора: Статистика, Меню, Пользователи, Профиль
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Импорт экранов директора
import StatsScreen from '../screens/admin/StatsScreen';
import MenuManagementScreen from '../screens/admin/MenuManagementScreen';
import UsersManagementScreen from '../screens/admin/UsersManagementScreen';
import ProfileScreen from '../screens/admin/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Стек для меню
const MenuStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="MenuList" 
      component={MenuManagementScreen}
      options={{ title: 'Управление меню' }}
    />
  </Stack.Navigator>
);

// Стек для пользователей
const UsersStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="UsersList" 
      component={UsersManagementScreen}
      options={{ title: 'Пользователи' }}
    />
  </Stack.Navigator>
);

// Стек для статистики
const StatsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="StatsList" 
      component={StatsScreen}
      options={{ title: 'Статистика' }}
    />
  </Stack.Navigator>
);

const DirectorNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Stats':
              iconName = focused ? 'chart-line' : 'chart-line-variant';
              break;
            case 'Menu':
              iconName = focused ? 'food' : 'food-outline';
              break;
            case 'Users':
              iconName = focused ? 'account-group' : 'account-group-outline';
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
        name="Stats" 
        component={StatsStack}
        options={{ title: 'Статистика' }}
      />
      <Tab.Screen 
        name="Menu" 
        component={MenuStack}
        options={{ title: 'Меню' }}
      />
      <Tab.Screen 
        name="Users" 
        component={UsersStack}
        options={{ title: 'Пользователи' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Профиль' }}
      />
    </Tab.Navigator>
  );
};

export default DirectorNavigator;

