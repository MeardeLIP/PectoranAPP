/**
 * Скрипт для проверки установки ngrok
 * Проверяет наличие ngrok CLI или npm пакета
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkNgrokCLI() {
  try {
    execSync('ngrok version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkNgrokNPM() {
  try {
    const packagePath = path.join(__dirname, '..', 'node_modules', '@ngrok', 'ngrok');
    return fs.existsSync(packagePath);
  } catch (error) {
    return false;
  }
}

function checkNgrokToken() {
  // Проверяем наличие токена в переменных окружения или конфиге
  const token = process.env.NGROK_AUTHTOKEN;
  if (token) {
    return true;
  }
  
  // Проверяем наличие токена в .env файле
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('NGROK_AUTHTOKEN')) {
        return true;
      }
    }
  } catch (error) {
    // Игнорируем ошибки
  }
  
  return false;
}

function main() {
  console.log('\n🔍 Проверка установки ngrok...');
  console.log('═'.repeat(60));
  
  const hasCLI = checkNgrokCLI();
  const hasNPM = checkNgrokNPM();
  const hasToken = checkNgrokToken();
  
  console.log(`📦 Ngrok CLI: ${hasCLI ? '✅ Установлен' : '❌ Не установлен'}`);
  console.log(`📦 Ngrok NPM: ${hasNPM ? '✅ Установлен' : '❌ Не установлен'}`);
  console.log(`🔑 Ngrok Token: ${hasToken ? '✅ Настроен' : '❌ Не настроен'}`);
  console.log('═'.repeat(60));
  
  if (!hasCLI && !hasNPM) {
    console.log('\n💡 Инструкция по установке:');
    console.log('\nВариант 1: Установить ngrok CLI');
    console.log('1. Скачайте ngrok с https://ngrok.com/download');
    console.log('2. Распакуйте и добавьте в PATH');
    console.log('3. Выполните: ngrok authtoken <ваш_токен>');
    
    console.log('\nВариант 2: Установить npm пакет');
    console.log('1. cd backend');
    console.log('2. npm install @ngrok/ngrok --save-dev');
    console.log('3. Добавьте NGROK_AUTHTOKEN в .env файл');
    
    console.log('\n📝 Получить токен:');
    console.log('1. Зарегистрируйтесь на https://ngrok.com/');
    console.log('2. Перейдите в Dashboard → Your Authtoken');
    console.log('3. Скопируйте токен');
    
    process.exit(1);
  }
  
  if (!hasToken) {
    console.log('\n⚠️  Внимание: Ngrok токен не настроен!');
    console.log('\n💡 Настройка токена:');
    console.log('1. Получите токен на https://ngrok.com/');
    console.log('2. Добавьте в .env файл: NGROK_AUTHTOKEN=your_token_here');
    console.log('3. Или выполните: ngrok authtoken <ваш_токен>');
    process.exit(1);
  }
  
  console.log('\n✅ Ngrok готов к использованию!');
  console.log('\n🚀 Запуск с ngrok:');
  console.log('   npm run start:ngrok');
  console.log('   npm run dev:ngrok');
}

if (require.main === module) {
  main();
}

module.exports = { checkNgrokCLI, checkNgrokNPM, checkNgrokToken };

