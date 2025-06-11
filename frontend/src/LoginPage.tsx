import React, { useState } from "react";
import { useTypingEffect } from "./components/ui/useTypingEffect";
import Navbar from "./components/navbar";

interface LoginPageProps {
  onLogin: (username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const subtitle = useTypingEffect(
    "Secure and track your sensitive files.",
    25
  );

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
    <div className="min-h-screen flex bg-gradient-to-br from-[#0a1128] via-[#1b2a49] to-[#0a1128] text-white font-sans">
      <Navbar />
      {/* Left Panel */}
      <div className="w-1/2 flex flex-col justify-center items-start px-20">
        <div className="mb-6">
          <div className="text-5xl font-bold mb-4">DataVault</div>
          <p className="text-lg text-gray-300 max-w-md mb-6">{subtitle}</p>
          <button className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-5 py-2 rounded-lg font-semibold hover:opacity-90 transition">
            Learn More
          </button>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-1/2 flex items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="bg-white/10 backdrop-blur-md p-10 rounded-xl w-full max-w-md shadow-lg"
        >
          <h2 className="text-3xl font-semibold text-center mb-6 text-white">
            Sign In
          </h2>

          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              User Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-blue-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
              required
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-blue-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-400 text-white py-2 rounded-lg font-bold hover:opacity-90 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
