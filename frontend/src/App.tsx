import React, { useState } from 'react';
import LoginPage from './LoginPage';
import FileManagementSystem from './FileManagementSystem';


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  const handleLogin = (username: string) => {
    setIsLoggedIn(true);
    setUsername(username); 
  };

  return (
    <div className="p-0">
      {isLoggedIn ? (
        <FileManagementSystem username={username} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;