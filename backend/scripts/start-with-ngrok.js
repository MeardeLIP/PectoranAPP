/**
 * Скрипт для запуска backend с ngrok туннелем
 * Автоматически создает туннель и обновляет конфигурацию
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Загружаем .env файл ПЕРЕД всеми остальными проверками
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  // Пробуем загрузить из корня проекта
  require('dotenv').config();
}

// Проверяем наличие ngrok
let useNPM = false;
let useCLI = false;

// Проверяем npm пакет
try {
  const ngrokPath = path.join(__dirname, '..', 'node_modules', '@ngrok', 'ngrok');
  if (fs.existsSync(ngrokPath)) {
    // Пробуем загрузить модуль
    require.resolve('@ngrok/ngrok');
    useNPM = true;
  }
} catch (error) {
  // Игнорируем - пакет не установлен
}

// Проверяем CLI
try {
  execSync('ngrok version', { stdio: 'ignore', timeout: 3000 });
  useCLI = true;
} catch (error) {
  // Игнорируем - CLI не установлен
}

if (!useNPM && !useCLI) {
  console.error('❌ Ngrok не установлен!');
  console.log('\n💡 Установите ngrok:');
  console.log('   Вариант 1 (рекомендуется): npm install');
  console.log('   Вариант 2: npm install @ngrok/ngrok --save-dev');
  console.log('   Вариант 3: скачайте CLI с https://ngrok.com/download');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

// Получаем токен из переменных окружения (загруженных из .env)
let NGROK_AUTHTOKEN = process.env.NGROK_AUTHTOKEN;

// Если токен не найден, пробуем прочитать напрямую из .env файла
if (!NGROK_AUTHTOKEN) {
  const envFilePath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envFilePath)) {
    try {
      const envContent = fs.readFileSync(envFilePath, 'utf8');
      const tokenMatch = envContent.match(/NGROK_AUTHTOKEN\s*=\s*(.+)/);
      if (tokenMatch) {
        NGROK_AUTHTOKEN = tokenMatch[1].trim().replace(/^["']|["']$/g, '');
        // Устанавливаем в process.env для дальнейшего использования
        process.env.NGROK_AUTHTOKEN = NGROK_AUTHTOKEN;
      }
    } catch (error) {
      console.error('⚠️  Ошибка чтения .env файла:', error.message);
    }
  }
}

// Проверяем наличие токена
if (!NGROK_AUTHTOKEN) {
  console.error('❌ NGROK_AUTHTOKEN не установлен!');
  console.log('\n💡 Инструкция:');
  console.log('1. Откройте файл backend/.env');
  console.log('2. Добавьте строку: NGROK_AUTHTOKEN=your_token_here');
  console.log('3. Убедитесь, что нет пробелов вокруг знака =');
  console.log('4. Или установите через CLI: ngrok authtoken <токен>');
  console.log('\n📝 Пример правильного формата:');
  console.log('   NGROK_AUTHTOKEN=1lWsdiqUS0rupcnKTIArF1KP5la_2mUUNYdCwbsoec4KegkGo');
  
  // Проверяем, существует ли .env файл
  const envFilePath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envFilePath)) {
    console.log(`\n⚠️  Файл .env найден: ${envFilePath}`);
    console.log('   Проверьте содержимое файла:');
    try {
      const envContent = fs.readFileSync(envFilePath, 'utf8');
      const lines = envContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
      console.log(`   Найдено ${lines.length} строк(и) в .env файле`);
      if (envContent.includes('NGROK_AUTHTOKEN')) {
        console.log('   ⚠️  Строка с NGROK_AUTHTOKEN найдена, но токен не распознан');
        console.log('   Проверьте формат: NGROK_AUTHTOKEN=token (без пробелов)');
      } else {
        console.log('   ❌ Строка с NGROK_AUTHTOKEN не найдена в файле');
      }
    } catch (error) {
      console.log(`   ❌ Ошибка чтения файла: ${error.message}`);
    }
  } else {
    console.log(`\n⚠️  Файл .env не найден: ${envFilePath}`);
    console.log('   Создайте файл .env и добавьте NGROK_AUTHTOKEN');
  }
  
  process.exit(1);
}

// Выводим информацию о токене (первые и последние 4 символа для безопасности)
const tokenPreview = NGROK_AUTHTOKEN.length > 8 
  ? `${NGROK_AUTHTOKEN.substring(0, 4)}...${NGROK_AUTHTOKEN.substring(NGROK_AUTHTOKEN.length - 4)}`
  : '***';
console.log(`✅ Ngrok токен найден: ${tokenPreview}`);

let ngrokUrl = null;
let ngrokProcess = null;
let serverProcess = null;

// Функция для получения ngrok URL через API
async function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4040,
      path: '/api/tunnels',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.tunnels && response.tunnels.length > 0) {
            const httpsTunnel = response.tunnels.find(t => t.proto === 'https');
            if (httpsTunnel) {
              resolve(httpsTunnel.public_url);
            } else if (response.tunnels[0]) {
              resolve(response.tunnels[0].public_url);
            }
          }
          reject(new Error('Туннель не найден'));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Функция для запуска ngrok через CLI
function startNgrokCLI() {
  console.log('🚀 Запуск ngrok через CLI...');
  
  ngrokProcess = spawn('ngrok', ['http', PORT.toString()], {
    stdio: 'pipe',
    shell: true
  });

  ngrokProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
  });

  ngrokProcess.stderr.on('data', (data) => {
    const output = data.toString();
    if (!output.includes('started tunnel')) {
      console.error(output);
    }
  });

  ngrokProcess.on('close', (code) => {
    console.log(`\n🛑 Ngrok завершен с кодом ${code}`);
  });
}

// Функция для запуска ngrok через NPM пакет
async function startNgrokNPM() {
  console.log('🚀 Запуск ngrok через NPM пакет...');
  
  try {
    // Динамически загружаем модуль только если он доступен
    let ngrok;
    try {
      ngrok = require('@ngrok/ngrok');
    } catch (requireError) {
      throw new Error('Модуль @ngrok/ngrok не найден. Выполните: npm install');
    }
    
    await ngrok.authtoken(NGROK_AUTHTOKEN);
    
    const listener = await ngrok.forward({
      addr: PORT,
      authtoken_from_env: false
    });
    
    ngrokUrl = listener.url();
    console.log(`\n✅ Ngrok туннель создан: ${ngrokUrl}`);
    console.log(`📱 API URL: ${ngrokUrl}/api`);
    console.log(`🔌 WebSocket URL: ${ngrokUrl.replace('https://', 'wss://').replace('http://', 'ws://')}`);
    
    return listener;
  } catch (error) {
    console.error('❌ Ошибка запуска ngrok:', error.message);
    throw error;
  }
}

// Функция для ожидания ngrok URL
async function waitForNgrokUrl(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const url = await getNgrokUrl();
      return url;
    } catch (error) {
      // Продолжаем попытки
    }
  }
  throw new Error('Не удалось получить ngrok URL');
}

// Функция для обновления конфигурации мобильного приложения
function updateMobileConfig(ngrokUrl) {
  try {
    const mobileConfigPath = path.join(__dirname, '..', '..', 'PectoranMobile', 'src', 'config', 'network.js');
    
    if (!fs.existsSync(mobileConfigPath)) {
      console.log('⚠️  Файл конфигурации мобильного приложения не найден');
      return;
    }
    
    let content = fs.readFileSync(mobileConfigPath, 'utf8');
    
    // Извлекаем домен из ngrok URL
    let domain = ngrokUrl.replace(/^https?:\/\//, ''); // Убираем протокол
    domain = domain.replace(/\/$/, ''); // Убираем trailing slash
    domain = domain.split(':')[0]; // Убираем порт если есть
    
    if (!domain) {
      console.error('⚠️  Не удалось извлечь домен из ngrok URL');
      return;
    }
    
    // Обновляем LOCAL_IP_ADDRESS
    const ipRegex = /export const LOCAL_IP_ADDRESS = .*?;/;
    const newIpLine = `export const LOCAL_IP_ADDRESS = '${domain}'; // Ngrok tunnel`;
    
    if (ipRegex.test(content)) {
      content = content.replace(ipRegex, newIpLine);
    } else {
      // Добавляем после комментария
      const commentRegex = /(\/\/ Локальный IP адрес.*?\n)/;
      if (commentRegex.test(content)) {
        content = content.replace(commentRegex, `$1export const LOCAL_IP_ADDRESS = '${domain}'; // Ngrok tunnel\n`);
      }
    }
    
    // Обновляем API_PORT на 80 для ngrok (ngrok использует стандартные порты)
    const portRegex = /export const API_PORT = \d+;/;
    const newPortLine = `export const API_PORT = 80; // Ngrok использует стандартный порт`;
    
    if (portRegex.test(content)) {
      content = content.replace(portRegex, newPortLine);
    }
    
    fs.writeFileSync(mobileConfigPath, content, 'utf8');
    console.log(`✅ Конфигурация мобильного приложения обновлена`);
    console.log(`   Домен: ${domain}`);
    console.log(`   Порт: 80`);
  } catch (error) {
    console.error('⚠️  Ошибка обновления конфигурации:', error.message);
    console.log('💡 Вы можете обновить конфигурацию вручную:');
    console.log(`   cd PectoranMobile && npm run setup:network ${ngrokUrl}`);
  }
}

// Основная функция
async function main() {
  console.log('\n🌐 Запуск backend с ngrok туннелем');
  console.log('═'.repeat(60));
  console.log(`📍 Порт: ${PORT}`);
  console.log(`🔑 Token: ${NGROK_AUTHTOKEN ? '✅ Настроен' : '❌ Не настроен'}`);
  console.log('═'.repeat(60));
  
  if (!NGROK_AUTHTOKEN) {
    console.error('\n❌ NGROK_AUTHTOKEN не установлен!');
    process.exit(1);
  }
  
  // Запускаем backend сервер
  console.log('\n🚀 Запуск backend сервера...');
  const isDev = process.argv.includes('--dev');
  const command = isDev ? 'nodemon' : 'node';
  const serverPath = path.join(__dirname, '..', 'src', 'server.js');
  
  serverProcess = spawn(command, [serverPath], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: PORT.toString()
    }
  });
  
  // Ждем немного, чтобы сервер запустился
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Запускаем ngrok
  let listener = null;
  
  if (useNPM) {
    try {
      listener = await startNgrokNPM();
      ngrokUrl = listener.url();
    } catch (error) {
      console.error('❌ Ошибка запуска ngrok через NPM, пробуем CLI...');
      useNPM = false;
    }
  }
  
  if (!useNPM && useCLI) {
    startNgrokCLI();
    // Ждем, пока ngrok запустится и получим URL
    try {
      ngrokUrl = await waitForNgrokUrl();
      console.log(`\n✅ Ngrok туннель создан: ${ngrokUrl}`);
    } catch (error) {
      console.error('❌ Не удалось получить ngrok URL');
      console.log('💡 Проверьте, что ngrok запущен и доступен на http://localhost:4040');
    }
  }
  
  if (ngrokUrl) {
    console.log('\n📱 Информация для мобильного приложения:');
    console.log('═'.repeat(60));
    console.log(`🌐 Ngrok URL: ${ngrokUrl}`);
    console.log(`📡 API URL: ${ngrokUrl}/api`);
    console.log(`🔌 WebSocket: ${ngrokUrl.replace('https://', 'wss://').replace('http://', 'ws://')}`);
    console.log('═'.repeat(60));
    
    // Обновляем конфигурацию мобильного приложения
    updateMobileConfig(ngrokUrl);
    
    console.log('\n💡 Следующие шаги:');
    console.log('1. Перезапустите мобильное приложение');
    console.log('2. Убедитесь, что конфигурация обновлена');
    console.log('3. Тестируйте с любого устройства из любой сети!');
  }
  
  // Обработка завершения
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Завершение работы...');
    if (listener) {
      await listener.close();
    }
    if (ngrokProcess) {
      ngrokProcess.kill();
    }
    if (serverProcess) {
      serverProcess.kill('SIGINT');
    }
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Завершение работы...');
    if (listener) {
      await listener.close();
    }
    if (ngrokProcess) {
      ngrokProcess.kill();
    }
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });
}

module.exports = { startNgrokNPM, startNgrokCLI, getNgrokUrl };

