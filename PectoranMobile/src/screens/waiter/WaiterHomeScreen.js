/**
 * Главный экран официанта
 * Отображает навигацию по основным функциям официанта
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Appbar, FAB, Portal } from 'react-native-paper';
import { COLORS } from '../../constants';
import { logout } from '../../store/slices/authSlice';

// Импорт экранов
import TableSelectionScreen from './TableSelectionScreen';
import MenuScreen from './MenuScreen';
import MyOrdersScreen from './MyOrdersScreen';

const WaiterHomeScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const [currentScreen, setCurrentScreen] = useState('tables'); // 'tables' | 'menu' | 'orders'
  const [selectedTable, setSelectedTable] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);

  const handleTableSelect = (tableNumber) => {
    setSelectedTable(tableNumber);
    setCurrentScreen('menu');
  };

  const handleBackToTables = () => {
    setCurrentScreen('tables');
    setSelectedTable(null);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return (
          <MenuScreen
            tableNumber={selectedTable}
            onBack={handleBackToTables}
          />
        );
      case 'orders':
        return <MyOrdersScreen />;
      case 'tables':
      default:
        return (
          <TableSelectionScreen
            onTableSelect={handleTableSelect}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
             <Appbar.Header style={styles.header}>
               {currentScreen !== 'tables' && (
                 <Appbar.BackAction onPress={handleBackToTables} />
               )}
               <Appbar.Content
                 title={
                   currentScreen === 'orders' 
                     ? 'Мои заказы' 
                     : `Официант №${user?.waiter_number}`
                 }
                 subtitle={user?.full_name}
               />
               <Appbar.Action icon="logout" onPress={() => dispatch(logout())} />
             </Appbar.Header>

      <View style={styles.content}>
        {renderScreen()}
      </View>

             <Portal>
               <FAB.Group
                 open={fabOpen}
                 visible={currentScreen === 'tables' || currentScreen === 'orders'}
                 icon={fabOpen ? 'close' : 'menu'}
                 actions={[
                   {
                     icon: 'table-furniture',
                     label: 'Мои столики',
                     onPress: () => setCurrentScreen('tables'),
                   },
                   {
                     icon: 'clipboard-list',
                     label: 'Мои заказы',
                     onPress: () => setCurrentScreen('orders'),
                   },
                 ]}
                 onStateChange={({ open }) => setFabOpen(open)}
               />
             </Portal>
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

export default WaiterHomeScreen;


