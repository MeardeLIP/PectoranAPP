/**
 * Скрипт для запуска backend с выводом сетевой информации
 * Полезно для тестирования на реальных мобильных устройствах
 */

const { spawn } = require('child_process');
const { getLocalIPAddress } = require('./get-local-ip');
const path = require('path');

// Получаем локальный IP
const localIP = getLocalIPAddress();
const port = process.env.PORT || 3000;

console.log('\n🚀 Запуск backend сервера для тестирования на реальных устройствах');
console.log('═'.repeat(60));
console.log(`📍 Локальный IP: ${localIP}`);
console.log(`🔌 Порт: ${port}`);
console.log(`📱 API URL: http://${localIP}:${port}/api`);
console.log(`🔗 WebSocket URL: ws://${localIP}:${port}`);
console.log('═'.repeat(60));
console.log('\n💡 Убедитесь, что устройства в одной Wi-Fi сети!\n');

// Запускаем сервер через nodemon или node
const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
const command = isDev ? 'nodemon' : 'node';
const serverPath = path.join(__dirname, '..', 'src', 'server.js');

const serverProcess = spawn(command, [serverPath], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: port.toString()
  }
});

// Обработка завершения процесса
serverProcess.on('close', (code) => {
  console.log(`\n\n🛑 Сервер завершен с кодом ${code}`);
  process.exit(code);
});

serverProcess.on('error', (error) => {
  console.error('❌ Ошибка запуска сервера:', error);
  process.exit(1);
});

// Обработка сигналов
process.on('SIGINT', () => {
  console.log('\n\n🛑 Получен SIGINT, завершение работы...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Получен SIGTERM, завершение работы...');
  serverProcess.kill('SIGTERM');
});

