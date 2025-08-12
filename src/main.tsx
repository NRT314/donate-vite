// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './App.css';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Загружаем projectId из переменной окружения
// Vite автоматически подставит значение из .env
const projectId = import.meta.env.VITE_PROJECT_ID;

if (!projectId) {
  console.error("❌ Ошибка: переменная окружения VITE_PROJECT_ID не установлена.");
}

const config = getDefaultConfig({
  appName: 'NRT Donate',
  projectId,
  chains: [polygon],
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
