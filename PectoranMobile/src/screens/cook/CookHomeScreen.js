/**
 * Главный экран повара
 * Отображает активные заказы для приготовления
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Appbar } from 'react-native-paper';
import { COLORS } from '../../constants';
import { logout } from '../../store/slices/authSlice';
import OrdersScreen from './OrdersScreen';

const CookHomeScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          title="Повар"
          subtitle={user?.full_name}
        />
        <Appbar.Action icon="logout" onPress={() => dispatch(logout())} />
      </Appbar.Header>

      <View style={styles.content}>
        <OrdersScreen />
      </View>
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
  content: {
    flex: 1,
  },
});

export default CookHomeScreen;


