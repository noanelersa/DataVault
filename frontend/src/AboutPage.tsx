import React from 'react';
import Navbar from './components/navbar';

const AboutUs = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1128] via-[#1b2a49] to-[#0a1128] text-white font-sans">
      <Navbar />

      <section className="relative px-8 pt-20 pb-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4">
                ABOUT <span className="text-cyan-300">US</span><span className="text-white">.</span><br />
                
            </h1>

            <p className="text-lg text-gray-300 mb-6 min-h-[160px]">
               Data Vault is a comprehensive solution for managing sensitive files in a secure digital environment. The platform enables users to upload documents, define precise access controls, and track activity through real-time alerts. With a clear and user-friendly interface, organizations can ensure that confidential information is stored, accessed, and monitored safely. Designed to support collaborative work while maintaining high standards of information protection, Data Vault empowers users to stay in control of their data at every stage — from upload to access and beyond.
            <span className="animate-pulse">|</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
