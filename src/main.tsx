// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './App.css';

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {
  WagmiProvider,
  http,
  createConfig,
} from 'wagmi';
import { polygon } from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from '@tanstack/react-query';

// 👇 Читаем из .env
const projectId = import.meta.env.VITE_PROJECT_ID;
const polygonRpcUrl = import.meta.env.VITE_POLYGON_RPC_URL;

if (!projectId) {
  throw new Error("VITE_PROJECT_ID is not defined in .env file. Please add it to proceed.");
}

if (!polygonRpcUrl) {
  throw new Error("VITE_POLYGON_RPC_URL is not defined in .env file. Please add your RPC URL.");
}

// 👇 Переопределяем chain, чтобы RainbowKit тоже использовал твой RPC
const customPolygon = {
  ...polygon,
  rpcUrls: {
    default: {
      http: [polygonRpcUrl],
    },
    public: {
      http: [polygonRpcUrl],
    },
  },
};

// 👇 Создаём конфиг wagmi + RainbowKit
const config = getDefaultConfig({
  appName: 'NRT Donate',
  projectId,
  chains: [customPolygon],
  transports: {
    [polygon.id]: http(polygonRpcUrl),
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <App />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </BrowserRouter>
  </React.StrictMode>
);
