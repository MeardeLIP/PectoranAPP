/**
 * Экран заказов для повара
 * Отображение активных заказов и управление их статусами
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Menu,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'react-native-linear-gradient';

import { fetchActiveOrders, updateOrderStatus } from '../../store/slices/ordersSlice';
import { selectActiveOrders, selectOrdersLoading } from '../../store/slices/ordersSlice';
import { ORDER_STATUS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, WS_EVENTS } from '../../constants';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import webSocketService from '../../services/websocket';

const OrdersScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const activeOrders = useSelector(selectActiveOrders);
  const isLoading = useSelector(selectOrdersLoading);

  const [menuVisible, setMenuVisible] = useState({});

  useEffect(() => {
    dispatch(fetchActiveOrders());
  }, [dispatch]);

  // Подписка на WebSocket события для получения новых заказов в реальном времени
  useEffect(() => {
    const handleNewOrder = (orderData) => {
      console.log('🆕 [OrdersScreen] Получен новый заказ через WebSocket:', orderData);
      // Обновляем список активных заказов
      dispatch(fetchActiveOrders());
      // Показываем уведомление о новом заказе
      showSuccessToast(`Новый заказ №${orderData.id} со столика ${orderData.table_number}`);
    };

    const handleOrderUpdated = (data) => {
      console.log('🔄 [OrdersScreen] Заказ обновлен через WebSocket:', data);
      // Обновляем список заказов при изменении статуса
      dispatch(fetchActiveOrders());
    };

    const handleOrderCancelled = (data) => {
      console.log('❌ [OrdersScreen] Заказ отменен через WebSocket:', data);
      // Обновляем список заказов при отмене
      dispatch(fetchActiveOrders());
    };

    // Подписываемся на события WebSocket
    webSocketService.on('order_new', handleNewOrder);
    webSocketService.on('order_updated', handleOrderUpdated);
    webSocketService.on('order_cancelled', handleOrderCancelled);

    // Отписываемся от событий при размонтировании компонента
    return () => {
      webSocketService.off('order_new', handleNewOrder);
      webSocketService.off('order_updated', handleOrderUpdated);
      webSocketService.off('order_cancelled', handleOrderCancelled);
    };
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchActiveOrders());
  };

  const handleStartCooking = async (order) => {
    try {
      await dispatch(updateOrderStatus({
        orderId: order.id,
        status: ORDER_STATUS.PREPARING,
        notes: '',
      })).unwrap();

      showSuccessToast(`Заказ №${order.id} начат`);
      setMenuVisible({ ...menuVisible, [order.id]: false });
      dispatch(fetchActiveOrders());
    } catch (error) {
      showErrorToast(error || 'Ошибка изменения статуса');
    }
  };

  const handleOpenDetails = (order) => {
    setMenuVisible({ ...menuVisible, [order.id]: false });
    navigation.navigate('CookOrderDetails', { order });
  };

  const toggleMenu = (orderId) => {
    setMenuVisible({ ...menuVisible, [orderId]: !menuVisible[orderId] });
  };

  const getStatusColor = (status) => {
    return ORDER_STATUS_COLORS[status] || COLORS.GRAY;
  };


  const formatTime = (dateString) => {
    if (!dateString) {
      return 'Нет данных';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Некорректная дата';
    }
    try {
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Ошибка формата';
    }
  };

  const getTimeInStatus = (order) => {
    if (!order || !order.created_at) {
      return '—';
    }
    try {
      const now = new Date();
      const created = new Date(order.created_at);
      
      if (isNaN(created.getTime()) || isNaN(now.getTime())) {
        return '—';
      }
      
      const diffMinutes = Math.floor((now - created) / (1000 * 60));
      
      if (diffMinutes < 0) {
        return '0 мин';
      }
      
      if (diffMinutes < 60) {
        return `${diffMinutes} мин`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `${hours}ч ${minutes}м`;
      }
    } catch (error) {
      return '—';
    }
  };

  const renderOrderItem = ({ item: orderItem }) => (
    <View style={styles.orderItem}>
      <Text style={styles.orderItemName}>
        {orderItem.quantity}x {orderItem.menuItem?.name || 'Позиция удалена'}
      </Text>
      {orderItem.notes && (
        <Text style={styles.orderItemNotes}>
          Примечание: {orderItem.notes}
        </Text>
      )}
    </View>
  );

  const renderOrder = ({ item: order }) => {
    const timeInStatus = getTimeInStatus(order);

    return (
      <Card style={styles.orderCard}>
        <Card.Content>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Title style={styles.orderNumber}>Заказ #{order.id}</Title>
            </View>
            
            <View style={styles.orderStatus}>
              <Chip
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(order.status) }
                ]}
                textStyle={styles.statusChipText}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </Chip>
              <Text style={styles.timeText}>{timeInStatus}</Text>
            </View>
          </View>

          <View style={styles.orderItems}>
            <Text style={styles.orderItemsTitle}>Позиции:</Text>
            <FlatList
              data={order.orderItems || []}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          </View>

          {order.notes && (
            <View style={styles.orderNotes}>
              <Text style={styles.orderNotesTitle}>Заметки:</Text>
              <Text style={styles.orderNotesText}>{order.notes}</Text>
            </View>
          )}

          <View style={styles.orderFooter}>
            <Text style={styles.orderTime}>
              Создан: {formatTime(order.created_at)}
            </Text>
            
            <Menu
              visible={menuVisible[order.id] || false}
              onDismiss={() => setMenuVisible({ ...menuVisible, [order.id]: false })}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={24}
                  onPress={() => toggleMenu(order.id)}
                />
              }
            >
              {order.status === ORDER_STATUS.NEW && (
                <Menu.Item
                  onPress={() => handleStartCooking(order)}
                  title="Начать готовить"
                  leadingIcon="play-circle"
                />
              )}
              <Menu.Item
                onPress={() => handleOpenDetails(order)}
                title="Открыть детали"
                leadingIcon="format-list-checks"
              />
            </Menu>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>Нет активных заказов</Text>
      <Paragraph style={styles.emptyStateText}>
        Все заказы обработаны. Ожидайте новых заказов от официантов.
      </Paragraph>
    </View>
  );

  // Группируем заказы по столикам
  const ordersByTable = activeOrders.reduce((acc, order) => {
    const tableNum = order.table_number;
    if (!acc[tableNum]) {
      acc[tableNum] = [];
    }
    acc[tableNum].push(order);
    return acc;
  }, {});

  // Преобразуем объект в массив для FlatList
  const tableGroups = Object.entries(ordersByTable).map(([tableNum, orders]) => ({
    tableNumber: parseInt(tableNum),
    orders: orders
  })).sort((a, b) => a.tableNumber - b.tableNumber);

  const renderTableGroup = ({ item: tableGroup }) => (
    <View style={styles.tableGroup}>
      <View style={styles.tableHeader}>
        <Title style={styles.tableTitle}>Столик №{tableGroup.tableNumber}</Title>
        <Chip style={styles.tableCountChip}>
          {tableGroup.orders.length} {tableGroup.orders.length === 1 ? 'заказ' : 'заказа'}
        </Chip>
      </View>
      {tableGroup.orders.map((order) => (
        <View key={order.id} style={styles.orderInGroup}>
          {renderOrder({ item: order })}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.LIGHT, COLORS.WHITE]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Title style={styles.title}>Активные заказы</Title>
              <Paragraph style={styles.subtitle}>
                Управляйте статусами заказов
              </Paragraph>
            </View>
          </View>
        </View>

        <FlatList
          data={tableGroups}
          renderItem={renderTableGroup}
          keyExtractor={(item) => `table-${item.tableNumber}`}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              colors={[COLORS.PRIMARY]}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    padding: SPACING.MD,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.H2,
    color: COLORS.DARK,
    marginBottom: SPACING.SM,
  },
  subtitle: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
    textAlign: 'center',
  },
  ordersList: {
    padding: SPACING.MD,
    paddingBottom: 100,
  },
  orderCard: {
    marginBottom: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    elevation: 4,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    ...TYPOGRAPHY.H3,
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  tableNumber: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: SPACING.XS,
  },
  statusChipText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  timeText: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.DARK_GRAY,
  },
  orderItems: {
    marginBottom: SPACING.MD,
  },
  orderItemsTitle: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK,
    fontWeight: '600',
    marginBottom: SPACING.SM,
  },
  orderItem: {
    marginBottom: SPACING.XS,
  },
  orderItemName: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK,
  },
  orderItemNotes: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.DARK_GRAY,
    fontStyle: 'italic',
    marginLeft: SPACING.SM,
  },
  orderNotes: {
    marginBottom: SPACING.MD,
  },
  orderNotesTitle: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK,
    fontWeight: '600',
    marginBottom: SPACING.XS,
  },
  orderNotesText: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTime: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.DARK_GRAY,
    flex: 1,
  },
  orderActions: {
    alignItems: 'flex-end',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.DARK_GRAY,
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  emptyStateText: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
    textAlign: 'center',
    paddingHorizontal: SPACING.LG,
  },
  tableGroup: {
    marginBottom: SPACING.LG,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.SM,
  },
  tableTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  tableCountChip: {
    backgroundColor: COLORS.WHITE,
  },
  orderInGroup: {
    marginBottom: SPACING.SM,
  },
});

export default OrdersScreen;
