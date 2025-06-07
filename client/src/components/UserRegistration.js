import React, { useState } from 'react';

function UserRegistration({ address, onRegister }) {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        const response = await fetch('http://localhost:5000/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                address,
                username
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        onRegister(data);
    } catch (error) {
        console.error('Registration error:', error);
        setError(error.message || 'Failed to register. Please try again.');
    } finally {
        setIsLoading(false);
    }
};

    return (
        <div className="registration-form">
            <h3>Complete Your Registration</h3>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Registering...' : 'Register'}
                </button>
            </form>
            {error && <p className="error">{error}</p>}
        </div>
    );
}

export default UserRegistration;