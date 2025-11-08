import React, { useMemo, useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Card, Title, Paragraph, Button, Checkbox, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { ordersAPI } from '../../services/api';
import { fetchActiveOrders } from '../../store/slices/ordersSlice';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

const CookOrderDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { order } = route.params || {};

  const [items, setItems] = useState(order?.orderItems || []);
  const [isLoading, setIsLoading] = useState(false);
  
  const readyCount = useMemo(() => items.filter(i => i.is_ready).length, [items]);
  const allReady = useMemo(() => items.length > 0 && items.every(i => i.is_ready), [items]);
  const progress = items.length > 0 ? (readyCount / items.length) * 100 : 0;

  useEffect(() => {
    // Обновляем заголовок экрана
    navigation.setOptions({
      title: `Заказ #${order?.id}`,
    });
  }, [navigation, order]);

  // Обновляем список заказов при возврате на экран списка
  // WebSocket события также обновят список автоматически, но обновление здесь гарантирует
  // что список будет актуальным даже если WebSocket событие не пришло
  useFocusEffect(
    React.useCallback(() => {
      // При возврате на предыдущий экран (когда этот экран теряет фокус)
      // обновляем список заказов, чтобы заказ со статусом 'ready' сразу исчез
      return () => {
        // Обновление происходит при потере фокуса (возврате на предыдущий экран)
        dispatch(fetchActiveOrders());
      };
    }, [dispatch])
  );

  const toggleReady = async (itemId) => {
    try {
      setIsLoading(true);
      const response = await ordersAPI.toggleOrderItemReady(itemId);
      setItems(prev => prev.map(it => it.id === itemId ? { ...it, is_ready: !it.is_ready } : it));
      
      // Если все позиции готовы, заказ автоматически переходит в статус ready на backend
      if (response.data?.orderReady) {
        showSuccessToast('Все позиции готовы! Заказ готов к выдаче.');
        // Обновляем список заказов перед возвратом, чтобы заказ исчез
        dispatch(fetchActiveOrders());
        // Возвращаемся на предыдущий экран через небольшую задержку
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showSuccessToast('Статус позиции обновлен');
      }
    } catch (e) {
      showErrorToast('Не удалось обновить позицию');
    } finally {
      setIsLoading(false);
    }
  };

  const markAllReady = async () => {
    try {
      setIsLoading(true);
      await ordersAPI.markOrderReadyAll(order.id);
      setItems(prev => prev.map(it => ({ ...it, is_ready: true })));
      showSuccessToast('Заказ отмечен как готовый');
      // Обновляем список заказов перед возвратом, чтобы заказ исчез
      dispatch(fetchActiveOrders());
      navigation.goBack();
    } catch (e) {
      showErrorToast('Не удалось отметить все позиции');
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => !isLoading && toggleReady(item.id)}
      disabled={isLoading}
    >
      <Card 
        style={[
          styles.itemCard,
          item.is_ready && styles.itemCardReady
        ]}
      >
        <Card.Content style={styles.itemContent}>
          <View style={styles.itemLeft}>
            <Checkbox
              status={item.is_ready ? 'checked' : 'unchecked'}
              onPress={() => !isLoading && toggleReady(item.id)}
              disabled={isLoading}
            />
            <View style={styles.itemInfo}>
              <Paragraph style={styles.itemName}>
                {item.quantity}x {item.menuItem?.name || 'Неизвестное блюдо'}
              </Paragraph>
              {item.notes && (
                <Paragraph style={styles.itemNotes}>
                  {item.notes}
                </Paragraph>
              )}
            </View>
          </View>
          {item.is_ready && (
            <Chip 
              icon="check-circle" 
              style={styles.readyChip}
              textStyle={styles.readyChipText}
            >
              Готово
            </Chip>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.LIGHT, COLORS.WHITE]}
        style={styles.gradient}
      >
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.header}>
              <View style={styles.headerInfo}>
                <Title style={styles.title}>Заказ #{order?.id}</Title>
                <Paragraph style={styles.subtitle}>
                  Столик №{order?.table_number}
                </Paragraph>
              </View>
              <View style={styles.progressContainer}>
                <Paragraph style={styles.progressText}>
                  {readyCount}/{items.length} готово
                </Paragraph>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Paragraph style={styles.emptyText}>Нет позиций в заказе</Paragraph>
              </Card.Content>
            </Card>
          }
        />

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={markAllReady}
            disabled={allReady || isLoading}
            loading={isLoading}
            style={styles.markAllButton}
            icon="check-circle"
          >
            Всё готово
          </Button>
        </View>
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
  headerCard: {
    margin: SPACING.MD,
    marginBottom: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.H3,
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  subtitle: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
  },
  progressContainer: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  progressText: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.DARK_GRAY,
    marginBottom: SPACING.XS,
  },
  progressBar: {
    width: 80,
    height: 8,
    backgroundColor: COLORS.LIGHT_GRAY,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.SUCCESS,
  },
  list: {
    padding: SPACING.MD,
    paddingBottom: 100,
  },
  itemCard: {
    marginBottom: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    elevation: 1,
    backgroundColor: COLORS.WHITE,
  },
  itemCardReady: {
    backgroundColor: COLORS.LIGHT,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.SUCCESS,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemInfo: {
    marginLeft: SPACING.SM,
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  itemNotes: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.DARK_GRAY,
    fontStyle: 'italic',
  },
  readyChip: {
    backgroundColor: COLORS.SUCCESS,
    marginLeft: SPACING.SM,
  },
  readyChipText: {
    color: COLORS.WHITE,
    fontSize: 12,
  },
  emptyCard: {
    marginTop: SPACING.XL,
    borderRadius: BORDER_RADIUS.MD,
  },
  emptyText: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
    textAlign: 'center',
    paddingVertical: SPACING.MD,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.MD,
    paddingBottom: SPACING.LG,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.LIGHT_GRAY,
    elevation: 8,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  markAllButton: {
    borderRadius: BORDER_RADIUS.MD,
  },
});

export default CookOrderDetailsScreen;


