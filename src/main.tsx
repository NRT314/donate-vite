import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './App.css';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const projectId = import.meta.env.VITE_PROJECT_ID;

if (!projectId) {
  throw new Error("VITE_PROJECT_ID is not defined in .env file. Please add it to proceed.");
}

const config = getDefaultConfig({
  appName: 'NRT Donate',
  projectId,
  chains: [polygon],
  transports: {
    [polygon.id]: http('https://polygon-rpc.com'),
  },
});

const queryClient = new QueryClient();

const basename = import.meta.env.PROD ? "/donate-vite/" : "/";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
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