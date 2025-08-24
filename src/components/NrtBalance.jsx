// src/components/NrtBalance.jsx
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';

// Импортируем ОБА адреса, но используем правильный
import { CONTRACT_ADDRESS, ERC20_ABI } from '../constants';

export default function NrtBalance({ t }) {
  const { address, isConnected } = useAccount();

  // Вызываем balanceOf из ОСНОВНОГО контракта донатов,
  // так как он же является и контрактом NRT-токена.
  const { data: balance, isLoading } = useReadContract({
    // 👇 ИЗМЕНЕНИЕ: Используем CONTRACT_ADDRESS вместо NRT_VOTING_TOKEN_ADDRESS
    address: CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: isConnected,
    },
  });

  if (!isConnected) {
    return null;
  }

  // NRT-токен имеет 18 знаков после запятой
  const formattedBalance = balance ? parseFloat(formatUnits(balance, 18)).toLocaleString('ru-RU') : '0';

  return (
    <div className="nrt-balance">
      {isLoading 
        ? `${t.nrt_balance_loading || 'Загрузка...'}`
        : `${t.nrt_balance_label || 'У вас'} ${formattedBalance} NRT`
      }
    </div>
  );
}