// src/pages/DiscourseAuth.jsx (FINAL CORRECTED VERSION)
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccount, useSignMessage, useConnect } from 'wagmi';
// The problematic import for InjectedConnector is removed.

const API_URL = import.meta.env.VITE_API_URL;

export default function DiscourseAuth({ t }) {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const [status, setStatus] = useState(t.forum_login_connecting);
  
  const { address, isConnected } = useAccount();
  // Get the available connectors from the useConnect hook
  const { connectAsync, connectors } = useConnect();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
      const handleLogin = async () => {
          if (!uid) {
              setStatus("Error: Session identifier is missing.");
              return;
          }

          let currentAddress = address;
          if (!isConnected) {
              try {
                  // Find the injected connector (e.g., MetaMask) from the list of available connectors
                  const injectedConnector = connectors.find(
                    (c) => c.id === "injected" && c.ready
                  );

                  if (!injectedConnector) {
                    throw new Error("Wallet not found. Please install MetaMask or another compatible wallet.");
                  }

                  const { accounts } = await connectAsync({ connector: injectedConnector });
                  currentAddress = accounts[0];
              } catch (err) {
                  setStatus(`Error: Wallet connection was rejected. ${err.message}`);
                  return;
              }
          }

          try {
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
              setStatus(`Error: ${err.message}`);
          }
      };

      handleLogin();
  }, [uid, isConnected, address, connectAsync, connectors, signMessageAsync, t]);

  return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>{t.forum_login_title}</h2>
          <p>{status}</p>
          <div className="spinner" style={{ margin: '1rem auto' }}></div>
      </div>
  );
}