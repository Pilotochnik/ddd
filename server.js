const express = require('express');
const { Telegraf } = require('telegraf');
const MTProto = require('@mtproto/core');
require('dotenv').config();
const path = require('path'); // Импортируем модуль path

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 80;
const DOMAIN = process.env.WEBHOOK_URL || 'https://macaque-nice-lion.ngrok-free.app';
const TOKEN = process.env.TELEGRAM_TOKEN || '7297913153:AAFf9EWI68eJpqhVjlW6cB6I6NzBidy3TsE';
const api_id = Number(process.env.API_ID) || 23899456;
const api_hash = process.env.API_HASH || '9a403b5b3b140ea48166b34fb6efbdc1';

// Инициализация MTProto-клиента
const mtproto = new MTProto({
  api_id,
  api_hash,
  storageOptions: {
    path: 'mtproto-session.json',
  },
});

// Функция для вызова методов MTProto
async function mtprotoRequest(method, params) {
  try {
    const result = await mtproto.call(method, params);
    console.log(`MTProto response: ${JSON.stringify(result)}`);
    return result;
  } catch (err) {
    console.error(`MTProto Error: ${err.message}`);
    throw err;
  }
}

// Инициализация бота Telegram
const bot = new Telegraf(TOKEN);
const webhookPath = '/webhook';

// Middleware для обхода ngrok browser warning
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// Логирование всех запросов для отладки
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}, Body: ${JSON.stringify(req.body)}`);
  next();
});

// Установка статических файлов
app.use(express.static(path.join(__dirname, 'dist')));

// Обработчик команды /start
bot.start((ctx) => {
  try {
    ctx.reply('Welcome to the Slot Machine! Start spinning!');
    console.log(`User ${ctx.from.username} started the bot`);
  } catch (err) {
    console.error(`Ошибка обработки команды /start: ${err.message}`);
  }
});

// Обработчик команды /play для запуска игры
bot.command('play', (ctx) => {
  try {
    const gameUrl = 'https://macaque-nice-lion.ngrok-free.app'; // URL вашей игры
    ctx.reply('Click the button below to start the game!', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎮 Play the Game',
              web_app: { url: gameUrl }, // Кнопка для запуска игры
            },
          ],
        ],
      },
    });
    console.log(`User ${ctx.from.username} requested to play the game.`);
  } catch (err) {
    console.error(`Ошибка при запуске игры: ${err.message}`);
  }
});

// Обработчик текстовых сообщений
bot.on('message', (ctx) => {
  try {
    if (ctx.message.text) {
      ctx.reply(`Echo: ${ctx.message.text}`);
      console.log(`Message from ${ctx.from.username}: ${ctx.message.text}`);
    }
  } catch (err) {
    console.error(`Ошибка обработки текстового сообщения: ${err.message}`);
  }
});

// Обработка корневого маршрута
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html')); // Отправляем index.html с абсолютным путем
});

// Автоматическая установка вебхука и проверка его статуса
async function setupWebhook() {
  try {
    const webhookUrl = `${DOMAIN}${webhookPath}`;
    const currentStatus = await bot.telegram.getWebhookInfo();

    console.log(`Current webhook status: ${JSON.stringify(currentStatus)}`);
    if (currentStatus.url !== webhookUrl) {
      await bot.telegram.setWebhook(webhookUrl);
      console.log(`Webhook successfully set to ${webhookUrl}`);
    } else {
      console.log(`Webhook already set to ${webhookUrl}`);
    }
  } catch (err) {
    console.error(`Failed to set webhook: ${err.message}`);
  }
}

// Вызов функции установки вебхука
(async () => {
  try {
    await setupWebhook();
  } catch (err) {
    console.error(`Ошибка при установке вебхука: ${err.message}`);
  }
})();

// Обработка запросов на /webhook
app.post(webhookPath, (req, res) => {
  try {
    console.log(`Webhook request: ${JSON.stringify(req.body)}`); // Логируем тело запроса
    bot.handleUpdate(req.body)
      .then(() => {
        console.log('Successfully processed the webhook request.');
        res.status(200).send('OK');
      })
      .catch(err => {
        console.error(`Ошибка обработки запроса: ${err.message}`);
        res.status(500).send(`Ошибка обработки запроса: ${err.message}`);
      });
  } catch (err) {
    console.error(`Ошибка обработки вебхука: ${err.message}`);
    res.status(500).send(`Ошибка обработки вебхука: ${err.message}`);
  }
});

// Обработка маршрута для проверки статуса бота
app.get('/status', (req, res) => {
  try {
    res.send('Bot is running and webhook is set!');
    console.log('Status check: Bot is active.');
  } catch (err) {
    console.error(`Ошибка проверки статуса бота: ${err.message}`);
  }
});

// Новый маршрут для получения результатов игры
app.post('/sendScore', async (req, res) => {
  try {
    const { userId, score } = req.body;
    if (!userId || !score) {
      res.status(400).send('Параметры userId и score обязательны.');
      return;
    }
    console.log(`Received score: User ID: ${userId}, Score: ${score}`);

    // Отправка уведомления в Telegram
    await bot.telegram.sendMessage(userId, `Your score: ${score} was successfully recorded!`);

    res.json({ message: 'Score received successfully', userId, score });
  } catch (err) {
    console.error(`Ошибка при обработке результата: ${err.message}`);
    res.status(500).send(`Failed to process score: ${err.message}`);
  }
});

// Пример использования MTProto для вызова метода help.getNearestDc
app.get('/mtproto', async (req, res) => {
  try {
    const result = await mtprotoRequest('help.getNearestDc', {});
    res.json({ message: 'MTProto call successful', result });
  } catch (err) {
    res.status(500).send(`MTProto call failed: ${err.message}`);
  }
});

// Пример метода MTProto для отправки сообщения
app.post('/sendMessage', async (req, res) => {
  try {
    const { userId, message } = req.body;
    const result = await mtprotoRequest('messages.sendMessage', {
      peer: { _: 'inputPeerUser', user_id: userId },
      message,
      random_id: Math.abs(Math.floor(Math.random() * 1e12)),
    });
    res.json({ message: 'Message sent', result });
  } catch (err) {
    res.status(500).send(`Failed to send message: ${err.message}`);
  }
});

// Обработчик ошибок бота
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}: ${err}`);
});

// Запуск сервера
try {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Webhook URL: ${DOMAIN}${webhookPath}`);
  });
} catch (err) {
  console.error(`Ошибка при запуске сервера: ${err.message}`);
}
