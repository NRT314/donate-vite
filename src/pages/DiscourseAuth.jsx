// src/pages/DiscourseAuth.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccount, useConnect, useSignMessage } from 'wagmi';

const OIDC_SERVER_URL = import.meta.env.VITE_OIDC_SERVER_URL || 'https://donate-vite.onrender.com';

export default function DiscourseAuth() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const [statusText, setStatusText] = useState('Инициализация...');
  
  const { address, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: isConnecting } = useConnect();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();

  const preferredConnector = useMemo(() => {
    if (!connectors?.length) return undefined;
    return connectors.find((c) => c.id === 'injected' && c.ready) ?? connectors[0];
  }, [connectors]);

  useEffect(() => {
    const runAuthentication = async () => {
      try {
        if (!uid) {
          setStatusText('Ошибка: UID сессии не найден.');
          return;
        }

        let currentAddress = address;

        if (!isConnected) {
          setStatusText('Подключаем кошелек...');
          if (!preferredConnector) {
            setStatusText('Кошельки не найдены. Пожалуйста, установите MetaMask.');
            return;
          }
          const result = await connectAsync({ connector: preferredConnector });
          currentAddress = result?.accounts?.[0];
        }

        if (!currentAddress) {
          throw new Error('Не удалось получить адрес кошелька.');
        }

        setStatusText('Пожалуйста, подпишите сообщение в вашем кошельке...');
        const message = `Sign this message to login to the forum: ${uid}`;
        const signature = await signMessageAsync({ message });

        setStatusText('Проверка подписи...');
        
        const form = document.createElement('form');
        form.method = 'POST';
        // ИЗМЕНЕНИЕ: Указываем правильный, полный путь, как советовал специалист
        form.action = `${OIDC_SERVER_URL}/oidc/wallet-callback`;
        
        const createInput = (name, value) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          form.appendChild(input);
        };

        createInput('uid', uid);
        createInput('walletAddress', currentAddress);
        createInput('signature', signature);
        
        document.body.appendChild(form);
        form.submit();

      } catch (err) {
        console.error('Ошибка аутентификации:', err);
        setStatusText(`Ошибка: ${err.shortMessage || err.message}`);
      }
    };
    
    if (uid && connectors && !isConnecting && !isSigning) {
      runAuthentication();
    }

  }, [uid, address, isConnected, connectors, connectAsync, signMessageAsync, isConnecting, isSigning, preferredConnector]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Аутентификация для форума</h2>
      <p style={{ fontSize: '18px', minHeight: '30px' }}>{statusText}</p>
    </div>
  );
}