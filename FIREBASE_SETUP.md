# Настройка Firebase Cloud Messaging

## 1. Создание проекта Firebase

1. Перейди на [Firebase Console](https://console.firebase.google.com/)
2. Нажми "Создать проект"
3. Введи название: `PectoranRestaurant` (или любое другое)
4. Включи Google Analytics (опционально)
5. Создай проект

## 2. Добавление Android приложения

1. В Firebase Console выбери "Добавить приложение" → Android
2. Введи:
   - **Package name**: `com.pectoranmobile`
   - **App nickname**: `Pectoran Mobile`
   - **Debug signing certificate SHA-1**: (опционально, для разработки)

3. Скачай файл `google-services.json`
4. Помести его в папку `PectoranMobile/android/app/`

## 3. Настройка серверного ключа

1. В Firebase Console перейди в "Project Settings" → "Service accounts"
2. Нажми "Generate new private key"
3. Скачай JSON файл с ключом
4. Скопируй содержимое файла в переменную окружения `FIREBASE_SERVICE_ACCOUNT` в `backend/.env`:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
```

## 4. Обновление зависимостей

```bash
# В папке PectoranMobile
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## 5. Проверка работы

1. Запусти приложение
2. Войди как официант
3. Создай заказ
4. Войди как повар
5. Измени статус заказа на "Готов"
6. Официант должен получить push-уведомление

## 6. Отладка

Если уведомления не работают:

1. Проверь логи в Metro: `npx react-native log-android`
2. Проверь логи бэкенда на наличие ошибок Firebase
3. Убедись что `google-services.json` находится в правильной папке
4. Проверь что `FIREBASE_SERVICE_ACCOUNT` правильно настроен в `.env`

## 7. Тестовые сценарии

### Сценарий 1: Новый заказ
1. Официант создает заказ
2. Повар получает push-уведомление "Новый заказ!"

### Сценарий 2: Заказ готов
1. Повар меняет статус на "Готов"
2. Официант получает push-уведомление "Заказ готов!"

## 8. Настройка иконки уведомлений (опционально)

1. Создай иконку `ic_notification.png` (24x24dp)
2. Помести в `PectoranMobile/android/app/src/main/res/drawable/`
3. Перезапусти приложение
