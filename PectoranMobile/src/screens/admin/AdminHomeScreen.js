/**
 * Главный экран администратора/директора
 * Статистика, управление меню и пользователями
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Appbar, BottomNavigation } from 'react-native-paper';
import { COLORS } from '../../constants';
import { logout } from '../../store/slices/authSlice';

// Импорт экранов
import StatsScreen from './StatsScreen';
import MenuManagementScreen from './MenuManagementScreen';
import UsersManagementScreen from './UsersManagementScreen';
import UnpaidOrdersScreen from './UnpaidOrdersScreen';

const AdminHomeScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const [index, setIndex] = useState(0);

  const [routes] = useState([
    { key: 'stats', title: 'Статистика', focusedIcon: 'chart-line', unfocusedIcon: 'chart-line-variant' },
    { key: 'unpaid', title: 'Оплата', focusedIcon: 'cash-check', unfocusedIcon: 'cash' },
    { key: 'menu', title: 'Меню', focusedIcon: 'food', unfocusedIcon: 'food-outline' },
    { key: 'users', title: 'Пользователи', focusedIcon: 'account-group', unfocusedIcon: 'account-group-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    stats: StatsScreen,
    unpaid: UnpaidOrdersScreen,
    menu: MenuManagementScreen,
    users: UsersManagementScreen,
  });

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          title={user?.role === 'director' ? 'Директор' : 'Администратор'}
          subtitle={user?.full_name || user?.username}
        />
        <Appbar.Action icon="logout" onPress={() => dispatch(logout())} />
      </Appbar.Header>

      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        barStyle={styles.bottomNav}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
  },
  bottomNav: {
    backgroundColor: COLORS.WHITE,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AdminHomeScreen;


