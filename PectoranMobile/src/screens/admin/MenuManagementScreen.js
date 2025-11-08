/**
 * Экран управления меню для администратора/директора
 * Просмотр, добавление, редактирование меню
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FAB, Card, Title, Paragraph, List, Button, TextInput, Portal, Modal, 
  Chip, IconButton, Divider, Switch, SegmentedButtons 
} from 'react-native-paper';
import { fetchMenu } from '../../store/slices/menuSlice';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

const MenuManagementScreen = () => {
  const dispatch = useDispatch();
  const menu = useSelector((state) => state.menu?.menu || []);
  const isLoading = useSelector((state) => state.menu?.isLoading);

  const [fabOpen, setFabOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('categories'); // 'categories' | 'items'
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    console.log('🔄 [MenuManagementScreen] Загружаем меню...');
    dispatch(fetchMenu());
  }, [dispatch]);

  useEffect(() => {
    console.log('📊 [MenuManagementScreen] Menu data:', menu);
    console.log('📊 [MenuManagementScreen] Menu length:', menu?.length);
    console.log('📊 [MenuManagementScreen] Is loading:', isLoading);
  }, [menu, isLoading]);

  const handleRefresh = () => {
    dispatch(fetchMenu());
  };

  const handleAddCategory = () => {
    setEditingItem(null);
    setViewMode('categories');
    setModalVisible(true);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setViewMode('items');
    setModalVisible(true);
  };

  const handleEditCategory = (category) => {
    setEditingItem(category);
    setViewMode('categories');
    setModalVisible(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setViewMode('items');
    setModalVisible(true);
  };

  const handleDeleteCategory = (category) => {
    Alert.alert(
      'Удаление категории',
      `Вы уверены, что хотите удалить категорию "${category.name}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            // TODO: Реализовать удаление категории
            showErrorToast('Функция удаления будет реализована позже');
          }
        }
      ]
    );
  };

  const handleDeleteItem = (item) => {
    Alert.alert(
      'Удаление позиции',
      `Вы уверены, что хотите удалить "${item.name}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            // TODO: Реализовать удаление позиции
            showErrorToast('Функция удаления будет реализована позже');
          }
        }
      ]
    );
  };

  const renderCategory = (category) => (
    <Card key={category.id} style={styles.categoryCard}>
      <Card.Content>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryInfo}>
            <Title style={styles.categoryName}>{category.name}</Title>
            {category.description && (
              <Paragraph style={styles.categoryDescription}>
                {category.description}
              </Paragraph>
            )}
          </View>
          <View style={styles.categoryActions}>
            <Chip 
              style={styles.statusChip}
              textStyle={styles.statusText}
            >
              {category.is_active ? 'Активна' : 'Неактивна'}
            </Chip>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleEditCategory(category)}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteCategory(category)}
            />
          </View>
        </View>
        
        <View style={styles.itemsCount}>
          <Paragraph style={styles.itemsCountText}>
            Позиций: {category.items?.length || 0}
          </Paragraph>
        </View>
      </Card.Content>
    </Card>
  );

  const renderMenuItem = (item) => (
    <Card key={item.id} style={styles.itemCard}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Title style={styles.itemName}>{item.name}</Title>
            <Paragraph style={styles.itemDescription}>
              {item.description}
            </Paragraph>
            <View style={styles.itemDetails}>
              <Paragraph style={styles.itemPrice}>{item.price} ₽</Paragraph>
              <Paragraph style={styles.itemTime}>
                {item.preparation_time} мин
              </Paragraph>
            </View>
            <View style={styles.itemTags}>
              {item.is_vegetarian && (
                <Chip style={styles.tagChip} textStyle={styles.tagText}>
                  Вегетарианское
                </Chip>
              )}
              {item.is_spicy && (
                <Chip style={styles.tagChip} textStyle={styles.tagText}>
                  Острое
                </Chip>
              )}
            </View>
          </View>
          <View style={styles.itemActions}>
            <Chip 
              style={[
                styles.statusChip,
                { backgroundColor: item.is_available ? COLORS.SUCCESS : COLORS.ERROR }
              ]}
              textStyle={styles.statusText}
            >
              {item.is_available ? 'Доступно' : 'Недоступно'}
            </Chip>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleEditItem(item)}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteItem(item)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderModal = () => (
    <Portal>
      <Modal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        contentContainerStyle={styles.modal}
      >
        <ScrollView>
          <Title style={styles.modalTitle}>
            {editingItem ? 'Редактировать' : 'Добавить'} 
            {viewMode === 'categories' ? ' категорию' : ' позицию'}
          </Title>
          
          <TextInput
            label="Название"
            value={editingItem?.name || ''}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Описание"
            value={editingItem?.description || ''}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          
          {viewMode === 'items' && (
            <>
              <TextInput
                label="Цена (₽)"
                value={editingItem?.price?.toString() || ''}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />
              
              <TextInput
                label="Время приготовления (мин)"
                value={editingItem?.preparation_time?.toString() || ''}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />
              
              <View style={styles.switchRow}>
                <Paragraph>Вегетарианское</Paragraph>
                <Switch value={editingItem?.is_vegetarian || false} />
              </View>
              
              <View style={styles.switchRow}>
                <Paragraph>Острое</Paragraph>
                <Switch value={editingItem?.is_spicy || false} />
              </View>
            </>
          )}
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              Отмена
            </Button>
            <Button 
              mode="contained" 
              onPress={() => {
                showErrorToast('Функция сохранения будет реализована позже');
                setModalVisible(false);
              }}
              style={styles.modalButton}
            >
              Сохранить
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={setViewMode}
          buttons={[
            { value: 'categories', label: 'Категории' },
            { value: 'items', label: 'Позиции' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {viewMode === 'categories' ? (
          <View>
            {menu.map(renderCategory)}
          </View>
        ) : (
          <View>
            {selectedCategory ? (
              <View>
                <View style={styles.categoryHeader}>
                  <Title>{selectedCategory.name}</Title>
                  <Button onPress={() => setSelectedCategory(null)}>
                    Все позиции
                  </Button>
                </View>
                {selectedCategory.items?.map(renderMenuItem)}
              </View>
            ) : (
              <View>
                {menu.map(category => (
                  <View key={category.id}>
                    <View style={styles.categorySection}>
                      <Title style={styles.categoryTitle}>{category.name}</Title>
                      <Button onPress={() => setSelectedCategory(category)}>
                        Показать все
                      </Button>
                    </View>
                    {category.items?.slice(0, 3).map(renderMenuItem)}
                    {category.items?.length > 3 && (
                      <Button onPress={() => setSelectedCategory(category)}>
                        Показать еще {category.items.length - 3}
                      </Button>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <FAB.Group
        open={fabOpen}
        visible={true}
        icon={fabOpen ? 'close' : 'plus'}
        actions={[
          {
            icon: 'folder-plus',
            label: 'Добавить категорию',
            onPress: handleAddCategory,
          },
          {
            icon: 'food',
            label: 'Добавить позицию',
            onPress: handleAddItem,
          },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
        style={styles.fab}
      />

      {renderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.LIGHT,
  },
  header: {
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    elevation: 2,
  },
  segmentedButtons: {
    marginBottom: SPACING.SM,
  },
  content: {
    flex: 1,
    padding: SPACING.MD,
  },
  categoryCard: {
    marginBottom: SPACING.MD,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...TYPOGRAPHY.H4,
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  categoryDescription: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
    marginBottom: SPACING.SM,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    marginRight: SPACING.XS,
  },
  statusText: {
    fontSize: 12,
  },
  itemsCount: {
    marginTop: SPACING.SM,
  },
  itemsCountText: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.GRAY,
  },
  itemCard: {
    marginBottom: SPACING.SM,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.H5,
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  itemDescription: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
    marginBottom: SPACING.SM,
  },
  itemDetails: {
    flexDirection: 'row',
    marginBottom: SPACING.SM,
  },
  itemPrice: {
    ...TYPOGRAPHY.BODY,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginRight: SPACING.MD,
  },
  itemTime: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.GRAY,
  },
  itemTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    marginRight: SPACING.XS,
    marginBottom: SPACING.XS,
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  tagText: {
    fontSize: 10,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categorySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
    marginTop: SPACING.LG,
  },
  categoryTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.DARK,
  },
  fab: {
    position: 'absolute',
    margin: SPACING.MD,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: 'white',
    padding: SPACING.LG,
    margin: SPACING.LG,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    ...TYPOGRAPHY.H3,
    marginBottom: SPACING.LG,
    textAlign: 'center',
  },
  input: {
    marginBottom: SPACING.MD,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.LG,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
});

export default MenuManagementScreen;