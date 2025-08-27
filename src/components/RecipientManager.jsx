// src/components/RecipientManager.jsx
import React, { useState } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { isAddress } from 'viem';
// 👇 ИСПРАВЛЕНИЕ ЗДЕСЬ: Импортируем ORGANIZATIONS из правильного файла
import { CONTRACT_ADDRESS, ABI } from '../constants';
import { ORGANIZATIONS } from '../organizations';

export default function RecipientManager({ t }) {
  const [newRecipient, setNewRecipient] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: hash, isPending, writeContract } = useWriteContract();

  // Читаем список адресов НАПРЯМУЮ ИЗ КОНТРАКТА
  const { data: recipients, refetch: refetchRecipients } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'getWhitelistedRecipients',
    watch: true,
  });
  
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => refetchRecipients(),
  });

  const handleAddRecipient = () => {
    setErrorMessage('');
    if (!isAddress(newRecipient)) {
      setErrorMessage('Пожалуйста, введите корректный Ethereum-адрес.');
      return;
    }
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'addRecipient',
      args: [newRecipient],
    });
    setNewRecipient('');
  };

  // --- Логика для обновления пресета ---
  const handleUpdateEqualPreset = async () => {
    console.log("Updating 'equal' preset...");

    const currentRecipients = ORGANIZATIONS.map(org => org.address);
    if (currentRecipients.length === 0) {
        alert("Список организаций в файле organizations.js пуст!");
        return;
    }

    const thisProjectOrg = ORGANIZATIONS.find(org => org.key === 'thisproject');
    if (!thisProjectOrg) {
        alert("Не удалось найти адрес для 'thisproject' в файле organizations.js");
        return;
    }

    const totalPercentage = 10000;
    const recipientCount = currentRecipients.length;
    const equalShare = Math.floor(totalPercentage / recipientCount);
    const remainder = totalPercentage % recipientCount;
    const percentages = currentRecipients.map(() => equalShare);
    const thisProjectIndex = currentRecipients.findIndex(addr => addr.toLowerCase() === thisProjectOrg.address.toLowerCase());

    if (thisProjectIndex !== -1) {
        percentages[thisProjectIndex] += remainder;
    } else {
        percentages[0] += remainder; 
    }

    writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'updatePreset',
        args: ['equal', currentRecipients, percentages],
    });
  };

  return (
    <div className="card">
      <h2 className="card__title">Управление Whitelist в контракте</h2>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <h3>Добавить адрес в контракт</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newRecipient}
            onChange={(e) => setNewRecipient(e.target.value)}
            placeholder="0x..."
            className="form-input"
            style={{ flexGrow: 1 }}
          />
          <button 
            onClick={handleAddRecipient} 
            disabled={isPending || isConfirming} 
            className="form-button"
          >
            {isPending ? 'Подпишите...' : isConfirming ? 'Добавление...' : 'Добавить'}
          </button>
        </div>
        {errorMessage && <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.5rem' }}>{errorMessage}</p>}
      </div>
      
      <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
        <h3>Управление пресетом "equal"</h3>
        <p style={{fontSize: '0.8rem', opacity: 0.7}}>
            Эта кнопка обновит пресет 'equal' в смарт-контракте, используя актуальный список организаций из файла `organizations.js`.
        </p>
        <button
            onClick={handleUpdateEqualPreset}
            disabled={isPending || isConfirming}
            className="form-button"
        >
            {isPending ? 'Подпишите...' : isConfirming ? 'Обновление...' : 'Обновить пресет "equal"'}
        </button>
      </div>

      <div>
        <h3>Текущий Whitelist в контракте ({recipients?.length || 0})</h3>
        <p style={{fontSize: '0.8rem', opacity: 0.7, marginTop: '-0.5rem'}}>
            Этот список показывает адреса, которые сейчас находятся в whitelist смарт-контракта.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto', background: '#f9f9f9', border: '1px solid #eee', borderRadius: '4px' }}>
          {recipients && recipients.map((addr) => (
            <li key={addr} style={{ fontFamily: 'monospace', padding: '0.25rem 0.5rem', borderBottom: '1px solid #eee' }}>
              {addr}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}