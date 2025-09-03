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
} from 'wagmi';
import { polygon } from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from '@tanstack/react-query';

const projectId = import.meta.env.VITE_PROJECT_ID;
const polygonRpcUrl = import.meta.env.VITE_POLYGON_RPC_URL;

if (!projectId) {
  throw new Error("VITE_PROJECT_ID is not defined in .env file. Please add it to proceed.");
}

if (!polygonRpcUrl) {
  throw new Error("VITE_POLYGON_RPC_URL is not defined in .env file. Please add your RPC URL.");
}

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

// Создаём конфиг wagmi + RainbowKit
const config = getDefaultConfig({
  appName: 'NRT Donate',
  projectId,
  chains: [customPolygon],
  transports: {
    [polygon.id]: http(polygonRpcUrl),
  },
  ssr: false, // <-- ВОТ ВАЖНОЕ ИЗМЕНЕНИЕ
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