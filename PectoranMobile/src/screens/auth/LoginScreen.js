/**
 * Экран входа в систему
 * Поддерживает вход для всех ролей пользователей
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button, TextInput, Card, Title, Paragraph, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'react-native-linear-gradient';

import { login, adminLogin, waiterLogin, cookLogin, clearError, resetLoading } from '../../store/slices/authSlice';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [loginMethod, setLoginMethod] = useState('waiter');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  // Очистка ошибки при изменении метода входа
  useEffect(() => {
    dispatch(clearError());
    dispatch(resetLoading());
  }, [loginMethod, dispatch]);

  // Перенаправление после успешного входа
  useEffect(() => {
    if (isAuthenticated) {
      showSuccessToast('Вход выполнен успешно');
      // Навигация будет обработана в App.js на основе роли пользователя
    }
  }, [isAuthenticated]);

  // Очистка ошибки при размонтировании
  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(resetLoading());
    };
  }, [dispatch]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogin = async () => {
    try {
      switch (loginMethod) {
        case 'admin':
          if (!formData.username) {
            showErrorToast('Введите имя пользователя');
            return;
          }
          await dispatch(adminLogin(formData.username.trim())).unwrap();
          break;

        case 'director':
          if (!formData.username) {
            showErrorToast('Введите имя пользователя');
            return;
          }
          if (!formData.password) {
            showErrorToast('Введите пароль');
            return;
          }
          await dispatch(login({
            username: formData.username.trim(),
            password: formData.password,
          })).unwrap();
          break;

        case 'waiter':
          if (!formData.username) {
            showErrorToast('Введите имя пользователя');
            return;
          }
          await dispatch(waiterLogin(formData.username.trim())).unwrap();
          break;

        case 'cook':
          if (!formData.username) {
            showErrorToast('Введите имя пользователя');
            return;
          }
          await dispatch(cookLogin(formData.username.trim())).unwrap();
          break;

        default:
          showErrorToast('Выберите метод входа');
      }
    } catch (error) {
      showErrorToast(error || 'Ошибка входа');
    }
  };

  const renderAdminForm = () => (
    <View style={styles.formContainer}>
      <TextInput
        label="Имя пользователя"
        value={formData.username}
        onChangeText={(value) => handleInputChange('username', value)}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Введите логин администратора"
      />
    </View>
  );

  const renderDirectorForm = () => (
    <View style={styles.formContainer}>
      <TextInput
        label="Имя пользователя"
        value={formData.username}
        onChangeText={(value) => handleInputChange('username', value)}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Введите логин директора"
      />
      <TextInput
        label="Пароль"
        value={formData.password}
        onChangeText={(value) => handleInputChange('password', value)}
        mode="outlined"
        secureTextEntry
        style={styles.input}
        placeholder="Введите пароль"
      />
    </View>
  );

  const renderWaiterForm = () => (
    <View style={styles.formContainer}>
      <TextInput
        label="Имя пользователя"
        value={formData.username}
        onChangeText={(value) => handleInputChange('username', value)}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Введите логин официанта"
      />
    </View>
  );

  const renderCookForm = () => (
    <View style={styles.formContainer}>
      <TextInput
        label="Имя пользователя"
        value={formData.username}
        onChangeText={(value) => handleInputChange('username', value)}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Введите логин повара"
      />
    </View>
  );

  const renderForm = () => {
    switch (loginMethod) {
      case 'admin':
        return renderAdminForm();
      case 'director':
        return renderDirectorForm();
      case 'waiter':
        return renderWaiterForm();
      case 'cook':
        return renderCookForm();
      default:
        return null;
    }
  };

  const getMethodTitle = () => {
    switch (loginMethod) {
      case 'admin':
        return 'Вход администратора';
      case 'director':
        return 'Вход директора';
      case 'waiter':
        return 'Вход официанта';
      case 'cook':
        return 'Вход повара';
      default:
        return 'Вход в систему';
    }
  };

  const getMethodDescription = () => {
    switch (loginMethod) {
      case 'admin':
        return 'Войдите с помощью логина';
      case 'director':
        return 'Войдите с помощью логина и пароля';
      case 'waiter':
        return 'Войдите с помощью логина';
      case 'cook':
        return 'Войдите с помощью логина';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Title style={styles.title}>PectoranAPP</Title>
              <Paragraph style={styles.subtitle}>
                Система управления рестораном
              </Paragraph>
            </View>

            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>{getMethodTitle()}</Title>
                <Paragraph style={styles.cardDescription}>
                  {getMethodDescription()}
                </Paragraph>

                <SegmentedButtons
                  value={loginMethod}
                  onValueChange={setLoginMethod}
                  buttons={[
                    { value: 'waiter', label: 'Официант' },
                    { value: 'cook', label: 'Повар' },
                    { value: 'admin', label: 'Администратор' },
                    { value: 'director', label: 'Директор' },
                  ]}
                  style={styles.segmentedButtons}
                />

                {renderForm()}

                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.loginButton}
                  contentStyle={styles.loginButtonContent}
                >
                  Войти
                </Button>

                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}
              </Card.Content>
            </Card>

            <View style={styles.footer}>
              <Paragraph style={styles.footerText}>
                Версия 1.0.0
              </Paragraph>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.MD,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  title: {
    ...TYPOGRAPHY.H1,
    color: COLORS.WHITE,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  subtitle: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.WHITE,
    textAlign: 'center',
    opacity: 0.9,
  },
  card: {
    borderRadius: BORDER_RADIUS.LG,
    elevation: 8,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardTitle: {
    ...TYPOGRAPHY.H3,
    textAlign: 'center',
    marginBottom: SPACING.SM,
    color: COLORS.DARK,
  },
  cardDescription: {
    ...TYPOGRAPHY.BODY,
    textAlign: 'center',
    marginBottom: SPACING.LG,
    color: COLORS.DARK_GRAY,
  },
  segmentedButtons: {
    marginBottom: SPACING.LG,
  },
  formContainer: {
    marginBottom: SPACING.LG,
  },
  input: {
    marginBottom: SPACING.MD,
  },
  loginButton: {
    marginTop: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
  },
  loginButtonContent: {
    paddingVertical: SPACING.SM,
  },
  errorText: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.ERROR,
    textAlign: 'center',
    marginTop: SPACING.SM,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.XL,
  },
  footerText: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.WHITE,
    opacity: 0.7,
  },
});

export default LoginScreen;
