// src/App.js
import React, { useState, useMemo, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import translationData from './translation.json';
import { CONTRACT_ADDRESS, TOKENS, ORGS, ABI, ERC20_ABI, initialAmounts } from './constants';
import './App.css';

export default function App() {
    // --- STATE ---
    const [lang, setLang] = useState('en');
    const [donationAmounts, setDonationAmounts] = useState(initialAmounts);
    const [selectedTokenKey, setSelectedTokenKey] = useState('usdt');
    const [status, setStatus] = useState({ message: '', type: 'idle' });
    const [activeTxHash, setActiveTxHash] = useState(null);

    const t = translationData[lang];
    const selectedToken = TOKENS[selectedTokenKey];
    
    // --- WAGMI HOOKS ---
    const { address, isConnected, chain } = useAccount();
    const { switchChain } = useSwitchChain();
    const { data: hash, writeContractAsync } = useWriteContract();

    // --- DERIVED STATE ---
    const { totalAmount, recipients, amounts } = useMemo(() => {
        let total = 0;
        const recipients = [];
        const amounts = [];
        for (const orgAddress in donationAmounts) {
            const amount = parseFloat(donationAmounts[orgAddress]) || 0;
            if (amount > 0) {
                total += amount;
                recipients.push(orgAddress);
                amounts.push(parseUnits(donationAmounts[orgAddress], selectedToken.decimals));
            }
        }
        return { totalAmount: total, recipients, amounts };
    }, [donationAmounts, selectedToken.decimals]);

    const parsedTotalAmount = parseUnits(totalAmount.toString(), selectedToken.decimals);
    const isButtonDisabled = !isConnected || totalAmount === 0 || status.type === 'pending' || (chain && chain.id !== 137);

    // --- TRANSACTION LOGIC ---
    const handleDonateClick = async () => {
        if (isButtonDisabled) return;
        if (chain.id !== 137) {
            switchChain({ chainId: 137 });
            return;
        }

        try {
            // 1. Approve
            setStatus({ message: t.status_approving, type: 'pending' });
            const approveHash = await writeContractAsync({
                address: selectedToken.address,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [CONTRACT_ADDRESS, parsedTotalAmount],
            });
            setActiveTxHash(approveHash);

        } catch (error) {
            setStatus({ message: `${t.status_error} ${error.shortMessage || error.message}`, type: 'error' });
        }
    };

    // --- TRANSACTION RECEIPT HANDLING ---
    const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash: activeTxHash });

    useEffect(() => {
        if (isLoading) {
             setStatus(prev => ({ ...prev, type: 'pending' }));
        }
        if (isSuccess && activeTxHash) {
            // Успешно, теперь определяем, это был approve или donate
            if (status.message === t.status_approving) {
                 // Approve прошел, теперь делаем donate
                setStatus({ message: t.status_sending, type: 'pending' });
                writeContractAsync({
                    address: CONTRACT_ADDRESS,
                    abi: ABI,
                    functionName: 'donate',
                    args: [selectedToken.address, recipients, amounts],
                }).then(donateHash => {
                    setActiveTxHash(donateHash);
                }).catch(err => {
                     setStatus({ message: `${t.status_error} ${err.shortMessage || err.message}`, type: 'error' });
                });

            } else if (status.message === t.status_sending) {
                // Donate прошел!
                setStatus({ message: t.status_success, type: 'success' });
                setDonationAmounts(initialAmounts);
                setTimeout(() => setActiveTxHash(null), 5000); // Сбрасываем хэш
            }
        }
    }, [isLoading, isSuccess, activeTxHash]);


    // --- HANDLERS ---
    const handleAmountChange = (orgAddress, value) => {
        setDonationAmounts(prev => ({ ...prev, [orgAddress]: value }));
    };

    return (
        <div className="container">
            <header className="header">
                 <h1 className="title">{t.title}</h1>
                 <div className="controls">
                     <select className="select-lang" value={lang} onChange={e => setLang(e.target.value)}>
                         <option value="en">EN</option>
                         <option value="ru">RU</option>
                     </select>
                     <ConnectButton />
                 </div>
            </header>
            
            <main className="main-content">
                {/* ... остальная JSX-разметка из предыдущего ответа (карточки, таблица) остается такой же ... */}
                <div className="card">
                    <h2 className="card-title">{t.token_selection_title}</h2>
                    <div className="token-selector">
                        {Object.keys(TOKENS).map(key => (
                            <button
                                key={key}
                                className={`token-btn ${selectedTokenKey === key ? 'active' : ''}`}
                                onClick={() => setSelectedTokenKey(key)}
                            >
                                {TOKENS[key].symbol}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h2 className="card-title">{t.donations_title}</h2>
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
                                    <td>{translationData[lang].org_names[org.key]}</td>
                                    <td>
                                        <input
                                            type="number"
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
                        <tfoot>
                            <tr>
                                <td>{t.total_amount_text}</td>
                                <td className="total-amount">{totalAmount.toFixed(2)} {selectedToken.symbol}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="action-section">
                    <button
                        className="donate-btn"
                        onClick={handleDonateClick}
                        disabled={isButtonDisabled}
                    >
                        {chain && chain.id !== 137 ? t.switch_to_polygon : t.donate_button}
                    </button>
                    {status.message && (
                        <div className={`status-message ${status.type}`}>
                            <p>{status.message}</p>
                            {isLoading && <div className="spinner"></div>}
                            {status.type === 'success' && activeTxHash && (
                                <a href={`https://polygonscan.com/tx/${activeTxHash}`} target="_blank" rel="noopener noreferrer">View on Polygonscan</a>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}