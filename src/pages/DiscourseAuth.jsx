// src/pages/DiscourseAuth.jsx — wagmi v2 & RainbowKit v2 safe
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccount, useConnect, useSignMessage, useWalletClient } from 'wagmi';

const API_URL = import.meta.env.VITE_API_URL;

export default function DiscourseAuth({ t }) {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');

  const [statusText, setStatusText] = useState(
    t?.forum_login_connecting ?? 'Connecting...'
  );

  const { status: accountStatus, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { connectors, connectAsync, isPending: isConnecting } = useConnect();
  const { signMessageAsync } = useSignMessage();

  const preferredConnector = useMemo(() => {
    if (!connectors?.length) return undefined;
    const injected =
      connectors.find((c) => (c.id === 'injected' || c.name?.includes('Injected')) && c.ready) ??
      connectors.find((c) => c.id?.includes('metamask') && c.ready);
    return injected ?? connectors[0];
  }, [connectors]);

  useEffect(() => {
    const run = async () => {
      try {
        if (!uid) {
          setStatusText('Ошибка: отсутствует идентификатор сессии (uid).');
          return;
        }

        if (!preferredConnector && !connectors?.length) return;

        let currentAddress = address;

        if (accountStatus !== 'connected') {
          setStatusText(t?.forum_login_connecting_wallet ?? 'Connecting wallet...');
          const res = await connectAsync({ connector: preferredConnector });
          currentAddress = res?.accounts?.[0] ?? currentAddress;
        }

        if (!currentAddress) {
          throw new Error('Не удалось определить адрес кошелька.');
        }

        if (!walletClient && accountStatus !== 'connected') {
          await new Promise((r) => setTimeout(r, 0));
        }

        setStatusText(t?.forum_login_signing ?? 'Please sign in your wallet...');
        const message = `Sign this message to login to the forum: ${uid}`;
        const signature = await signMessageAsync({ message });

        setStatusText(t?.forum_login_verifying ?? 'Verifying...');
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `${API_URL}/oidc/wallet-callback`;
        form.style.display = 'none';

        const add = (name, value) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          form.appendChild(input);
        };

        add('uid', uid);
        add('walletAddress', currentAddress);
        add('signature', signature);

        document.body.appendChild(form);
        form.submit();
      } catch (err) {
        console.error('OIDC wallet login failed:', err);
        const msg =
          err?.shortMessage ||
          err?.message ||
          t?.forum_login_error_generic ||
          'Login failed';
        setStatusText(`Ошибка: ${msg}`);
      }
    };

    if (uid && connectors) {
      if (!isConnecting) run();
    }
  }, [
    uid,
    connectors,
    preferredConnector,
    connectAsync,
    isConnecting,
    accountStatus,
    address,
    walletClient,
    signMessageAsync,
    t,
  ]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>{t?.forum_login_title ?? 'Discourse Authentication'}</h2>
      <p>{statusText}</p>
      <div className="spinner" style={{ margin: '1rem auto' }} />
    </div>
  );
}