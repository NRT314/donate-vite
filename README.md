# Complete Technical Documentation: NRT dApp

[cite_start]This document serves as a comprehensive technical guide to the NRT decentralized application[cite: 2]. [cite_start]It is intended for developers to fully understand the project's architecture, deployment, core features, and file structure[cite: 3].

## 1. Architecture Overview

[cite_start]The project is a monorepo containing two primary components[cite: 4]:

1.  [cite_start]**React Frontend**: The main decentralized application (dApp) for user interaction[cite: 4]. [cite_start]It handles donations, DAO voting, and the authentication UI[cite: 5]. [cite_start]This component is deployed on **Netlify**[cite: 5].
2.  [cite_start]**Node.js Backend**: A dedicated server whose sole purpose is to securely handle user authentication for the Discourse forum via the OpenID Connect (OIDC) protocol and crypto wallet signatures[cite: 6]. [cite_start]This component is deployed on **Render**[cite: 7].

## 2. Getting Started

### 2.1. Prerequisites

* [cite_start]**Node.js**: `v22.18.0` or a compatible `22.x` version[cite: 8].
* [cite_start]**Yarn**: `v1.22.22`[cite: 8].
* [cite_start]**Crypto Wallet**: MetaMask or another WalletConnect-compatible wallet[cite: 9].

### 2.2. Installation

1.  [cite_start]Clone the repository[cite: 10]:
    ```bash
    git clone [https://github.com/NRT314/donate-vite.git](https://github.com/NRT314/donate-vite.git)
    cd donate-vite
    ```
2.  [cite_start]Install frontend dependencies[cite: 10]:
    ```bash
    yarn install
    ```
3.  [cite_start]Install backend dependencies[cite: 10]:
    ```bash
    cd backend
    yarn install
    cd ..
    ```

### 2.3. Configuration

The project requires `.env` files for storing keys and environment variables. [cite_start]Create them based on the `.env.example` templates[cite: 11].

1.  [cite_start]**Frontend (`./.env` file)**[cite: 12]:
    ```
    VITE_PROJECT_ID="..."      # Your Project ID from WalletConnect
    VITE_POLYGON_RPC_URL="..." # Your private Polygon RPC URL
    VITE_API_URL="http://localhost:10000" # The backend server URL for local development
    ```
2.  **Backend (`./backend/.env` file)**:
    ```
    # OIDC Provider
    OIDC_ISSUER="http://localhost:10000"
    OIDC_CLIENT_SECRET="..." # The secret generated for the OIDC client in Discourse
    OIDC_COOKIE_SECRET="..." # A random string for signing cookies

    # Discourse
    [cite_start]DISCOURSE_URL="..."      # The URL of your Discourse forum [cite: 13]

    # Redis
    [cite_start]REDIS_URL="..."          # The connection URL for your Redis server [cite: 13]

    # Server
    PORT=10000
    ```

### 2.4. Running Locally

1.  [cite_start]Start the backend server[cite: 14]:
    ```bash
    cd backend
    yarn start
    ```
2.  [cite_start]In a new terminal window, start the frontend[cite: 14]:
    ```bash
    yarn dev
    ```

## 3. Deployment

### 3.1. Frontend (Netlify)

[cite_start]The frontend is configured for continuous deployment from the `main` branch on GitHub[cite: 15, 16].
* [cite_start]**Build Command**: `yarn run build` [cite: 16]
* [cite_start]**Publish Directory**: `dist` [cite: 16]
* [cite_start]**Node.js Build Version**: `22.x` [cite: 16]

### 3.2. Backend (Render)

[cite_start]The backend is deployed as a Web Service on Render, with auto-deploy enabled on commits to the main branch[cite: 17, 18].
* [cite_start]**Build Command**: `yarn install` [cite: 19]
* [cite_start]**Start Command**: `yarn start` [cite: 19]
* [cite_start]**Environment Variables**: Secrets from `backend/.env` must be securely added to the service settings on Render[cite: 19].

## 4. Core Features

* [cite_start]**Donation System**: A two-step process (`approve` and `donate`) with on-chain recipient management via a secure admin panel[cite: 20, 22].
* [cite_start]**Governance & DAO System**: Features gasless voting where users sign an EIP-712 message, and a relayer submits the transaction[cite: 24, 25]. [cite_start]Data fetching is optimized to reduce blockchain queries[cite: 26].
* [cite_start]**Discourse SSO & OIDC Authentication**: A hybrid authentication system allowing users to log in to a Discourse forum with a crypto wallet[cite: 29]. [cite_start]The system is built on the OpenID Connect (OIDC) protocol, with the Node.js backend acting as the Identity Provider[cite: 30, 32].

## 5. Smart Contracts

* [cite_start]**Contract Addresses**: All deployed contract addresses are stored in `src/constants.js`[cite: 41].
* [cite_start]**ABIs**: The JSON Application Binary Interfaces (ABIs) for all contracts are also located in `src/constants.js`[cite: 42].

## 6. Project Structure

Below is a description of key files and directories within the project.

### 6.1. Root Directory

* [cite_start]**`package.json`**: Defines frontend project metadata, dependencies (`react`, `wagmi`, `viem`), and npm scripts[cite: 46].
* [cite_start]**`index.html`**: The main HTML entry point for the single-page application[cite: 45].

### 6.2. `backend/`

* [cite_start]**`server.js`**: The entry point for the backend Express server[cite: 49].
* [cite_start]**`oidc.js`**: The core of the OIDC service, configuring the `oidc-provider` library and defining the custom wallet authentication logic[cite: 50].
* [cite_start]**`walletAuth.js`**: A utility module to cryptographically verify signed messages[cite: 51].
* [cite_start]**`redisAdapter.js`**: A custom adapter to store all OIDC session and grant data in a Redis database[cite: 52].

### 6.3. `src/`

* [cite_start]**`main.tsx`**: The application's entry point, configuring `wagmi` and `RainbowKit`[cite: 57].
* [cite_start]**`App.jsx`**: The central component that sets up React Router and manages global UI state[cite: 58].
* [cite_start]**`constants.js`**: A central file for contract addresses, ABIs, and other static data[cite: 59].
* [cite_start]**`organizations.js`**: A file that acts as the source of truth for the list of recipient organizations displayed in the UI[cite: 21, 60].

### 6.4. `src/pages/`

* [cite_start]**`DiscourseAuth.jsx`**: The dedicated UI page for the wallet authentication flow[cite: 62].
* [cite_start]**`AdminPage.jsx`**: A secure, owner-only page that performs an on-chain check before rendering administrative components[cite: 64].
* [cite_start]**`VotingPage.jsx`**: The main page for displaying the list of all governance proposals[cite: 65].
* [cite_start]**`ProposalView.jsx`**: The detailed view for a single proposal, handling the gasless voting workflow[cite: 66].
