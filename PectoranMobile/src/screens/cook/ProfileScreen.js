/**
 * Экран профиля повара
 * Отображение информации о пользователе и кнопка выхода
 */

import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Title, 
  Paragraph, 
  Avatar, 
  Button, 
  IconButton,
  Divider,
  Card,
  Text
} from 'react-native-paper';
import { logout } from '../../store/slices/authSlice';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти из приложения?',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Кнопка выхода в правом верхнем углу */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Title style={styles.headerTitle}>Профиль</Title>
        <IconButton
          icon="logout"
          size={24}
          iconColor={COLORS.ERROR}
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </View>

      <View style={styles.content}>
        {/* Аватар */}
        <Avatar.Icon 
          size={120} 
          icon="chef-hat" 
          style={[styles.avatar, { backgroundColor: COLORS.PRIMARY }]} 
        />

        {/* Информация о пользователе */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.userName}>
              {user?.full_name || 'Повар'}
            </Title>
            <Paragraph style={styles.userRole}>
              Повар
            </Paragraph>
            
            {user?.waiter_number && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Номер:</Text>
                  <Text style={styles.infoValue}>{user.waiter_number}</Text>
                </View>
              </>
            )}

            {user?.phone && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Телефон:</Text>
                  <Text style={styles.infoValue}>{user.phone}</Text>
                </View>
              </>
            )}

            {user?.email && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Кнопка выхода внизу */}
        <Button
          mode="contained"
          onPress={handleLogout}
          icon="logout"
          buttonColor={COLORS.ERROR}
          textColor={COLORS.WHITE}
          style={styles.logoutButtonLarge}
          contentStyle={styles.logoutButtonContent}
        >
          Выйти из аккаунта
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.LIGHT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY,
  },
  headerSpacer: {
    width: 48,
  },
  headerTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.DARK,
    flex: 1,
    textAlign: 'center',
  },
  logoutButton: {
    margin: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.LG,
    paddingTop: SPACING.XL,
  },
  avatar: {
    marginBottom: SPACING.LG,
  },
  infoCard: {
    width: '100%',
    marginBottom: SPACING.XL,
    borderRadius: 12,
    elevation: 2,
  },
  userName: {
    ...TYPOGRAPHY.H2,
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
    textAlign: 'center',
  },
  userRole: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },
  divider: {
    marginVertical: SPACING.MD,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.XS,
  },
  infoLabel: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
    fontWeight: '600',
  },
  infoValue: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK,
  },
  logoutButtonLarge: {
    width: '100%',
    marginTop: 'auto',
    marginBottom: SPACING.LG,
    borderRadius: 8,
  },
  logoutButtonContent: {
    paddingVertical: SPACING.SM,
  },
});

export default ProfileScreen;


