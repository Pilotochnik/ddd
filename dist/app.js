document.addEventListener('DOMContentLoaded', () => {
  // Проверяем, доступен ли объект Telegram Web App
  if (window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;

    // Настройка параметров приложения
    tg.expand(); // Разворачивает веб-приложение на полный экран
    tg.MainButton.text = "Start"; // Текст на основной кнопке
    tg.MainButton.setText("Start Game"); // Устанавливаем новый текст кнопки

    // Логирование для отладки
    console.log("Telegram Web App SDK инициализирован.");
    console.log("User Data:", tg.initDataUnsafe); // Информация о пользователе

    // Пример: Изменение стиля кнопки при нажатии

