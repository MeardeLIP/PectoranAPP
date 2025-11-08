/**
 * Экран "Мои заказы" для официанта
 * Отображение активных заказов конкретного официанта
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Title, Paragraph, Chip, List, Badge, Divider, Button } from 'react-native-paper';
import { LinearGradient } from 'react-native-linear-gradient';
import { fetchOrders, selectWaiterOrders, updateOrderStatus } from '../../store/slices/ordersSlice';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import webSocketService from '../../services/websocket';

const MyOrdersScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const orders = useSelector(selectWaiterOrders(user?.id));
  const isLoading = useSelector((state) => state.orders.isLoading);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchOrders({ waiter_id: user.id }));
    }
  }, [dispatch, user?.id]);

  // Подписка на WebSocket события для получения уведомлений о готовности заказов
  useEffect(() => {
    const handleOrderReady = (data) => {
      console.log('✅ [MyOrdersScreen] Заказ готов через WebSocket:', data);
      // Показываем уведомление
      showSuccessToast(`Заказ №${data.orderId} готов! Столик ${data.tableNumber}`);
      // Обновляем список заказов
      if (user?.id) {
        dispatch(fetchOrders({ waiter_id: user.id }));
      }
    };

    const handleOrderUpdated = (data) => {
      console.log('🔄 [MyOrdersScreen] Заказ обновлен через WebSocket:', data);
      // Обновляем список заказов при изменении статуса
      if (user?.id) {
        dispatch(fetchOrders({ waiter_id: user.id }));
      }
    };

    const handleOrderPaid = (data) => {
      console.log('💰 [MyOrdersScreen] Заказ оплачен через WebSocket:', data);
      // Обновляем список заказов при оплате
      if (user?.id) {
        dispatch(fetchOrders({ waiter_id: user.id }));
      }
    };

    // Подписываемся на события WebSocket
    webSocketService.on('order_ready', handleOrderReady);
    webSocketService.on('order_updated', handleOrderUpdated);
    webSocketService.on('order_paid', handleOrderPaid);

    // Отписываемся от событий при размонтировании компонента
    return () => {
      webSocketService.off('order_ready', handleOrderReady);
      webSocketService.off('order_updated', handleOrderUpdated);
      webSocketService.off('order_paid', handleOrderPaid);
    };
  }, [dispatch, user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
      await dispatch(fetchOrders({ waiter_id: user.id }));
    }
    setRefreshing(false);
  };

  const getStatusColor = (status, isPaid) => {
    switch (status) {
      case 'new': return COLORS.WARNING;
      case 'accepted': return COLORS.INFO;
      case 'preparing': return COLORS.SECONDARY;
      case 'ready': return COLORS.SUCCESS;
      case 'delivered': 
        // Если доставлен но не оплачен - оранжевый цвет
        return isPaid === false ? '#FF9800' : COLORS.GRAY;
      default: return COLORS.GRAY;
    }
  };

  const getStatusText = (status, isPaid) => {
    switch (status) {
      case 'new': return 'Новый';
      case 'accepted': return 'Принят';
      case 'preparing': return 'Готовится';
      case 'ready': return 'Готов';
      case 'delivered': 
        // Показываем явный статус для доставленных неоплаченных заказов
        return isPaid === false ? 'Доставлен, не оплачен' : 'Доставлен';
      default: return status;
    }
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

  const onDelivered = async (orderId) => {
    try {
      console.log('🔄 [MyOrdersScreen] Изменение статуса заказа на "delivered":', orderId);
      await dispatch(updateOrderStatus({ orderId, status: 'delivered', notes: '' })).unwrap();
      
      // Успешное изменение статуса
      console.log('✅ [MyOrdersScreen] Статус заказа успешно изменен');
      showSuccessToast('Заказ отмечен как доставленный');
      
      // Обновляем список заказов
      if (user?.id) {
        await dispatch(fetchOrders({ waiter_id: user.id }));
      }
    } catch (error) {
      console.error('❌ [MyOrdersScreen] Ошибка при изменении статуса заказа:', error);
      const errorMessage = error || 'Произошла ошибка при изменении статуса заказа';
      showErrorToast(errorMessage);
    }
  };

  const renderOrder = (order) => (
    <Card key={order.id} style={styles.orderCard}>
      <Card.Content>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Title style={styles.orderTitle}>Заказ #{order.id}</Title>
            <Paragraph style={styles.tableInfo}>Столик {order.table_number}</Paragraph>
          </View>
          <View style={styles.orderStatus}>
            <Chip 
              style={[styles.statusChip, { backgroundColor: getStatusColor(order.status, order.is_paid) }]}
              textStyle={styles.statusText}
            >
              {getStatusText(order.status, order.is_paid)}
            </Chip>
            <Paragraph style={styles.timeText}>
              {formatTime(order.created_at)}
            </Paragraph>
          </View>
        </View>

        {order.customer_name && (
          <Paragraph style={styles.customerInfo}>
            Клиент: {order.customer_name}
          </Paragraph>
        )}

        {order.notes && (
          <Paragraph style={styles.notesInfo}>
            Примечание: {order.notes}
          </Paragraph>
        )}

        <Divider style={styles.divider} />

        <View style={styles.itemsSection}>
          <Title style={styles.itemsTitle}>Позиции заказа:</Title>
          {order.orderItems?.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Paragraph style={styles.itemName}>
                  {item.menuItem?.name || 'Неизвестное блюдо'}
                </Paragraph>
                <Paragraph style={styles.itemPrice}>
                  {item.price_at_order} ₽ × {item.quantity}
                </Paragraph>
              </View>
              <Badge style={styles.quantityBadge}>
                {item.quantity}
              </Badge>
            </View>
          ))}
        </View>

        <View style={styles.orderTotal}>
          <Title style={styles.totalText}>
            Итого: {order.total_amount} ₽
          </Title>
          {order.status === 'ready' && (
            <Button mode="contained" style={styles.deliveredBtn} onPress={() => onDelivered(order.id)}>
              Доставлено
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  // Показываем активные заказы и доставленные неоплаченные заказы
  const activeOrders = orders.filter(order => 
    order.waiter_id === user?.id && 
    (order.status !== 'delivered' || (order.status === 'delivered' && order.is_paid === false))
  );

  return (
    <LinearGradient
      colors={[COLORS.LIGHT, COLORS.WHITE]}
      style={styles.container}
    >
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Title style={styles.title}>Мои заказы</Title>
          <Paragraph style={styles.subtitle}>
            Активные заказы: {activeOrders.length}
          </Paragraph>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Paragraph>Загрузка заказов...</Paragraph>
          </View>
        ) : activeOrders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Title style={styles.emptyTitle}>Нет активных заказов</Title>
              <Paragraph style={styles.emptyText}>
                Ваши заказы появятся здесь после создания
              </Paragraph>
            </Card.Content>
          </Card>
        ) : (
          activeOrders.map(renderOrder)
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.MD,
  },
  header: {
    marginBottom: SPACING.LG,
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
    marginBottom: SPACING.MD,
  },
  orderCard: {
    marginBottom: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    ...TYPOGRAPHY.H4,
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  tableInfo: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: SPACING.XS,
  },
  statusText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  timeText: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.GRAY,
  },
  customerInfo: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  notesInfo: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
    fontStyle: 'italic',
    marginBottom: SPACING.SM,
  },
  divider: {
    marginVertical: SPACING.SM,
  },
  itemsSection: {
    marginBottom: SPACING.MD,
  },
  itemsTitle: {
    ...TYPOGRAPHY.H5,
    color: COLORS.DARK,
    marginBottom: SPACING.SM,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
    paddingVertical: SPACING.XS,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  itemPrice: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.GRAY,
  },
  quantityBadge: {
    backgroundColor: COLORS.PRIMARY,
    marginLeft: SPACING.SM,
  },
  orderTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.LIGHT_GRAY,
    paddingTop: SPACING.SM,
    alignItems: 'flex-end',
  },
  totalText: {
    ...TYPOGRAPHY.H4,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  deliveredBtn: {
    marginTop: SPACING.SM,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  emptyCard: {
    marginTop: SPACING.XL,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  emptyTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.DARK_GRAY,
    marginBottom: SPACING.SM,
  },
  emptyText: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.GRAY,
    textAlign: 'center',
  },
});

export default MyOrdersScreen;
