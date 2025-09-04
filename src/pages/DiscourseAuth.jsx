// src/pages/DiscourseAuth.jsx (Финальная версия, синхронизированная с OIDC-бэкендом)
import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

const API_URL = import.meta.env.VITE_API_URL;

export default function DiscourseAuth({ t }) {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const navigate = useNavigate();

  const [status, setStatus] = useState(t?.forum_login_init ?? 'Initializing authentication...');
  const [showManualButton, setShowManualButton] = useState(false);
  const flowStartedRef = useRef(false); // Предотвращаем двойное выполнение

  // Эта функция гарантирует, что формат сообщения одинаков на фронте и бэке
  const buildMessage = (uid) => `Sign this message to login to the forum: ${uid}`;

  const startFlow = useCallback(async () => {
    // Проверяем, что uid пришел из URL от Discourse
    if (!uid) {
      setStatus('Error: Missing session identifier (uid) from Discourse.');
      return;
    }
    if (flowStartedRef.current) return;
    flowStartedRef.current = true;
    setShowManualButton(false); // Прячем кнопку, как только процесс пошел

    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
      setStatus('Wallet not found. Please install a browser extension wallet like MetaMask.');
      return;
    }

    try {
      setStatus(t?.forum_login_connecting_wallet ?? 'Connecting wallet...');
      const provider = new ethers.BrowserProvider(window.ethereum);

      let accounts;
      try {
        // Запрашиваем подключение. Может быть заблокировано браузером.
        accounts = await provider.send('eth_requestAccounts', []);
      } catch (err) {
        // Если заблокировано, показываем кнопку, чтобы пользователь нажал сам
        console.warn('eth_requestAccounts was blocked, showing manual button.');
        setStatus('Please click the button to connect your wallet.');
        setShowManualButton(true);
        flowStartedRef.current = false; // Позволяем процессу запуститься заново по клику
        return;
      }

      const currentAddress = accounts?.[0];
      if (!currentAddress) throw new Error('Could not get wallet address.');

      setStatus(t?.forum_login_signing ?? 'Please sign the message in your wallet...');
      const signer = await provider.getSigner();
      const message = buildMessage(uid);
      const signature = await signer.signMessage(message);

      setStatus(t?.forum_login_verifying ?? 'Verifying...');
      
      // Создаем и отправляем форму на правильный OIDC-эндпоинт
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${API_URL}/oidc/wallet-callback`;
      form.style.display = 'none';

      const addInput = (name, value) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };
      addInput('uid', uid);
      addInput('walletAddress', currentAddress);
      addInput('signature', signature);

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error('DiscourseAuth error:', err);
      const msg = err?.message || 'An unexpected error occurred';
      setStatus(`Error: ${msg}`);
      setShowManualButton(true); // Показываем кнопку при ошибке, чтобы можно было повторить
      flowStartedRef.current = false;
    }
  }, [uid, t]);

  // Пытаемся запустить процесс автоматически при загрузке страницы
  useEffect(() => {
    startFlow();
  }, [startFlow]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>{t?.forum_login_title ?? 'Discourse Authentication'}</h2>
      <p>{status}</p>

      {/* Запасная кнопка, если автоматический запуск не удался */}
      {showManualButton && (
        <div style={{ marginTop: '1.5rem' }}>
          <button
            onClick={startFlow}
            className="button button--primary"
          >
            {t?.forum_login_connect_button ?? 'Connect Wallet'}
          </button>
        </div>
      )}
    </div>
  );
}