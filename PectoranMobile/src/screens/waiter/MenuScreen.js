/**
 * Экран меню для официанта
 * Отображение меню по категориям и создание заказа
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Badge,
  Chip,
  FAB,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';

import { fetchMenu } from '../../store/slices/menuSlice';
import { addToCart, removeFromCart, clearCart, createOrder, updateCartItemQuantity } from '../../store/slices/ordersSlice';
import { selectMenu, selectMenuLoading } from '../../store/slices/menuSlice';
import { selectCartItems, selectCartTotal } from '../../store/slices/ordersSlice';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

const MenuScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Получаем tableNumber из параметров навигации
  const tableNumber = route.params?.tableNumber;
  
  const menu = useSelector(selectMenu);
  const isLoading = useSelector(selectMenuLoading);
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchMenu());
  }, [dispatch]);

  // Фильтрация меню по категории и поиску
  const filteredMenu = menu.filter(category => {
    if (selectedCategory && category.id !== selectedCategory.id) {
      return false;
    }
    
    if (searchQuery) {
      const hasMatchingItems = category.items.some(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return hasMatchingItems;
    }
    
    return true;
  });

  const handleAddToCart = (item) => {
    dispatch(addToCart({
      menuItem: item,
      quantity: 1,
    }));
    showSuccessToast(`${item.name} добавлен в заказ`);
  };

  const handleRemoveFromCart = (itemId) => {
    dispatch(removeFromCart(itemId));
  };

  const handleUpdateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(itemId);
    } else {
      dispatch(updateCartItemQuantity({ itemId, quantity }));
    }
  };

  const handleCreateOrder = async () => {
    if (!tableNumber) {
      showErrorToast('Не указан номер столика');
      navigation.goBack();
      return;
    }

    if (cartItems.length === 0) {
      showErrorToast('Добавьте позиции в заказ');
      return;
    }

    const orderData = {
      table_number: tableNumber,
      items: cartItems.map(item => ({
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        notes: item.notes || '',
      })),
      notes: '',
      customer_name: '',
      customer_phone: '',
    };

    console.log('🛒 [MenuScreen] Отправляем заказ:', orderData);

    try {
      await dispatch(createOrder(orderData)).unwrap();
      showSuccessToast('Заказ успешно создан!');
      dispatch(clearCart());
      setOrderModalVisible(false);
      // Возвращаемся на экран выбора столика
      navigation.goBack();
    } catch (error) {
      showErrorToast(error || 'Ошибка создания заказа');
    }
  };

  const handleOpenOrderModal = () => {
    if (cartItems.length === 0) {
      showErrorToast('Добавьте позиции в заказ');
      return;
    }
    setOrderModalVisible(true);
  };

  const handleCloseOrderModal = () => {
    setOrderModalVisible(false);
  };

  // Подсчитываем общее количество товаров в корзине
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const renderMenuItem = ({ item }) => {
    // Проверяем, есть ли товар в корзине
    const cartItem = cartItems.find(cartItem => cartItem.menuItem.id === item.id);
    const quantity = cartItem?.quantity || 0;
    const isInCart = quantity > 0;

    return (
      <Card style={styles.menuItemCard}>
        <Card.Content>
          <View style={styles.menuItemHeader}>
            <Title style={styles.menuItemName}>{item.name}</Title>
            <Text style={styles.menuItemPrice}>{item.price} ₽</Text>
          </View>
          
          {item.description && (
            <Paragraph style={styles.menuItemDescription}>
              {item.description}
            </Paragraph>
          )}
          
          <View style={styles.menuItemFooter}>
            <View style={styles.menuItemInfo}>
              {item.preparation_time && (
                <Chip
                  icon="clock"
                  style={styles.timeChip}
                  textStyle={styles.timeChipText}
                >
                  {item.preparation_time} мин
                </Chip>
              )}
              
              {item.calories && (
                <Chip
                  icon="fire"
                  style={styles.caloriesChip}
                  textStyle={styles.caloriesChipText}
                >
                  {item.calories} ккал
                </Chip>
              )}
            </View>
            
            {isInCart ? (
              <View style={styles.quantityControls}>
                <Button
                  mode="outlined"
                  onPress={() => handleUpdateQuantity(item.id, quantity - 1)}
                  style={styles.quantityButtonSmall}
                  compact
                >
                  -
                </Button>
                <Text style={styles.quantityTextSmall}>{quantity}</Text>
                <Button
                  mode="outlined"
                  onPress={() => handleUpdateQuantity(item.id, quantity + 1)}
                  style={styles.quantityButtonSmall}
                  compact
                >
                  +
                </Button>
              </View>
            ) : (
              <Button
                mode="contained"
                onPress={() => handleAddToCart(item)}
                style={styles.addButton}
                compact
              >
                Добавить
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderCategory = ({ item: category }) => (
    <View style={styles.categorySection}>
      <Title style={styles.categoryTitle}>{category.name}</Title>
      <FlatList
        data={category.items}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );

  const renderCategoriesHeader = () => (
    <View style={styles.categoriesHeaderContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        <TouchableOpacity
          style={[
            styles.categoryButton,
            !selectedCategory && styles.categoryButtonSelected
          ]}
          onPress={() => setSelectedCategory(null)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.categoryButtonText,
              !selectedCategory && styles.categoryButtonTextSelected
            ]}
          >
            Все
          </Text>
        </TouchableOpacity>
        {menu.map((category) => {
          const isSelected = selectedCategory?.id === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                isSelected && styles.categoryButtonSelected
              ]}
              onPress={() => setSelectedCategory(isSelected ? null : category)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  isSelected && styles.categoryButtonTextSelected
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.LIGHT, COLORS.WHITE]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Title style={styles.title}>
            {tableNumber ? `Столик №${tableNumber}` : 'Меню'}
          </Title>
          {!tableNumber && (
            <Paragraph style={styles.errorText}>
              Ошибка: номер столика не указан
            </Paragraph>
          )}
          <TextInput
            label="Поиск в меню"
            value={searchQuery}
            onChangeText={setSearchQuery}
            mode="outlined"
            style={styles.searchInput}
            left={<TextInput.Icon icon="magnify" />}
          />
        </View>

        <View style={styles.content}>
          <FlatList
            data={filteredMenu}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuList}
            ListHeaderComponent={renderCategoriesHeader}
          />
        </View>

        {/* Плавающая кнопка создания заказа */}
        <View style={styles.fabContainer}>
          <FAB
            style={styles.fab}
            icon="cart"
            onPress={handleOpenOrderModal}
            disabled={cartItems.length === 0}
          />
          {totalItemsCount > 0 && (
            <Badge style={styles.fabBadge} size={24}>
              {totalItemsCount}
            </Badge>
          )}
        </View>

        {/* Модальное окно для создания заказа */}
        <Modal
          visible={orderModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseOrderModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Title style={styles.modalTitle}>Создание заказа</Title>
                <Button
                  mode="text"
                  onPress={handleCloseOrderModal}
                  icon="close"
                >
                  Закрыть
                </Button>
              </View>

              <ScrollView style={styles.modalScrollView}>
                {/* Список товаров */}
                <View style={styles.orderItemsContainer}>
                  <Title style={styles.orderItemsTitle}>Товары в заказе</Title>
                  {cartItems.map((item) => (
                    <View key={item.menuItem.id} style={styles.orderItem}>
                      <View style={styles.orderItemInfo}>
                        <Text style={styles.orderItemName}>
                          {item.menuItem.name}
                        </Text>
                        <Text style={styles.orderItemDetails}>
                          {item.menuItem.price} ₽ × {item.quantity} = {item.menuItem.price * item.quantity} ₽
                        </Text>
                      </View>
                    </View>
                  ))}
                  <View style={styles.orderTotalContainer}>
                    <Text style={styles.orderTotal}>
                      Итого: {cartTotal} ₽
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Кнопка создания заказа */}
              <View style={styles.modalFooter}>
                <Button
                  mode="contained"
                  onPress={handleCreateOrder}
                  style={styles.createOrderButton}
                  contentStyle={styles.createOrderButtonContent}
                >
                  Создать заказ
                </Button>
              </View>
            </View>
          </View>
        </Modal>
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
  title: {
    ...TYPOGRAPHY.H2,
    color: COLORS.DARK,
    marginBottom: SPACING.SM,
  },
  errorText: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.ERROR,
    marginBottom: SPACING.MD,
  },
  searchInput: {
    marginBottom: SPACING.SM,
  },
  categoriesHeaderContainer: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: SPACING.SM,
    marginBottom: SPACING.SM,
    ...SHADOWS.SM,
  },
  categoriesContainer: {
    paddingHorizontal: SPACING.MD,
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS + 2,
    marginRight: SPACING.SM,
    borderRadius: BORDER_RADIUS.ROUND,
    backgroundColor: COLORS.LIGHT,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.SM,
  },
  categoryButtonSelected: {
    backgroundColor: COLORS.PRIMARY,
    ...SHADOWS.MD,
  },
  categoryButtonText: {
    ...TYPOGRAPHY.CAPTION,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.DARK,
  },
  categoryButtonTextSelected: {
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  menuList: {
    padding: SPACING.MD,
  },
  categorySection: {
    marginBottom: SPACING.LG,
  },
  categoryTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.DARK,
    marginBottom: SPACING.MD,
  },
  menuItemCard: {
    marginBottom: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  menuItemName: {
    ...TYPOGRAPHY.H4,
    color: COLORS.DARK,
    flex: 1,
    marginRight: SPACING.SM,
  },
  menuItemPrice: {
    ...TYPOGRAPHY.H4,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  menuItemDescription: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
    marginBottom: SPACING.SM,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  timeChip: {
    marginRight: SPACING.SM,
  },
  timeChipText: {
    fontSize: 12,
  },
  caloriesChip: {
    marginRight: SPACING.SM,
  },
  caloriesChipText: {
    fontSize: 12,
  },
  addButton: {
    borderRadius: BORDER_RADIUS.SM,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonSmall: {
    minWidth: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.SM,
  },
  quantityTextSmall: {
    ...TYPOGRAPHY.BODY,
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: SPACING.MD,
    minWidth: 24,
    textAlign: 'center',
    color: COLORS.DARK,
  },
  fabContainer: {
    position: 'absolute',
    right: SPACING.MD,
    bottom: SPACING.MD,
  },
  fab: {
    backgroundColor: COLORS.PRIMARY,
  },
  fabBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.ERROR,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: BORDER_RADIUS.XL,
    borderTopRightRadius: BORDER_RADIUS.XL,
    maxHeight: '90%',
    paddingBottom: SPACING.MD,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY,
  },
  modalTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.DARK,
  },
  modalScrollView: {
    maxHeight: 400,
    padding: SPACING.MD,
  },
  orderItemsContainer: {
    marginBottom: SPACING.MD,
    paddingBottom: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY,
  },
  orderItemsTitle: {
    ...TYPOGRAPHY.H4,
    color: COLORS.DARK,
    marginBottom: SPACING.SM,
  },
  orderItem: {
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK,
    fontWeight: '500',
    marginBottom: SPACING.XS,
  },
  orderItemDetails: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.DARK_GRAY,
  },
  orderTotalContainer: {
    marginTop: SPACING.MD,
    paddingTop: SPACING.MD,
    borderTopWidth: 2,
    borderTopColor: COLORS.PRIMARY,
  },
  orderTotal: {
    ...TYPOGRAPHY.H3,
    color: COLORS.DARK,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  modalFooter: {
    padding: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.LIGHT_GRAY,
  },
  createOrderButton: {
    borderRadius: BORDER_RADIUS.MD,
  },
  createOrderButtonContent: {
    paddingVertical: SPACING.SM,
  },
});

export default MenuScreen;
