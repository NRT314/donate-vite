// src/hooks/useAuth.js
import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

const API_URL = import.meta.env.VITE_API_URL;

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();

    const loginAndRedirect = async () => {
        if (!isConnected || !address) {
            alert('Please connect your wallet first.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const message = "Sign this message to login to the forum";
            const signature = await signMessageAsync({ message });

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: address, signature }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to authenticate.');
            }

            const { token } = data;
            window.location.href = `${API_URL}/sso/discourse-login?token=${token}`;

        } catch (err) {
            console.error('Authentication error:', err);
            setError(err.message);
            setIsLoading(false);
        }
    };

    return { loginAndRedirect, isLoading, error };
};