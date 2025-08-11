// src/App.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAccount, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// Importing our files and components
import translationData from './translation.json';
import { CONTRACT_ADDRESS, TOKENS, ORGS, ABI, ERC20_ABI, initialAmounts, PRESET_NAME } from './constants';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import InfoCard from './components/InfoCard';
import Faq from './components/Faq';
import About from './components/About';
import ContactForm from './components/ContactForm';
import ContractDetails from './components/ContractDetails';
import Plans from './components/Plans';

// Main App Component
export default function App() {
    const [currentPage, setCurrentPage] = useState('main');
    const [lang, setLang] = useState('en');
    const [donationType, setDonationType] = useState('custom');
    const [selectedTokenKey, setSelectedTokenKey] = useState('usdt');
    const [donationAmounts, setDonationAmounts] = useState(initialAmounts);
    const [presetAmount, setPresetAmount] = useState('0');
    const [status, setStatus] = useState({ message: '', type: 'idle' });
    const [activeTxHash, setActiveTxHash] = useState(null);
    const [transactionStage, setTransactionStage] = useState('idle');

    const t = translationData[lang];
    const selectedToken = TOKENS[selectedTokenKey];
    
    const { isConnected, chain } = useAccount();
    const { switchChain } = useSwitchChain();
    const { writeContractAsync } = useWriteContract();

    const { totalAmount, recipients, amounts } = useMemo(() => {
        // ... (this logic remains the same)
    }, [donationAmounts, presetAmount, donationType, selectedToken.decimals]);

    const parsedTotalAmount = parseUnits(totalAmount.toString(), selectedToken.decimals);
    const isButtonDisabled = !isConnected || totalAmount === 0 || status.type === 'pending' || (chain && chain.id !== 137);

    const handleDonateClick = async () => { /* ... (this logic remains the same) */ };
    const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash: activeTxHash });
    useEffect(() => { /* ... (this logic remains the same) */ }, [isSuccess, activeTxHash]);
    const handleAmountChange = (orgAddress, value) => { /* ... (this logic remains the same) */ };

    const MainView = () => (
        <div className="app-grid">
            <aside className="sidebar">
                <About t={t} />
                <div 
                  className="sidebar-card sidebar-link-section"
                  onClick={() => setCurrentPage('contract-details')}
                  style={{cursor: 'pointer'}}
                >
                    <h2 className="sidebar-card__title">
                        {t.how_contract_works_title}
                    </h2>
                </div>
                <Faq t={t} />
            </aside>

            <main className="main-column">
                
                <div className="card">
                    <h2 className="card__title">{t.token_selection_title}</h2>
                    {/* ... token selection buttons ... */}
                </div>

                <div className="card">
                    <h2 className="card__title">{t.donation_type_title}</h2>
                    {/* ... donation type buttons ... */}
                </div>
                
                {donationType === 'custom' ? (
                    <div className="card">
                        <h2 className="card__title">{t.donations_title}</h2>
                        <table className="donation-table">
                            <thead>
                                <tr>
                                    <th>{t.org_header}</th>
                                    <th>{t.amount_header} ({selectedToken.symbol})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ORGS.map(org => (
                                    <tr key={org.address}>
                                        <td><a href={org.link} target="_blank" rel="noopener noreferrer">{t.org_names[org.key]}</a></td>
                                        <td>
                                            <input
                                                type="number"
                                                inputMode="decimal"  // <<<--- ИЗМЕНЕНИЕ ЗДЕСЬ
                                                min="0"
                                                step="0.01"
                                                value={donationAmounts[org.address]}
                                                onChange={e => handleAmountChange(org.address, e.target.value)}
                                                placeholder="0.00"
                                                className="amount-input"
                                                disabled={status.type === 'pending'}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="total-row">
                            <span>{t.total_amount_text}</span>
                            <span>{totalAmount.toFixed(2)} {selectedToken.symbol}</span>
                        </div>
                    </div>
                ) : (
                    <div className="card">
                        <h2 className="card__title">{t.preset_donations_title}</h2>
                        <p className="preset-description">{t.preset_description.replace('{count}', ORGS.length)}</p>
                        <div className="preset-input-container">
                                <input
                                type="number"
                                inputMode="decimal" // <<<--- И ИЗМЕНЕНИЕ ЗДЕСЬ
                                min="0"
                                step="0.01"
                                value={presetAmount}
                                onChange={e => setPresetAmount(e.target.value)}
                                placeholder="0.00"
                                className="amount-input preset-input"
                                disabled={status.type === 'pending'}
                            />
                            <span className="token-symbol">{selectedToken.symbol}</span>
                        </div>
                    </div>
                )}
                
                <div className="card card--center-text">
                    <h2 className="card__title">{t.nrt_title}</h2>
                    <p style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#4b5563'}}>
                        <span style={{fontSize: '1.5rem', fontWeight: '800', color: '#2563eb'}}>{totalAmount.toFixed(2)}</span> NRT
                    </p>
                </div>

                <div className="action-section">
                    <button
                        className="button button--primary"
                        onClick={handleDonateClick}
                        disabled={isButtonDisabled}
                    >
                        {chain && chain.id !== 137 ? t.switch_to_polygon : t.donate_button}
                    </button>
                    {status.message && (
                        <div className="status-message">
                            <p>{status.message}</p>
                            {(isLoading || (status.type === 'pending' && status.message !== t.status_success)) && <div className="spinner"></div>}
                            {isSuccess && status.type === 'success' && activeTxHash && (
                                <a href={`https://polygonscan.com/tx/${activeTxHash}`} target="_blank" rel="noopener noreferrer">View on Polygonscan</a>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <aside className="sidebar">
                <InfoCard title={t.voting_title} content={`${t.voting_link_text} ${t.voting_content}`} />
                <Plans t={t} />
                <InfoCard title={t.discussions_title} content={t.discussions_content} />
                <ContactForm t={t} />
            </aside>
        </div>
    );

    return (
        <div className="app-container">
            <Header t={t} lang={lang} setLang={setLang} />
            {currentPage === 'main' ? (
                <MainView />
            ) : (
                <ContractDetails t={t} onBack={() => setCurrentPage('main')} />
            )}
            <Footer t={t} />
        </div>
    );
}