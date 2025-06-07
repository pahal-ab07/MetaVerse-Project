import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { TOKEN_ADDRESS, TOKEN_ABI } from '../contracts/token';
import UserRegistration from './UserRegistration';
import TransactionHistory from './TransactionHistory';

function TokenInterface({ onUserRegistration }) {
    const [account, setAccount] = useState('');
    const [balance, setBalance] = useState('0');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Check if user exists in database
    const checkUser = async (address) => {
        try {
            const response = await fetch(`http://localhost:5000/api/users/${address}`);
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                onUserRegistration(userData);
            }
        } catch (error) {
            console.error("Error checking user:", error);
        }
    };

    // Connect wallet
    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                setAccount(accounts[0]);
                checkIfOwner(accounts[0]);
                getBalance(accounts[0]);
                checkUser(accounts[0]);
            } catch (error) {
                console.error("Error connecting wallet:", error);
            }
        } else {
            alert("Please install MetaMask!");
        }
    };

    // Handle user registration
    const handleRegister = (userData) => {
        setUser(userData);
        onUserRegistration(userData);
    };

    // Check if current account is owner
    const checkIfOwner = async (address) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
            const owner = await contract.owner();
            setIsOwner(owner.toLowerCase() === address.toLowerCase());
        } catch (error) {
            console.error("Error checking owner:", error);
            setIsOwner(false);
        }
    };

    // Get token balance
    const getBalance = async (address) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
            const balance = await contract.balanceOf(address);
            setBalance(ethers.utils.formatEther(balance));
        } catch (error) {
            console.error("Error getting balance:", error);
            setBalance('0');
        }
    };

    // Transfer tokens
    const transferTokens = async () => {
        if (!recipient || !amount) return;
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
            
            const tx = await contract.transfer(
                recipient,
                ethers.utils.parseEther(amount)
            );
            await tx.wait();
            
            // Record transaction
            await fetch('http://localhost:5000/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: account,
                    to: recipient,
                    amount: amount,
                    type: 'TRANSFER'
                }),
            });
            
            getBalance(account);
            alert("Transfer successful!");
        } catch (error) {
            console.error("Error transferring tokens:", error);
            alert("Transfer failed!");
        }
    };

    // Mint new tokens (only owner)
    const mintTokens = async () => {
        if (!amount) return;
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
            
            const tx = await contract.mint(
                account,
                ethers.utils.parseEther(amount)
            );
            await tx.wait();
            
            // Record transaction
            await fetch('http://localhost:5000/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: '0x0000000000000000000000000000000000000000', // Zero address for minting
                    to: account,
                    amount: amount,
                    type: 'MINT'
                }),
            });
            
            getBalance(account);
            alert("Minting successful!");
        } catch (error) {
            console.error("Error minting tokens:", error);
            alert("Minting failed!");
        }
    };

    return (
        <div className="token-interface">
            <h2>MetaVerse Token Interface</h2>
            
            {!account ? (
                <button onClick={connectWallet}>Connect Wallet</button>
            ) : (
                <div>
                    <p>Connected Account: {account}</p>
                    <p>Token Balance: {balance} MVT</p>
                    
                    {!user ? (
                        <UserRegistration 
                            address={account} 
                            onRegister={handleRegister}
                        />
                    ) : (
                        <>
                            <p>Welcome, {user.username}!</p>
                            <div className="transfer-section">
                                <h3>Transfer Tokens</h3>
                                <input
                                    type="text"
                                    placeholder="Recipient Address"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <button onClick={transferTokens}>Transfer</button>
                            </div>

                            {isOwner && (
                                <div className="mint-section">
                                    <h3>Mint New Tokens</h3>
                                    <input
                                        type="number"
                                        placeholder="Amount to Mint"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                    <button onClick={mintTokens}>Mint Tokens</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
            {user && (
                <TransactionHistory address={account} />
            )}
        </div>
    );
}

export default TokenInterface;