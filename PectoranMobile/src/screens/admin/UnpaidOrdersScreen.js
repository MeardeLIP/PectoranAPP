/**
 * Экран неоплаченных заказов (админ/директор)
 */

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Title, Paragraph, Button, List, SegmentedButtons, Chip } from 'react-native-paper';
import { fetchOrders, payOrder, selectOrders, selectOrdersLoading } from '../../store/slices/ordersSlice';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { showSuccessToast } from '../../utils/toast';

const UnpaidOrdersScreen = () => {
  const dispatch = useDispatch();
  const orders = useSelector(selectOrders);
  const isLoading = useSelector(selectOrdersLoading);
  const [filterType, setFilterType] = useState('unpaid'); // 'unpaid' | 'paid' | 'all'

  useEffect(() => {
    // Загружаем доставленные заказы (и оплаченные, и неоплаченные)
    dispatch(fetchOrders({ status: 'delivered', limit: 100 }));
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchOrders({ status: 'delivered', limit: 100 }));
  }, [dispatch]);

  const displayedOrders = useMemo(() => {
    const allDelivered = (orders || []).filter(o => o.status === 'delivered');
    switch (filterType) {
      case 'unpaid':
        return allDelivered.filter(o => o.is_paid === false);
      case 'paid':
        return allDelivered.filter(o => o.is_paid === true);
      case 'all':
      default:
        return allDelivered;
    }
  }, [orders, filterType]);

  const handlePayOrder = useCallback(async (orderId) => {
    try {
      await dispatch(payOrder(orderId)).unwrap();
      showSuccessToast('Заказ отмечен как оплаченный');
      handleRefresh();
    } catch (error) {
      console.error('Ошибка при оплате заказа:', error);
    }
  }, [dispatch, handleRefresh]);

  const renderItem = ({ item }) => {
    const isPaid = item.is_paid === true;
    
    return (
      <Card 
        style={[
          styles.card,
          isPaid && styles.paidCard
        ]}
      >
        <Card.Content>
          <View style={styles.rowBetween}>
            <View style={styles.titleContainer}>
              <Title style={styles.title}>Стол #{item.table_number}</Title>
              {isPaid && (
                <Chip 
                  icon="check-circle" 
                  style={[styles.paidChip, styles.paidChipMargin]}
                  textStyle={styles.paidChipText}
                >
                  Оплачен
                </Chip>
              )}
            </View>
            <Paragraph style={[styles.amount, isPaid && styles.paidAmount]}>
              {item.total_amount} ₽
            </Paragraph>
          </View>
          <Paragraph style={styles.sub}>Заказ #{item.id}</Paragraph>
          <List.Section>
            {(item.orderItems || []).map((it) => (
              <List.Item key={it.id} title={`${it.quantity} x ${it.menuItem?.name || ''}`} right={() => <Paragraph>{it.total_price} ₽</Paragraph>} />
            ))}
          </List.Section>
          {!isPaid && (
            <Button 
              mode="contained" 
              onPress={() => handlePayOrder(item.id)}
              style={styles.payButton}
            >
              Отметить оплаченным
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={filterType}
          onValueChange={setFilterType}
          buttons={[
            {
              value: 'unpaid',
              label: 'Неоплаченные',
            },
            {
              value: 'paid',
              label: 'Оплаченные',
            },
            {
              value: 'all',
              label: 'Все',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      <FlatList
        data={displayedOrders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <Paragraph style={styles.empty}>
            {filterType === 'unpaid' && 'Нет неоплаченных заказов'}
            {filterType === 'paid' && 'Нет оплаченных заказов'}
            {filterType === 'all' && 'Нет доставленных заказов'}
          </Paragraph>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    padding: SPACING.MD,
    paddingBottom: SPACING.SM,
  },
  segmentedButtons: {
    marginBottom: SPACING.SM,
  },
  list: {
    padding: SPACING.MD,
    paddingTop: 0,
  },
  card: {
    marginBottom: SPACING.MD,
    borderRadius: 12,
  },
  paidCard: {
    backgroundColor: '#E8F5E9', // Светло-зелёный фон для оплаченных заказов
    borderWidth: 2,
    borderColor: COLORS.SUCCESS,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    ...TYPOGRAPHY.H4,
  },
  amount: {
    ...TYPOGRAPHY.H4,
    color: COLORS.PRIMARY,
  },
  paidAmount: {
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
  },
  paidChip: {
    backgroundColor: COLORS.SUCCESS,
    height: 24,
  },
  paidChipMargin: {
    marginLeft: SPACING.SM,
  },
  paidChipText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  sub: {
    color: COLORS.GRAY,
    marginBottom: SPACING.SM,
  },
  payButton: {
    marginTop: SPACING.SM,
  },
  empty: {
    textAlign: 'center',
    color: COLORS.GRAY,
    marginTop: SPACING.XL,
  },
});

export default UnpaidOrdersScreen;


