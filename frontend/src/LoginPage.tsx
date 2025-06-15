import React, { useState } from 'react';
import { useTypingEffect } from './components/ui/useTypingEffect';
import Navbar from './components/navbar';
import { FaLock, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';


interface LoginPageProps {
  onLogin: (username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const subtitle = useTypingEffect('Secure and track your sensitive files.', 25);
  const navigate = useNavigate();


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (response.ok) {
        const token = await response.text();
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('userId', username);
        onLogin(username);
      } else if (response.status === 401) {
        setError('Invalid username or password');
      } else {
        setError(`Unexpected error: ${response.status}`);
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Server error. Please try again later.");
    }
  };


  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0a1128] via-[#1b2a49] to-[#0a1128] text-white font-sans relative overflow-hidden">
      <Navbar />

      <div className="absolute w-72 h-72 bg-cyan-400 rounded-full opacity-20 blur-3xl top-0 left-[-5rem]" />
      <div className="absolute w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl bottom-[-5rem] right-[-5rem]" />


      {/* Left Panel */}
       <div className="w-1/2 flex flex-col justify-center items-start px-20 z-10">
       <h1 className="text-6xl font-extrabold mb-4 tracking-tight">
      <span className="text-cyan-300">Welcome</span> <span className="text-white">Back</span>
      </h1>
          <p className="text-lg text-gray-300 mb-6 max-w-md">{subtitle}</p>
          <button
            onClick={() => navigate('/about')}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Learn More
          </button>

        </div>

      {/* Right Panel - Login Form */}
      <div className="w-1/2 flex items-center justify-center z-10">
      
        <form
          onSubmit={handleLogin}
          className="bg-white/10 backdrop-blur-lg p-10 rounded-xl w-full max-w-md shadow-2xl border border-white/20">
          <h2 className = "text-3xl font-bold text-center mb-8">
            <span className="text-white">Sign in</span> <span className='text-cyan-300'>DataVault</span>
          </h2>

          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          <div className="mb-5">
            <label className="text-sm font-semibold text-gray-300 mb-1 block">Username</label>
            <div className="flex items-center bg-white/10 border border-blue-700 rounded-lg px-3">
              <FaUser className="text-gray-400 mr-2" />

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none"
              placeholder="Enter username"
              required
            />
            </div>
          </div>

          <div className="mb-8">
            <label className="text-sm font-semibold text-gray-300 mb-1 block">Password</label>
            <div className="flex items-center bg-white/10 border border-blue-700 rounded-lg px-3">
              <FaLock className="text-gray-400 mr-2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none"
              placeholder="Enter password"
              required
            />
          </div>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-400 text-white py-2 rounded-lg font-bold hover:opacity-90 transition shadow-md"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
