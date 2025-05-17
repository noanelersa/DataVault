import { ShieldCheck } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="w-full px-8 py-4 flex justify-between items-center bg-black/40 backdrop-blur-md text-white fixed top-0 z-20">
      
      <div className="flex items-center space-x-3">
        <ShieldCheck className="h-8 w-8 text-cyan-400" />
        <span className="text-2xl font-bold">DataVault</span>
      </div>

      <div className="space-x-6">
        <Link to="/login" className="hover:text-cyan-400">Home</Link>
        <Link to="/about" className="hover:text-cyan-400">About</Link>
        <Link to="/contact" className="hover:text-cyan-400">Contact</Link>
      </div>
    </nav>
  );
};

export default Navbar;
