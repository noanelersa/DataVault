import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuccess(false);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Add actual registration logic 
    setSuccess(true);

    setFormData({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1128] via-[#1b2a49] to-[#0a1128] text-white px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-md p-10 rounded-xl w-full max-w-md shadow-lg space-y-4"
      >
        <h2 className="text-3xl font-semibold text-center mb-4">
          Create a <span className="text-blue-400">New Account</span>
        </h2>

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-blue-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required/>

        <div className="flex space-x-4">
          <input
            type="text"
            name="firstName"
            placeholder="First name"
            value={formData.firstName}
            onChange={handleChange}
            className="w-1/2 px-4 py-2 rounded-lg bg-white/10 border border-blue-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last name"
            value={formData.lastName}
            onChange={handleChange}
            className="w-1/2 px-4 py-2 rounded-lg bg-white/10 border border-blue-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-blue-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-blue-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-blue-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
        <p className="text-purple-300 text-sm mb-0.5  text-center w-full">Passwords do not match</p>)}

        
        <div className="text-sm text-gray-300 text-center mb-2">
          Already a Member?{' '}
          <Link to="/" className="text-blue-400 hover:underline">
            Log in
          </Link>
        </div>
        
        {success && (
        <p className="text-green-300 text-center text-sm mt-0 mb-2">
            Account created successfully!
        </p>
        )}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-400 text-white py-2 rounded-lg font-bold hover:opacity-90 transition">
          Create Account
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
