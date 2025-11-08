/**
 * Точка входа в React Native приложение PectoranAPP
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Подавление предупреждения о депрекации InteractionManager
// Это предупреждение исходит из react-native-paper (компонент Card) и будет исправлено в будущих версиях библиотеки
// InteractionManager помечен как deprecated в React Native 0.82+, но react-native-paper еще использует его для анимаций
// Временное решение до обновления библиотеки
LogBox.ignoreLogs([
  'InteractionManager has been deprecated and will be removed in a future release',
]);

AppRegistry.registerComponent(appName, () => App);
