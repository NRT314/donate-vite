// src/pages/DiscourseAuth.jsx (ФИНАЛЬНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ)
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccount, useSignMessage, useConnect } from 'wagmi';

const API_URL = import.meta.env.VITE_API_URL;

export default function DiscourseAuth({ t }) {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const [status, setStatus] = useState(t.forum_login_connecting);
  
  const { address, isConnected, connector } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { signMessageAsync } = useSignMessage();

  const handleLogin = useCallback(async () => {
    if (!uid) {
        setStatus("Ошибка: отсутствует идентификатор сессии.");
        return;
    }

    try {
      let currentAddress = address;
      if (!isConnected) {
          setStatus(t.forum_login_connecting_wallet);
          const injectedConnector = connectors.find(c => c.id === 'injected' && c.ready);
          
          if (!injectedConnector) {
              throw new Error("Кошелек не найден. Пожалуйста, установите MetaMask или другой совместимый кошелек.");
          }
          
          const { accounts } = await connectAsync({ connector: injectedConnector });
          currentAddress = accounts[0];
      }

      if (!currentAddress) {
        throw new Error("Не удалось получить адрес кошелька.");
      }

      setStatus(t.forum_login_signing);
      const message = `Sign this message to login to the forum: ${uid}`;
      const signature = await signMessageAsync({ message });
      
      setStatus(t.forum_login_verifying);
      
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
        setStatus(`Ошибка: ${err.message}`);
        console.error("Login process failed:", err);
    }
  }, [uid, isConnected, address, connectAsync, connectors, signMessageAsync, t]);

  useEffect(() => {
    // Ждем, пока wagmi будет готов (когда появится список коннекторов)
    if (connectors && connectors.length > 0) {
      handleLogin();
    }
  }, [connectors, handleLogin]);

  return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>{t.forum_login_title}</h2>
          <p>{status}</p>
          <div className="spinner" style={{ margin: '1rem auto' }}></div>
      </div>
  );
}