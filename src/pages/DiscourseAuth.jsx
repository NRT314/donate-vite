import React, { useEffect, useState, useRef } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

function DiscourseAuth() {
  const [uid, setUid] = useState(null);
  const [error, setError] = useState('');
  const formRef = useRef(null);

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const uidFromUrl = urlParams.get('uid');
    if (uidFromUrl) {
      setUid(uidFromUrl);
    } else {
      setError('Ошибка: UID для аутентификации не найден в URL.');
    }
  }, []);

  const handleSignAndSubmit = async () => {
    if (!isConnected || !address) {
      setError('Пожалуйста, сначала подключите кошелек.');
      return;
    }
    if (!uid) {
      setError('Не удалось получить UID сессии. Попробуйте войти снова.');
      return;
    }
    setError('');

    try {
      const messageToSign = `Sign this message to login to the forum: ${uid}`;
      const signature = await signMessageAsync({ message: messageToSign });

      if (formRef.current) {
        formRef.current.elements.signature.value = signature;
        formRef.current.elements.walletAddress.value = address;
        formRef.current.elements.uid.value = uid;
        formRef.current.submit();
      }
    } catch (e) {
      console.error('Ошибка при подписании сообщения:', e);
      setError('Вы отклонили подписание сообщения, или произошла ошибка.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      {/* ===== НАШ ВИЗУАЛЬНЫЙ ТЕСТ ("МАЯЧОК") ===== */}
      <h1 style={{ color: 'red', fontWeight: 'bold' }}>ПРОВЕРКА ОБНОВЛЕНИЯ КОДА: WAGMI V2</h1>
      
      <h1>Аутентификация для форума</h1>
      <p>Подключите кошелек и подпишите сообщение для завершения входа.</p>
      
      <div style={{ margin: '20px 0' }}>
        <ConnectButton />
      </div>

      {isConnected && (
        <button 
          onClick={handleSignAndSubmit} 
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
          disabled={!uid}
        >
          Подписать и войти
        </button>
      )}

      {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}

      <form
        ref={formRef}
        method="POST"
        action="https://donate-vite.onrender.com/wallet-callback"
        style={{ display: 'none' }}
      >
        <input type="hidden" name="signature" />
        <input type="hidden" name="walletAddress" />
        <input type="hidden" name="uid" />
      </form>
    </div>
  );
}

export default DiscourseAuth;