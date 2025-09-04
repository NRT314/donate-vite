// src/pages/DiscourseAuth.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';

const API_URL = import.meta.env.VITE_API_URL;

export default function DiscourseAuth({ t }) {
  const [status, setStatus] = useState('Initializing...');
  const [showButton, setShowButton] = useState(false);
  const flowStartedRef = useRef(false);

  const startLogin = async () => {
    if (flowStartedRef.current) return;
    flowStartedRef.current = true;
    setShowButton(false);

    if (!window.ethereum) {
      setStatus('Wallet not found. Please install MetaMask or another wallet.');
      flowStartedRef.current = false;
      return;
    }

    try {
      setStatus('Connecting wallet...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const walletAddress = accounts[0];

      if (!walletAddress) throw new Error('No wallet found');

      setStatus('Requesting login session...');
      const uidRes = await fetch(`${API_URL}/wallet-login-start`);
      const { uid } = await uidRes.json();

      setStatus('Signing message...');
      const signer = await provider.getSigner();
      const message = `Sign this message to login to the forum: ${uid}`;
      const signature = await signer.signMessage(message);

      setStatus('Verifying wallet and redirecting...');
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${API_URL}/wallet-login-callback`;
      form.style.display = 'none';

      const addInput = (name, value) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };

      addInput('uid', uid);
      addInput('walletAddress', walletAddress);
      addInput('signature', signature);

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
      setShowButton(true);
    } finally {
      flowStartedRef.current = false;
    }
  };

  useEffect(() => {
    startLogin();
  }, []);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>{t?.forum_login_title ?? 'Discourse Authentication'}</h2>
      <p>{status}</p>
      {showButton && (
        <button className="button button--primary" onClick={startLogin}>
          {t?.forum_login_connect_button ?? 'Connect Wallet'}
        </button>
      )}
    </div>
  );
}
