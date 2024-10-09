document.addEventListener('DOMContentLoaded', () => {
  const resultDisplay = document.getElementById('result');
  const submitButton = document.getElementById('submitResult');
  let score = 0;

  // Инициализация SDK Telegram
  const tg = window.Telegram.WebApp;
  tg.ready();

  // Настройка кнопки Telegram "Play Again"
  tg.MainButton.setText('Play Again');
  tg.MainButton.show();

  // Функция для завершения игры и отображения результата
  function handleGameOver(finalScore) {
    score = finalScore; // Установка финального счета
    resultDisplay.innerText = `Your Score: ${score}`;

    // Добавление события на кнопку отправки результата
    submitButton.addEventListener('click', () => {
      sendScoreToServer(score);
      tg.sendData(JSON.stringify({ score: score })); // Отправка данных в Telegram
    });
  }

  // Функция отправки результата на сервер
  async function sendScoreToServer(score) {
    try {
      const response = await fetch('/sendScore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: tg.initDataUnsafe.user.id, score: score }) // Отправка ID пользователя и счета
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Score sent successfully:', result);
        alert('Score was sent to the server successfully!');
      } else {
        console.error('Failed to send score:', response.statusText);
        alert('Failed to send score to the server.');
      }
    } catch (err) {
      console.error('Error during sending score:', err);
      alert(`Error: ${err.message}`);
    }
  }

  // Пример завершения игры с автоматической отправкой
  handleGameOver(100); // Замените это значение на реальный счет
});
