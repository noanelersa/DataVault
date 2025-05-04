import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const existingUsers = [
    { username: 'roys', password: 'roys' },
    { username: 'talc', password: 'talc' },
    { username: 'maorg', password: 'maorg' },
    { username: 'alicem', password: 'alicem' },
    { username: 'taliam', password: 'taliam' },
    { username: 'noan', password: 'noan' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedUser = existingUsers.find(
      (user) => user.username === username && user.password === password
    );

    if (matchedUser) {
      localStorage.setItem('userId', username);
      onLogin(username);
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundColor: '#ffffff' }}
    >
      <form
        onSubmit={handleLogin}
        className="p-8 rounded-xl shadow-lg w-96 border"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: '#0a0f1a' }}
      >
        <div className="flex justify-center mb-6">
          <div
            className="w-32 h-32 rounded-full overflow-hidden border-3"
            style={{ borderColor: '#0a0f1a' }}
          >
            <img
              src="/DataVaultLOGO.png"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <p className="text-center mb-4 font-bold" style={{ color: '#0a0f1a' }}>{error}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" style={{ color: '#0a0f1a' }}>
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
            style={{
              borderColor: '#0a0f1a',
              color: '#0a0f1a',
              backgroundColor: 'transparent',
            }}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1" style={{ color: '#0a0f1a' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
            style={{
              borderColor: '#0a0f1a',
              color: '#0a0f1a',
              backgroundColor: 'transparent',
            }}
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded transition-colors duration-300 border"
          style={{
            backgroundColor: '#0a0f1a',
            borderColor: '#0a0f1a',
            color: '#ffffff',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1b2333')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0a0f1a')}
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
