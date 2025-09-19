# Complete Technical Documentation: NRT dApp

This document serves as a comprehensive technical guide to the NRT decentralized application. It is intended for developers to fully understand the project's architecture, deployment, core features, and file structure.

-----

## 1\. Architecture Overview

The project is a monorepo containing two primary components:

1.  **React Frontend**: The main decentralized application (dApp) for user interaction. It handles donations, DAO voting, and the authentication UI. This component is deployed on **Netlify**.
2.  **Node.js Backend**: A dedicated server whose sole purpose is to securely handle user authentication for the Discourse forum via the OpenID Connect (OIDC) protocol and crypto wallet signatures. This component is deployed on **Render**.

-----

## 2\. Getting Started

### 2.1. Prerequisites

  * **Node.js**: `v22.18.0` or a compatible `22.x` version.
  * **Yarn**: `v1.22.22`.
  * **Crypto Wallet**: MetaMask or another WalletConnect-compatible wallet.

### 2.2. Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/NRT314/donate-vite.git
    cd donate-vite
    ```
2.  Install frontend dependencies:
    ```bash
    yarn install
    ```
3.  Install backend dependencies:
    ```bash
    cd backend
    yarn install
    cd ..
    ```

### 2.3. Configuration

The project requires `.env` files for storing keys and environment variables. Create them based on the `.env.example` templates.

1.  **Frontend (`./.env` file)**:
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
    DISCOURSE_URL="..."      # The URL of your Discourse forum

    # Redis
    REDIS_URL="..."          # The connection URL for your Redis server

    # Server
    PORT=10000
    ```

### 2.4. Running Locally

1.  Start the backend server:
    ```bash
    cd backend
    yarn start
    ```
2.  In a new terminal window, start the frontend:
    ```bash
    yarn dev
    ```

-----

## 3\. Deployment

### 3.1. Frontend (Netlify)

The frontend is configured for continuous deployment from the `main` branch on GitHub.

  * **Build Command**: `yarn run build`
  * **Publish Directory**: `dist`
  * **Node.js Build Version**: `22.x`

### 3.2. Backend (Render)

The backend is deployed as a Web Service on Render, with auto-deploy enabled on commits to the main branch.

  * **Build Command**: `yarn install`
  * **Start Command**: `yarn start`
  * **Environment Variables**: Secrets from `backend/.env` must be securely added to the service settings on Render.

-----

## 4\. Core Features

  * **Donation System**: A two-step process (`approve` and `donate`) with on-chain recipient management via a secure admin panel.
  * **Governance & DAO System**: Features gasless voting where users sign an EIP-712 message, and a relayer submits the transaction. Data fetching is optimized to reduce blockchain queries.
  * **Discourse SSO & OIDC Authentication**: A hybrid authentication system allowing users to log in to a Discourse forum with a crypto wallet. The system is built on the OpenID Connect (OIDC) protocol, with the Node.js backend acting as the Identity Provider.

-----

## 5\. Smart Contracts

  * **Contract Addresses**: All deployed contract addresses are stored in `src/constants.js`.
  * **ABIs**: The JSON Application Binary Interfaces (ABIs) for all contracts are also located in `src/constants.js`.

-----

## 6\. Project Structure

Below is a description of key files and directories within the project.

### 6.1. Root Directory

  * **`package.json`**: Defines frontend project metadata, dependencies (`react`, `wagmi`, `viem`), and npm scripts.
  * **`index.html`**: The main HTML entry point for the single-page application.

### 6.2. `backend/`

  * **`server.js`**: The entry point for the backend Express server.
  * **`oidc.js`**: The core of the OIDC service, configuring the `oidc-provider` library and defining the custom wallet authentication logic.
  * **`walletAuth.js`**: A utility module to cryptographically verify signed messages.
  * **`redisAdapter.js`**: A custom adapter to store all OIDC session and grant data in a Redis database.

### 6.3. `src/`

  * **`main.tsx`**: The application's entry point, configuring `wagmi` and `RainbowKit`.
  * **`App.jsx`**: The central component that sets up React Router and manages global UI state.
  * **`constants.js`**: A central file for contract addresses, ABIs, and other static data.
  * **`organizations.js`**: A file that acts as the source of truth for the list of recipient organizations displayed in the UI.

### 6.4. `src/pages/`

  * **`DiscourseAuth.jsx`**: The dedicated UI page for the wallet authentication flow.
  * **`AdminPage.jsx`**: A secure, owner-only page that performs an on-chain check before rendering administrative components.
  * **`VotingPage.jsx`**: The main page for displaying the list of all governance proposals.
  * **`ProposalView.jsx`**: The detailed view for a single proposal, handling the gasless voting workflow.
