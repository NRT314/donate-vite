// src/pages/AdminPage.jsx
import React, { useEffect } from 'react'; // Добавляем useEffect для логов
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, ABI } from '../constants';
import RecipientManager from '../components/RecipientManager';

export default function AdminPage({ t }) {
    const { address: userAddress, isConnected } = useAccount();
    
    // Получаем адрес владельца из контракта
    const { data: ownerAddress, isLoading, isError, error } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'owner',
    });

    // Используем useEffect для вывода отладочной информации в консоль
    useEffect(() => {
        console.log("--- AdminPage Status ---");
        console.log("Is Wallet Connected?", isConnected);
        if (isConnected) {
            console.log("User Address:", userAddress);
        }
        console.log("Is Loading Owner Address?", isLoading);
        console.log("Is Error fetching owner?", isError);
        if(isError) {
            console.error("Error details:", error);
        }
        console.log("Fetched Owner Address:", ownerAddress);
        console.log("------------------------");
    }, [isConnected, userAddress, isLoading, isError, ownerAddress, error]);

    // Обернем все возможные выводы в <main>, чтобы структура страницы сохранялась
    const renderContent = () => {
        if (!isConnected) {
            return <div className="card"><h2>Пожалуйста, подключите кошелек, чтобы получить доступ к этой странице.</h2></div>;
        }

        if (isLoading) {
            return <div className="card"><h2>Проверка доступа...</h2></div>;
        }

        // Явная проверка на ошибку при загрузке адреса владельца
        if (isError || !ownerAddress) {
             return (
                <div className="card">
                    <h2>❌ Ошибка загрузки данных</h2>
                    <p>Не удалось получить адрес владельца контракта. Проверьте подключение к сети и консоль на наличие ошибок.</p>
                </div>
            );
        }

        // Сравниваем адрес пользователя с адресом владельца
        if (userAddress?.toLowerCase() !== ownerAddress?.toLowerCase()) {
            return (
                <div className="card">
                    <h2>❌ Доступ запрещен</h2>
                    <p>Эта страница доступна только владельцу контракта.</p>
                </div>
            );
        }

        // Если все проверки пройдены, показываем панель управления
        return (
            <>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Панель администратора</h1>
                <RecipientManager t={t} />
            </>
        );
    };

    return (
        <main className="main-column">
            {renderContent()}
        </main>
    );
}