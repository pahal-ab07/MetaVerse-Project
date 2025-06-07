import React, { useState, useEffect } from 'react';

function TransactionHistory({ address }) {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTransactions();
    }, [address]);

    const fetchTransactions = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/transactions/${address}`);
            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }
            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div>Loading transactions...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="transaction-history">
            <h3>Transaction History</h3>
            <div className="transactions-list">
                {transactions.map((tx) => (
                    <div key={tx._id} className="transaction-item">
                        <div className="transaction-type">{tx.type}</div>
                        <div className="transaction-details">
                            <p>From: {tx.from}</p>
                            <p>To: {tx.to}</p>
                            <p>Amount: {tx.amount} MVT</p>
                            <p>Time: {new Date(tx.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TransactionHistory;