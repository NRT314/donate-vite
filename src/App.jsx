// src/App.jsx
import React, { useState, useMemo } from 'react';
import { useAccount, useSwitchChain, useWriteContract, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import translationData from './translation.json';
import { CONTRACT_ADDRESS, TOKENS, ORGS, ABI, ERC20_ABI, initialAmounts, PRESET_NAME } from './constants';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Faq from './components/Faq';
import ContactForm from './components/ContactForm';
import ContractDetails from './components/ContractDetails';
import CollapsibleCard from './components/CollapsibleCard';

// --- STABLE MAINVIEW COMPONENT ---
// This component is defined outside of App to prevent re-renders that cause input fields to lose focus.
const MainView = ({
    t, setCurrentPage, selectedTokenKey, setSelectedTokenKey, donationType,
    setDonationType, donationAmounts, handleAmountChange, totalAmount,
    selectedToken, presetAmount, handlePresetAmountChange, isButtonDisabled,
    handleDonateClick, status,
    chain
}) => (
    <div className="app-grid">
        <aside className="sidebar sidebar-left">
            <CollapsibleCard title={t.about_title}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
                    <div>
                        <h3 style={{ fontWeight: '600' }}>{t.about_section_idea_title}</h3>
                        <p dangerouslySetInnerHTML={{ __html: t.about_section_idea_text }}></p>
                    </div>
                    <div>
                        <h3 style={{ fontWeight: '600' }}>{t.about_section_why_polygon_title}</h3>
                        <p dangerouslySetInnerHTML={{ __html: t.about_section_why_polygon_text }}></p>
                    </div>
                    <div>
                        <h3 style={{ fontWeight: '600' }}>{t.about_section_what_is_nrt_title}</h3>
                        <p dangerouslySetInnerHTML={{ __html: t.about_section_what_is_nrt_text }}></p>
                    </div>
                </div>
            </CollapsibleCard>

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
            <div className="card card--center-text">
                <h2 className="card__title">{t.token_selection_title}</h2>
                <div className="button-group">
                    {Object.keys(TOKENS).map(key => (
                        <button key={key} className={`button ${selectedTokenKey === key ? 'active' : ''}`} onClick={() => setSelectedTokenKey(key)}>
                            {TOKENS[key].symbol}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card card--center-text">
                <h2 className="card__title">{t.donation_type_title}</h2>
                <div className="button-group">
                    <button className={`button ${donationType === 'custom' ? 'active' : ''}`} onClick={() => setDonationType('custom')}>{t.custom_button}</button>
                    <button className={`button ${donationType === 'preset' ? 'active' : ''}`} onClick={() => setDonationType('preset')}>{t.preset_button}</button>
                </div>
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
                                            type="text"
                                            inputMode="decimal"
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
                <div className="card card--center-text">
                    <h2 className="card__title">{t.preset_donations_title}</h2>
                    <p className="preset-description">{t.preset_description.replace('{count}', ORGS.length)}</p>
                    <div className="preset-input-container">
                            <input
                            type="text"
                            inputMode="decimal"
                            value={presetAmount}
                            onChange={e => handlePresetAmountChange(e.target.value)}
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
                        {status.type === 'pending' && <div className="spinner"></div>}
                        {status.type === 'success' && status.hash && (
                            <a href={`https://polygonscan.com/tx/${status.hash}`} target="_blank" rel="noopener noreferrer">View on Polygonscan</a>
                        )}
                    </div>
                )}
            </div>
        </main>

        <aside className="sidebar sidebar-right">
            <CollapsibleCard title={t.voting_title}>
                <p dangerouslySetInnerHTML={{ __html: `${t.voting_link_text} ${t.voting_content}` }}></p>
            </CollapsibleCard>

            <CollapsibleCard title={t.plans_title}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
                    <div>
                        <h3 style={{ fontWeight: '600' }}>{t.plans_section_short_term_title}</h3>
                        <p dangerouslySetInnerHTML={{ __html: t.plans_section_short_term_text }}></p>
                    </div>
                    <div>
                        <h3 style={{ fontWeight: '600' }}>{t.plans_section_global_title}</h3>
                        <p dangerouslySetInnerHTML={{ __html: t.plans_section_global_text }}></p>
                    </div>
                </div>
            </CollapsibleCard>

            <CollapsibleCard title={t.discussions_title}>
                <p dangerouslySetInnerHTML={{ __html: t.discussions_content }}></p>
            </CollapsibleCard>
            
            <ContactForm t={t} />
        </aside>
    </div>
);


// --- MAIN APP COMPONENT ---
export default function App() {
    const [currentPage, setCurrentPage] = useState('main');
    const [lang, setLang] = useState('en');
    const [donationType, setDonationType] = useState('custom');
    const [selectedTokenKey, setSelectedTokenKey] = useState('usdt');
    const [donationAmounts, setDonationAmounts] = useState(initialAmounts);
    const [presetAmount, setPresetAmount] = useState('0');
    const [status, setStatus] = useState({ message: '', type: 'idle', hash: null });

    const t = translationData[lang];
    const selectedToken = TOKENS[selectedTokenKey];
    
    const { isConnected, chain } = useAccount();
    const { switchChain } = useSwitchChain();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();

    const { totalAmount, recipients, amounts } = useMemo(() => {
        if (donationType === 'preset') {
            const total = parseFloat(presetAmount) || 0;
            return { totalAmount: total, recipients: [], amounts: [] };
        }
        let total = 0;
        const rec = [];
        const amnts = [];
        for (const orgAddress in donationAmounts) {
            const amount = parseFloat(donationAmounts[orgAddress]) || 0;
            if (amount > 0) {
                total += amount;
                rec.push(orgAddress);
                amnts.push(parseUnits(String(donationAmounts[orgAddress]), selectedToken.decimals));
            }
        }
        return { totalAmount: total, recipients: rec, amounts: amnts };
    }, [donationAmounts, presetAmount, donationType, selectedToken.decimals]);

    const parsedTotalAmount = parseUnits(String(totalAmount), selectedToken.decimals);
    const isButtonDisabled = !isConnected || totalAmount === 0 || status.type === 'pending' || (chain && chain.id !== 137);

    // 🔹 Новый donate flow — полностью линейный
    const handleDonateClick = async () => {
        if (isButtonDisabled) return;
        if (chain && chain.id !== 137) {
            switchChain({ chainId: 137 });
            return;
        }

        try {
            // 1. Approve
            setStatus({ message: t.status_approving, type: 'pending', hash: null });
            const approveHash = await writeContractAsync({
                address: selectedToken.address,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [CONTRACT_ADDRESS, parsedTotalAmount],
            });

            await publicClient.waitForTransactionReceipt({ hash: approveHash });

            // 2. Donate
            setStatus({ message: t.status_sending, type: 'pending', hash: null });

            const donateArgs = donationType === 'custom'
                ? { functionName: 'donate', args: [selectedToken.address, recipients, amounts] }
                : { functionName: 'donatePreset', args: [PRESET_NAME, selectedToken.address, parsedTotalAmount] };

            const donateHash = await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                ...donateArgs,
            });

            await publicClient.waitForTransactionReceipt({ hash: donateHash });

            // 3. Success
            setStatus({ message: t.status_success, type: 'success', hash: donateHash });
            setDonationAmounts(initialAmounts);
            setPresetAmount('0');

            // Сбрасываем сообщение через 8 секунд
            setTimeout(() => {
                setStatus({ message: '', type: 'idle', hash: null });
            }, 8000);

        } catch (error) {
            console.error("Donate flow error:", error);
            setStatus({ message: `${t.status_error} ${error.shortMessage || error.message}`, type: 'error', hash: null });
        }
    };

    const handleAmountChange = (orgAddress, value) => {
        let sanitizedValue = value.replace(',', '.').replace(/[^0-9.]/g, '');
        const parts = sanitizedValue.split('.');
        if (parts.length > 2) {
            sanitizedValue = parts[0] + '.' + parts.slice(1).join('');
        }
        setDonationAmounts(prev => ({ ...prev, [orgAddress]: sanitizedValue }));
    };

    const handlePresetAmountChange = (value) => {
        let sanitizedValue = value.replace(',', '.').replace(/[^0-9.]/g, '');
        const parts = sanitizedValue.split('.');
        if (parts.length > 2) {
            sanitizedValue = parts[0] + '.' + parts.slice(1).join('');
        }
        setPresetAmount(sanitizedValue);
    };

    return (
        <div className="app-container">
            <Header t={t} lang={lang} setLang={setLang} />
            
            {currentPage === 'main' ? (
                <MainView 
                    t={t}
                    setCurrentPage={setCurrentPage}
                    selectedTokenKey={selectedTokenKey}
                    setSelectedTokenKey={setSelectedTokenKey}
                    donationType={donationType}
                    setDonationType={setDonationType}
                    donationAmounts={donationAmounts}
                    handleAmountChange={handleAmountChange}
                    totalAmount={totalAmount}
                    selectedToken={selectedToken}
                    presetAmount={presetAmount}
                    handlePresetAmountChange={handlePresetAmountChange}
                    isButtonDisabled={isButtonDisabled}
                    handleDonateClick={handleDonateClick}
                    status={status}
                    chain={chain}
                />
            ) : (
                <ContractDetails t={t} onBack={() => setCurrentPage('main')} />
            )}

            <Footer t={t} />
        </div>
    );
}
