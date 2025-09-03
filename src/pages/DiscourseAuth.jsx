// src/pages/DiscourseAuth.jsx (ФИНАЛЬНАЯ ВЕРСИЯ OIDC)
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccount, useSignMessage, useConnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

const API_URL = import.meta.env.VITE_API_URL;

export default function DiscourseAuth({ t }) {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const [status, setStatus] = useState(t.forum_login_connecting);

  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
      const handleLogin = async () => {
          if (!uid) {
              setStatus("Ошибка: отсутствует идентификатор сессии.");
              return;
          }

          let currentAddress = address;
          if (!isConnected) {
              try {
                  const { accounts } = await connectAsync({ connector: new InjectedConnector() });
                  currentAddress = accounts[0];
              } catch (err) {
                  setStatus("Ошибка: подключение кошелька отклонено.");
                  return;
              }
          }

          try {
              setStatus(t.forum_login_signing);

              // ФОРМИРУЕМ ДИНАМИЧЕСКОЕ СООБЩЕНИЕ С UID
              const message = `Sign this message to login to the forum: ${uid}`;
              const signature = await signMessageAsync({ message });

              setStatus(t.forum_login_verifying);

              // ИСПОЛЬЗУЕМ СКРЫТУЮ ФОРМУ ДЛЯ НАДЕЖНОГО РЕДИРЕКТА
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
          }
      };

      handleLogin();
  }, [uid, isConnected, address, connectAsync, signMessageAsync, t]);

  return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>{t.forum_login_title}</h2>
          <p>{status}</p>
          <div className="spinner" style={{ margin: '1rem auto' }}></div>
      </div>
  );
}