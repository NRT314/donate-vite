import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx'; // Убедитесь, что путь к вашему App.jsx верный
import './App.css'; // Убедитесь, что путь к вашим стилям верный

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Проверка переменной окружения
const projectId = import.meta.env.VITE_PROJECT_ID;
if (!projectId) {
  throw new Error("VITE_PROJECT_ID is not defined in your .env file. Get one from https://cloud.walletconnect.com/");
}

// Новая, правильная конфигурация для wagmi v2
const config = getDefaultConfig({
  appName: 'NRT dApp',
  projectId: projectId,
  chains: [polygon],
  ssr: false, // установите true, если используете Server-Side Rendering
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* WagmiProvider вместо WagmiConfig, и передаем config вместо client */}
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* RainbowKitProvider больше не требует chains */}
        <RainbowKitProvider modalSize="compact">
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);