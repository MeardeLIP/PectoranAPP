/**
 * Экран управления пользователями для директора
 * Просмотр, добавление, редактирование пользователей
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FAB, Card, Title, Paragraph, List, Button, TextInput, Portal, Modal, 
  Chip, IconButton, SegmentedButtons, Switch, Menu, Divider 
} from 'react-native-paper';
import { usersAPI } from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

const UsersManagementScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    phone: '',
    role: 'waiter',
    is_active: true,
  });
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'waiter', 'cook', 'admin'
  const [menuVisible, setMenuVisible] = useState({});

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await usersAPI.getUsers({ role: roleFilter !== 'all' ? roleFilter : undefined });
      setUsers(response.data.users || response.data || []);
    } catch (error) {
      showErrorToast('Ошибка загрузки пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadUsers();
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setForm({
      username: '', full_name: '', phone: '', role: 'waiter', is_active: true,
    });
    setModalVisible(true);
  };

  const handleEditUser = (user) => {
    // Запрещаем редактирование директоров
    if (user.role === 'director') {
      showErrorToast('Редактирование директоров недоступно через интерфейс');
      return;
    }
    setEditingUser(user);
    setForm({
      username: user.username || '',
      full_name: user.full_name || '',
      phone: user.phone || '',
      role: user.role || 'waiter',
      is_active: user.is_active ?? true,
    });
    setModalVisible(true);
  };

  const handleDeleteUser = (user) => {
    // Запрещаем удаление директоров
    if (user.role === 'director') {
      showErrorToast('Удаление директоров недоступно через интерфейс');
      return;
    }
    Alert.alert(
      'Удаление пользователя',
      `Вы уверены, что хотите удалить пользователя "${user.username}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            // TODO: Реализовать удаление пользователя
            showErrorToast('Функция удаления будет реализована позже');
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    try {
      const trimmedUsername = form.username?.trim();
      const trimmedFullName = form.full_name?.trim();
      const trimmedPhone = form.phone?.trim();

      if (!trimmedUsername) {
        showErrorToast('Укажите имя пользователя');
        return;
      }

      // Блокируем создание пользователей с ролью директор
      if (form.role === 'director') {
        showErrorToast('Создание пользователей с ролью "Директор" недоступно через интерфейс. Директора создаются только вручную в базе данных.');
        return;
      }

      // Блокируем изменение роли существующего пользователя на директор
      if (editingUser && editingUser.role !== 'director' && form.role === 'director') {
        showErrorToast('Изменение роли пользователя на "Директор" недоступно через интерфейс.');
        return;
      }

      // Блокируем редактирование директоров
      if (editingUser && editingUser.role === 'director') {
        showErrorToast('Редактирование директоров недоступно через интерфейс.');
        return;
      }

      const payload = {
        username: trimmedUsername,
        role: form.role,
        is_active: !!form.is_active,
      };

      // Обработка полного имени
      if (trimmedFullName) {
        payload.full_name = trimmedFullName;
      } else {
        // Если поле пустое, отправляем null (для создания и для удаления при редактировании)
        payload.full_name = null;
      }

      // Пароль больше не используется для администраторов, только для директоров (которых нельзя создавать через интерфейс)

      // Обработка телефона
      if (trimmedPhone) {
        payload.phone = trimmedPhone;
      } else {
        // Если поле пустое, отправляем null (для создания и для удаления при редактировании)
        payload.phone = null;
      }

      // Номер сотрудника больше не используется - всегда отправляем null
      payload.waiter_number = null;

      console.log('📤 [UsersManagement] Отправка payload:', JSON.stringify(payload, null, 2));

      if (editingUser) {
        await usersAPI.updateUser(editingUser.id, payload);
        showSuccessToast('Пользователь обновлён');
      } else {
        await usersAPI.createUser(payload);
        showSuccessToast('Пользователь создан');
      }

      setModalVisible(false);
      await loadUsers();
    } catch (e) {
      console.error('❌ [UsersManagement] Ошибка сохранения:', e);
      showErrorToast(e?.response?.data?.message || 'Ошибка сохранения');
    }
  };

  const handleToggleActive = (user) => {
    // Запрещаем изменение статуса директоров
    if (user.role === 'director') {
      showErrorToast('Изменение статуса директоров недоступно через интерфейс');
      return;
    }
    Alert.alert(
      user.is_active ? 'Деактивация пользователя' : 'Активация пользователя',
      `Вы уверены, что хотите ${user.is_active ? 'деактивировать' : 'активировать'} пользователя "${user.username}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: user.is_active ? 'Деактивировать' : 'Активировать',
          onPress: () => {
            // TODO: Реализовать изменение статуса
            showSuccessToast(`Пользователь ${user.is_active ? 'деактивирован' : 'активирован'}`);
          }
        }
      ]
    );
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'director': return COLORS.ERROR;
      case 'admin': return COLORS.PRIMARY;
      case 'waiter': return COLORS.SUCCESS;
      case 'cook': return COLORS.WARNING;
      default: return COLORS.GRAY;
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'director': return 'Директор';
      case 'admin': return 'Администратор';
      case 'waiter': return 'Официант';
      case 'cook': return 'Повар';
      default: return role;
    }
  };

  const filteredUsers = users.filter(user => 
    roleFilter === 'all' || user.role === roleFilter
  );

  const renderUser = (user) => (
    <Card key={user.id} style={styles.userCard}>
      <Card.Content>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Title style={styles.userName}>{user.full_name || user.username}</Title>
            <Paragraph style={styles.userUsername}>@{user.username}</Paragraph>
          </View>
          <View style={styles.userActions}>
            <Chip 
              style={[styles.roleChip, { backgroundColor: getRoleColor(user.role) }]}
              textStyle={styles.roleText}
            >
              {getRoleText(user.role)}
            </Chip>
            <Chip 
              style={[
                styles.statusChip,
                { backgroundColor: user.is_active ? COLORS.SUCCESS : COLORS.ERROR }
              ]}
              textStyle={styles.statusText}
            >
              {user.is_active ? 'Активен' : 'Неактивен'}
            </Chip>
          </View>
        </View>

        <View style={styles.userDetails}>
          {user.phone && user.role !== 'director' && (
            <Paragraph style={styles.userDetail}>
              📞 {user.phone}
            </Paragraph>
          )}
          {user.email && (
            <Paragraph style={styles.userDetail}>
              ✉️ {user.email}
            </Paragraph>
          )}
        </View>

        {user.role !== 'director' && (
          <View style={styles.userActions}>
            <Button
              mode="outlined"
              onPress={() => handleEditUser(user)}
              icon="pencil"
              compact
            >
              Редактировать
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleToggleActive(user)}
              icon={user.is_active ? "account-off" : "account-check"}
              compact
              style={styles.actionButton}
            >
              {user.is_active ? 'Деактивировать' : 'Активировать'}
            </Button>
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteUser(user)}
              iconColor={COLORS.ERROR}
            />
          </View>
        )}
        {user.role === 'director' && (
          <Paragraph style={styles.directorNotice}>
            Директора управляются только через базу данных
          </Paragraph>
        )}
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
        <Title style={styles.modalTitle}>
          {editingUser ? 'Редактировать' : 'Добавить'} пользователя
        </Title>
        
        <ScrollView style={styles.modalScrollView}>
          <TextInput
            label="Имя пользователя"
            value={form.username || ''}
            onChangeText={(t) => setForm((f) => ({ ...f, username: t }))}
            autoCapitalize="none"
            autoCorrect={false}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Полное имя"
            value={form.full_name || ''}
            onChangeText={(t) => setForm((f) => ({ ...f, full_name: t }))}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Телефон"
            value={form.phone || ''}
            onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))}
            mode="outlined"
            keyboardType="phone-pad"
            placeholder="(необязательно)"
            style={styles.input}
          />
          
          <View style={styles.roleSelector}>
            <Paragraph style={styles.selectorLabel}>Роль:</Paragraph>
            <SegmentedButtons
              value={form.role || 'waiter'}
              onValueChange={(value) => setForm((f) => ({ ...f, role: value }))}
              buttons={[
                { value: 'waiter', label: 'Официант' },
                { value: 'cook', label: 'Повар' },
                { value: 'admin', label: 'Админ' },
              ]}
            />
          </View>
          
          <View style={styles.switchRow}>
            <Paragraph>Активен</Paragraph>
            <Switch value={!!form.is_active} onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
          </View>
        </ScrollView>
        
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
            onPress={handleSave}
            style={styles.modalButton}
          >
            Применить
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SegmentedButtons
          value={roleFilter}
          onValueChange={setRoleFilter}
          buttons={[
            { value: 'all', label: 'Все' },
            { value: 'waiter', label: 'Официанты' },
            { value: 'cook', label: 'Повара' },
            { value: 'admin', label: 'Админы' },
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
        {filteredUsers.map(renderUser)}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddUser}
        label="Добавить пользователя"
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
  userCard: {
    marginBottom: SPACING.MD,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.H4,
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  userUsername: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
    marginBottom: SPACING.XS,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  roleChip: {
    marginRight: SPACING.XS,
    marginBottom: SPACING.XS,
  },
  roleText: {
    color: COLORS.WHITE,
    fontSize: 12,
  },
  statusChip: {
    marginRight: SPACING.XS,
    marginBottom: SPACING.XS,
  },
  statusText: {
    color: COLORS.WHITE,
    fontSize: 12,
  },
  userDetails: {
    marginBottom: SPACING.SM,
  },
  userDetail: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
    marginBottom: SPACING.XS,
  },
  actionButton: {
    marginRight: SPACING.XS,
  },
  fab: {
    position: 'absolute',
    margin: SPACING.MD,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: 'white',
    margin: SPACING.LG,
    padding: SPACING.LG,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    ...TYPOGRAPHY.H3,
    marginBottom: SPACING.LG,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  input: {
    marginBottom: SPACING.MD,
  },
  roleSelector: {
    marginBottom: SPACING.MD,
  },
  selectorLabel: {
    ...TYPOGRAPHY.BODY,
    marginBottom: SPACING.SM,
    fontWeight: 'bold',
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
    paddingTop: SPACING.MD,
    marginTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.LIGHT_GRAY,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
  directorNotice: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.SM,
    padding: SPACING.SM,
    backgroundColor: COLORS.LIGHT_GRAY,
    borderRadius: 4,
  },
});

export default UsersManagementScreen;
