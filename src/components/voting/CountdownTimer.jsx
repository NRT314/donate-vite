import React, { useState, useEffect } from 'react';

// Этот хук будет пересчитывать оставшееся время каждую секунду
const useCountdown = (endTime) => {
  const [timeLeft, setTimeLeft] = useState(endTime - Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft(endTime - Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [endTime, timeLeft]);

  return timeLeft > 0 ? timeLeft : 0;
};

// Функция для форматирования секунд в дни, часы, минуты, секунды
const formatTime = (seconds) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return `${d}д ${h}ч ${m}м ${s}с`;
};

export default function CountdownTimer({ endTime, t }) {
  const timeLeft = useCountdown(endTime);

  if (timeLeft <= 0) {
    return <p style={{ fontWeight: 'bold' }}>{t.voting_finished || "Голосование завершено"}</p>;
  }

  return (
    <div className="countdown-timer" style={{ margin: '1rem 0', textAlign: 'center' }}>
      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>
        {t.time_left || "Осталось времени:"} {formatTime(timeLeft)}
      </p>
    </div>
  );
}