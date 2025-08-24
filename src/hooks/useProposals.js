// ---------------------------------------------------
// Файл: src/hooks/useProposals.js (ПОЛНОСТЬЮ ПЕРЕПИСАН)
// ---------------------------------------------------
import { useReadContract } from 'wagmi';
import { VOTING_CONTRACT_ADDRESS, VOTING_ABI } from '../constants';

const PROPOSALS_PER_PAGE = 10; // Количество голосований на одной странице

export default function useProposals(page = 1) {
  // Сначала получаем общее количество голосований
  const { data: proposalCount } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_ABI,
    functionName: 'proposalCount',
  });

  // Рассчитываем startId для пагинации
  const total = proposalCount ? Number(proposalCount) : 0;
  const startId = total - (page - 1) * PROPOSALS_PER_PAGE;

  // Запрашиваем "страницу" с голосованиями
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_ABI,
    functionName: 'getProposalsView',
    args: [
      startId > 0 ? BigInt(startId) : 0n, // startId
      BigInt(PROPOSALS_PER_PAGE),         // count
      true                               // reverse (новые сначала)
    ],
    query: {
      enabled: proposalCount !== undefined && startId > 0, // Выполняем запрос, только если есть что запрашивать
    },
  });

  if (isError) {
    console.error("Error fetching proposals:", error);
  }

  return {
    proposals: data || [],
    isLoading,
    totalProposals: total,
    proposalsPerPage: PROPOSALS_PER_PAGE,
    refetchProposals: refetch, // Функция для ручного обновления списка
  };
}


