import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import AuthFooter from '../Auth/AuthFooter';

const Login = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
         console.log('Submitting password:', password); // <--- check exact value
        try {
            await login({ email, password });
        } catch (err) {
            console.error("Login error:", err);
            setError(err.message || 'Invalid email or password');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h2 className="text-2xl mb-4">Login</h2>
            <form onSubmit={handleSubmit} className="w-1/3">
                <div className="mb-4">
                    <label className="block mb-2" htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border rounded-3xl w-full py-2 px-3"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-2" htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border rounded-3xl w-full py-2 px-3"
                        required
                    />
                </div>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <button type="submit" className="bg-blue-500 text-white rounded-3xl py-2 px-4">
                    Login
                </button>
            </form>
            <AuthFooter 
  message="Don't have an account?" 
  linkText="Register" 
  linkTo="/register" 
/>
        </div>
    );
};

export default Login;
