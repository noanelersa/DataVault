import React, { useState } from 'react';
import LoginPage from './LoginPage';
import FileManagementSystem from './FileManagementSystem';
import ContactUs from './ContactUsPage';
import AboutPage from './AboutPage';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  const handleLogin = (username: string) => {
    setIsLoggedIn(true);
    setUsername(username); 
  };

  return (
    <BrowserRouter>
     <Routes>
      <Route
          path="/"
          element={
            isLoggedIn ? (
              <Navigate to="/files" replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/about" element={<AboutPage/>}/>
        <Route
          path="/files"
          element={
            isLoggedIn ? (
              <FileManagementSystem username={username} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;