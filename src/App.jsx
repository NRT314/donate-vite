// src/App.jsx
import React, { useState, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAccount, useSwitchChain, useWriteContract, usePublicClient, useReadContract } from 'wagmi';
import { parseUnits, formatUnits, createPublicClient, http } from 'viem';
import { polygon } from 'wagmi/chains';

import translationData from './translation.json';
import { ORGANIZATIONS } from './organizations';
import { CONTRACT_ADDRESS, TOKENS, ABI, ERC20_ABI, PRESET_NAME } from './constants';
import './App.css';

import Header from './components/Header';
import Footer from './components/Footer';
import Faq from './components/Faq';
import ContactForm from './components/ContactForm';
import ContractDetails from './components/ContractDetails';
import CollapsibleCard from './components/CollapsibleCard';
import VotingPage from './pages/VotingPage';
import ProposalView from './pages/ProposalView';
import AdminPage from './pages/AdminPage';
import DiscourseAuth from './pages/DiscourseAuth';

const initialAmounts = ORGANIZATIONS.reduce((acc, org) => {
    acc[org.address] = '';
    return acc;
}, {});


// --- MAINVIEW COMPONENT ---
const MainView = ({ t, lang, navigate, ...props }) => {
    const { data: totalDonated, isLoading: isLoadingTotal, isError } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'totalDonatedOverallInUsdt',
        watch: true,
    });

    let totalDisplayContent;
    if (isLoadingTotal) {
        totalDisplayContent = t.loading_text;
    } else if (isError || totalDonated === undefined) {
        totalDisplayContent = '$0.00 USD';
    } else {
        const formattedAmount = parseFloat(formatUnits(totalDonated, 6)).toFixed(2);
        totalDisplayContent = `$${formattedAmount} USD`;
    }

    return (
        <div className="app-grid">
            <aside className="sidebar sidebar-left">
                <div className="sidebar-card">
                    <h2 className="sidebar-card__title">{t.total_raised_title}</h2>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a', textAlign: 'center' }}>
                        {totalDisplayContent}
                    </p>
                </div>

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
                    onClick={() => navigate('/contract-details')}
                    style={{ cursor: 'pointer' }}
                >
                    <h2 className="sidebar-card__title">{t.how_contract_works_title}</h2>
                </div>
                <Faq t={t} />
            </aside>
            <main className="main-column">
                <div className="card card--center-text">
                    <h2 className="card__title">{t.token_selection_title}</h2>
                    <div className="button-group">
                        {Object.keys(TOKENS).map(key => (
                            <button key={key} className={`button ${props.selectedTokenKey === key ? 'active' : ''}`} onClick={() => props.setSelectedTokenKey(key)}>
                                {TOKENS[key].symbol}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="card card--center-text">
                    <h2 className="card__title">{t.donation_type_title}</h2>
                    <div className="button-group">
                        <button className={`button ${props.donationType === 'custom' ? 'active' : ''}`} onClick={() => props.setDonationType('custom')}>{t.custom_button}</button>
                        <button className={`button ${props.donationType === 'preset' ? 'active' : ''}`} onClick={() => props.setDonationType('preset')}>{t.preset_button}</button>
                    </div>
                </div>
                {props.donationType === 'custom' ? (
                    <div className="card">
                        <h2 className="card__title">{t.donations_title}</h2>
                        <table className="donation-table">
                            <thead>
                                <tr>
                                    <th>{t.org_header}</th>
                                    <th>{t.amount_header} ({props.selectedToken.symbol})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ORGANIZATIONS.map(org => (
                                    <tr key={org.address}>
                                        <td><a href={org.link} target="_blank" rel="noopener noreferrer">{lang === 'ru' ? org.name_ru : org.name_en}</a></td>
                                        <td>
                                            <input type="text" inputMode="decimal" value={props.donationAmounts[org.address]} onChange={e => props.handleAmountChange(org.address, e.target.value)} placeholder="0.00" className="amount-input" disabled={props.status.type === 'pending'} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="total-row">
                            <span>{t.total_amount_text}</span>
                            <span>{props.totalAmount.toFixed(2)} {props.selectedToken.symbol}</span>
                        </div>
                    </div>
                ) : (
                    <div className="card card--center-text">
                        <h2 className="card__title">{t.preset_donations_title}</h2>
                        <p className="preset-description">{t.preset_description.replace('{count}', ORGANIZATIONS.length)}</p>
                        <div className="preset-input-container">
                            <input type="text" inputMode="decimal" value={props.presetAmount} onChange={e => props.handlePresetAmountChange(e.target.value)} placeholder="0.00" className="amount-input preset-input" disabled={props.status.type === 'pending'} />
                            <span className="token-symbol">{props.selectedToken.symbol}</span>
                        </div>
                    </div>
                )}
                <div className="card card--center-text">
                    <h2 className="card__title">{t.nrt_title}</h2>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4b5563' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#2563eb' }}>{props.totalAmount.toFixed(2)}</span> NRT
                    </p>
                </div>
                <div className="action-section">
                    <button className="button button--primary" onClick={props.handleDonateClick} disabled={props.isButtonDisabled}>
                        {props.chain && props.chain.id !== 137 ? t.switch_to_polygon : t.donate_button}
                    </button>
                    {props.status.message && (
                        <div className="status-message">
                            <p>{props.status.message}</p>
                            {props.status.type === 'pending' && <div className="spinner"></div>}
                            {props.status.type === 'success' && props.status.hash && (
                                <a href={`https://polygonscan.com/tx/${props.status.hash}`} target="_blank" rel="noopener noreferrer">View on Polygonscan</a>
                            )}
                        </div>
                    )}
                </div>
            </main>
            <aside className="sidebar sidebar-right">
                <div
                    className="sidebar-card sidebar-link-section"
                    onClick={() => navigate('/voting')}
                    style={{ cursor: 'pointer' }}
                >
                    <h2 className="sidebar-card__title">{t.use_nrt_for_voting}</h2>
                </div>

                {/* <<-- НАЧАЛО ИЗМЕНЕНИЙ -->> */}
                <a
                    href="https://forum.newrussia.online/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-card sidebar-link-section"
                >
                    <h2 className="sidebar-card__title">{t.our_forum_title}</h2>
                </a>

                <a
                    href="https://forum.newrussia.online/auth/oidc"
                    className="sidebar-card sidebar-link-section"
                >
                    <h2 className="sidebar-card__title">Log in to the forum</h2>
                </a>
                {/* <<-- КОНЕЦ ИЗМЕНЕНИЙ -->> */}

                <ContactForm t={t} />
            </aside>
        </div>
    );
}


// --- MAIN APP COMPONENT ---
export default function App() {
    const [lang, setLang] = useState('en');
    const [donationType, setDonationType] = useState('custom');
    const [selectedTokenKey, setSelectedTokenKey] = useState('usdt');
    const [donationAmounts, setDonationAmounts] = useState(initialAmounts);
    const [presetAmount, setPresetAmount] = useState('0');
    const [status, setStatus] = useState({ message: '', type: 'idle', hash: null });

    const t = translationData[lang];
    const navigate = useNavigate();
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

    const handleDonateClick = async () => {
        if (isButtonDisabled) return;
        if (chain && chain.id !== 137) {
            switchChain({ chainId: 137 });
            return;
        }

        try {
            setStatus({ message: t.status_approving, type: 'pending', hash: null });
            const approveHash = await writeContractAsync({
                address: selectedToken.address,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [CONTRACT_ADDRESS, parsedTotalAmount],
            });

            await waitWithFallback(approveHash);

            setStatus({ message: t.status_sending, type: 'pending', hash: null });
            const donateArgs = donationType === 'custom'
                ? { functionName: 'donate', args: [selectedToken.address, recipients, amounts] }
                : { functionName: 'donatePreset', args: [PRESET_NAME, selectedToken.address, parsedTotalAmount] };

            const donateHash = await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                ...donateArgs,
            });

            await waitWithFallback(donateHash);

            setStatus({ message: t.status_success, type: 'success', hash: donateHash });
            setDonationAmounts(initialAmounts);
            setPresetAmount('0');
            setTimeout(() => {
                setStatus({ message: '', type: 'idle', hash: null });
            }, 8000);
        } catch (error) {
            console.error("Donate flow error:", error);
            setStatus({ message: `${t.status_error} ${error.shortMessage || error.message}`, type: 'error', hash: null });
        }
    };

    const waitWithFallback = async (hash) => {
        const fallbackClient = createPublicClient({
            chain: polygon,
            transport: http("https://polygon-rpc.com"),
        });

        let lastError;
        for (let i = 0; i < 5; i++) {
            try {
                return await publicClient.waitForTransactionReceipt({ hash });
            } catch (e) {
                lastError = e;
                try {
                    return await fallbackClient.waitForTransactionReceipt({ hash });
                } catch (_) {
                    await new Promise(res => setTimeout(res, 4000));
                }
            }
        }
        throw lastError;
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
            
            <Routes>
                <Route
                    path="/"
                    element={
                        <MainView
                            t={t}
                            lang={lang}
                            navigate={navigate}
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
                    }
                />
                <Route
                    path="/voting"
                    element={<VotingPage t={t} onBack={() => navigate('/')} />}
                />
                <Route
                    path="/voting/:proposalId"
                    element={<ProposalView t={t} />}
                />
                <Route
                    path="/contract-details"
                    element={<ContractDetails t={t} onBack={() => navigate('/')} />}
                />
                <Route
                    path="/admin"
                    element={<AdminPage t={t} />}
                />
                <Route
                    path="/discourse-auth"
                    element={<DiscourseAuth t={t} />}
                />
            </Routes>
            <Footer t={t} />
        </div>
    );
}