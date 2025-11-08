/**
 * Экран статистики для администратора
 * Отображение ключевых метрик ресторана
 */

import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Title, Paragraph, List } from 'react-native-paper';
import { fetchDailyStats } from '../../store/slices/statsSlice';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

const StatsScreen = () => {
  const dispatch = useDispatch();
  const { dailyStats, isLoading, error } = useSelector((state) => state.stats);

  useEffect(() => {
    dispatch(fetchDailyStats());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchDailyStats());
  };
  
  // Логируем данные для отладки
  useEffect(() => {
    console.log('Daily Stats in component:', dailyStats);
    console.log('Is Loading:', isLoading);
    console.log('Error:', error);
  }, [dailyStats, isLoading, error]);

  // Отображаем ошибку, если есть
  if (error && !isLoading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Ошибка загрузки</Title>
            <Paragraph style={styles.errorText}>{error}</Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
      }
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Статистика за сегодня</Title>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Paragraph style={styles.statLabel}>Всего заказов</Paragraph>
              <Title style={styles.statValue}>
                {dailyStats?.totalOrders ?? dailyStats?.orders?.total ?? 0}
              </Title>
            </View>
            
            <View style={styles.statItem}>
              <Paragraph style={styles.statLabel}>Выручка</Paragraph>
              <Title style={styles.statValue}>
                {dailyStats?.totalRevenue ?? dailyStats?.orders?.total_revenue ?? 0} ₽
              </Title>
            </View>
            
            <View style={styles.statItem}>
              <Paragraph style={styles.statLabel}>Активные заказы</Paragraph>
              <Title style={styles.statValue}>
                {dailyStats?.activeOrders ?? 0}
              </Title>
            </View>
            
            <View style={styles.statItem}>
              <Paragraph style={styles.statLabel}>Средний чек</Paragraph>
              <Title style={styles.statValue}>
                {dailyStats?.averageCheck ?? dailyStats?.orders?.average_order_value ?? 0} ₽
              </Title>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Популярные блюда</Title>
          <List.Section>
            {dailyStats?.popularItems && dailyStats.popularItems.length > 0 ? (
              dailyStats.popularItems.map((item, index) => (
                <List.Item
                  key={item.id || index}
                  title={item.name || 'Неизвестное блюдо'}
                  description={`Заказано: ${item.orderCount || 0} раз`}
                  left={() => <List.Icon icon="star" color={COLORS.SECONDARY} />}
                  right={() => <Paragraph>{(item.totalRevenue || 0).toFixed(2)} ₽</Paragraph>}
                />
              ))
            ) : (
              <Paragraph style={styles.noData}>Нет данных</Paragraph>
            )}
          </List.Section>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.LIGHT,
  },
  content: {
    padding: SPACING.MD,
  },
  card: {
    marginBottom: SPACING.MD,
    borderRadius: 12,
  },
  cardTitle: {
    ...TYPOGRAPHY.H3,
    marginBottom: SPACING.MD,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    padding: SPACING.MD,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    marginBottom: SPACING.SM,
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.WHITE,
    fontSize: 12,
    marginBottom: SPACING.XS,
  },
  statValue: {
    ...TYPOGRAPHY.H2,
    color: COLORS.WHITE,
  },
  noData: {
    textAlign: 'center',
    color: COLORS.GRAY,
    marginTop: SPACING.MD,
  },
  errorText: {
    color: COLORS.ERROR || '#f44336',
    marginTop: SPACING.SM,
    textAlign: 'center',
  },
});

export default StatsScreen;

