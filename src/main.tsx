// src/main.tsx (Final Corrected Version)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './App.css';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const projectId = import.meta.env.VITE_PROJECT_ID;

if (!projectId) {
  throw new Error("VITE_PROJECT_ID is not defined in .env file.");
}

const config = getDefaultConfig({
  appName: 'NRT dApp',
  projectId: projectId,
  chains: [polygon],
  ssr: false, 
});

const queryClient = new QueryClient();

// The exclamation mark tells TypeScript that this element will never be null.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);