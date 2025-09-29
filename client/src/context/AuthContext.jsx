import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { login as loginApi } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/api/auth/me', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setUser(response.data);
            } catch (error) {
                console.error('Failed to fetch user:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const updateUser = (updatedData) => {
        const updatedUser = { ...user, ...updatedData };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    };

    const login = async ({ email, password }) => {
        try {
            const data = await loginApi({ email, password });
            setUser(data.user);
            navigate('/home');
        } catch (error) {
            console.error('Login failed:', error);
            throw error; // prosljeđuje error Login.jsx-u
        }
    };

  const logout = () => {
    try {
        // ako backend ima logout rutu i želiš ju pogoditi, ostavi ovo:
        // await api.post('/api/auth/logout', null, {
        //   headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        // });

        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        setUser(null);
        navigate('/login');
    } catch (error) {
        console.error('Logout failed:', error);
        // čak i u slučaju errora očisti sve
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        setUser(null);
        navigate('/login');
    }
};

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
