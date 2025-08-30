// src/pages/DiscourseAuth.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAccount, useConnect, useSignMessage } from 'wagmi';
// --- CHANGE: Corrected the import path and name ---
import { injected } from 'wagmi/connectors';

const API_URL = import.meta.env.VITE_API_URL;

export default function DiscourseAuth({ t }) {
    const [status, setStatus] = useState(t.forum_auth_status_init || 'Initializing authentication...');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const { address, isConnected } = useAccount();
    // --- CHANGE: Corrected how the connector is used ---
    const { connect } = useConnect({ connector: injected() });
    const { signMessageAsync } = useSignMessage();

    useEffect(() => {
        const authenticate = async () => {
            const sso = searchParams.get('sso');
            const sig = searchParams.get('sig');

            if (!sso || !sig) {
                setStatus(t.forum_auth_status_error_params || 'Error: Missing SSO parameters.');
                return;
            }

            // Only try to connect if not already connected
            if (!isConnected) {
                setStatus(t.forum_auth_status_connect || 'Please connect your wallet...');
                connect();
            }
        };

        authenticate();
    }, [searchParams, isConnected, connect, t]);

    useEffect(() => {
        const signAndVerify = async () => {
            if (isConnected && address) {
                setStatus(t.forum_auth_status_sign || 'Please sign the message in your wallet...');
                try {
                    const sso = searchParams.get('sso');
                    const sig = searchParams.get('sig');
                    const message = "Sign this message to login to the forum";
                    
                    const signature = await signMessageAsync({ message });

                    setStatus(t.forum_auth_status_verify || 'Verifying...');
                    const response = await fetch(`${API_URL}/sso/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sso, sig, walletAddress: address, signature }),
                    });

                    const data = await response.json();

                    if (data.success) {
                        window.location.href = data.redirectUrl;
                    } else {
                        throw new Error(data.message || 'Verification failed.');
                    }
                } catch (error) {
                    console.error('SSO Error:', error);
                    // Avoid showing "User rejected" if they simply close the modal
                    if (error.code !== 4001) {
                        setStatus(`${t.forum_auth_status_error_final || 'An error occurred:'} ${error.message}`);
                    } else {
                        setStatus('Login canceled. Redirecting...');
                    }
                    // Redirect home after an error or cancellation
                    setTimeout(() => navigate('/'), 3000);
                }
            }
        };

        signAndVerify();
    }, [isConnected, address, signMessageAsync, searchParams, navigate, t]);

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>{t.forum_auth_title || 'Discourse Authentication'}</h2>
            <p>{status}</p>
            {status.includes('...') && <div className="spinner" style={{ margin: '1rem auto' }}></div>}
        </div>
    );
}