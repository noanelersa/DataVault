import React from 'react';
import Navbar from './components/navbar';
import { FaShieldAlt, FaUsers, FaCloudUploadAlt } from 'react-icons/fa';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1128] via-[#1b2a49] to-[#0a1128] text-white font-sans">
      <Navbar />

      <section className="relative px-8 pt-20 pb-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              ABOUT <span className="text-cyan-300">US</span><span className="text-white">.</span>
            </h1>

            <p className="text-lg text-gray-300 mb-6">
              Data Vault is a comprehensive solution for managing sensitive files in a secure digital environment. The platform enables users to upload documents, define precise access controls, and track activity through real-time alerts. With a clear and user-friendly interface, organizations can ensure that confidential information is stored, accessed, and monitored safely. Designed to support collaborative work while maintaining high standards of information protection, Data Vault empowers users to stay in control of their data at every stage — from upload to access and beyond.
              <span className="animate-pulse text-cyan-400 ml-1">|</span>
            </p>

            <div className="border-t-4 border-cyan-500 my-6 w-4/5 md:w-2/3  rounded-full"></div>

            <div className="mt-6 space-y-4 text-gray-200">
              <p><strong className="text-cyan-300">Our Mission:</strong> To protect digital information with cutting-edge security and give users full control over their files.</p>
              <p><strong className="text-cyan-300">Our Vision:</strong> A world where secure collaboration is seamless, intuitive, and accessible to all.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center mt-10 md:mt-0">
            <div className="bg-[#1b2a49] p-6 rounded-2xl shadow-md hover:scale-105 transition duration-300">
              <FaShieldAlt className="text-cyan-300 text-4xl mx-auto mb-2" />
              <h3 className="text-xl font-bold">99.9% Uptime</h3>
              <p className="text-sm text-gray-400">Security without interruption</p>
            </div>
            <div className="bg-[#1b2a49] p-6 rounded-2xl shadow-md hover:scale-105 transition duration-300">
              <FaUsers className="text-cyan-300 text-4xl mx-auto mb-2" />
              <h3 className="text-xl font-bold">Full User Control</h3>
              <p className="text-sm text-gray-400">Edit, share, revoke anytime</p>
            </div>
            <div className="bg-[#1b2a49] p-6 rounded-2xl shadow-md hover:scale-105 transition duration-300">
              <FaCloudUploadAlt className="text-cyan-300 text-4xl mx-auto mb-2" />
              <h3 className="text-xl font-bold">Protect Any File Type</h3>
              <p className="text-sm text-gray-400">From .png to .exe - all securely handled</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
