import React from 'react';
import Navbar from './components/navbar';
import { FaMapMarkerAlt, FaEnvelope, FaPhone } from 'react-icons/fa';

const Contact = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1128] via-[#1b2a49] to-[#0a1128] text-white">
      <Navbar />

      <section className="px-6 py-20 max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">
          Contact <span className="text-cyan-300">DataVault</span>
        </h1>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Contact Info */}
          <div className="bg-[#1d2b4f] rounded-2xl p-8 shadow-lg space-y-6">
            <p className="text-lg text-gray-300">
              Secure your data. Reach out with questions or requests.
            </p>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Our Address</h2>
              <div className="flex items-start gap-3 text-gray-300">
                <FaMapMarkerAlt className="text-cyan-400 mt-1" />
                <span>
                  Elie Wiesel St 2<br />
                  Rishon LeTsiyon, Israel
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Contact</h2>
              <div className="flex items-center gap-3 text-gray-300">
                <FaEnvelope className="text-cyan-400" />
                <a href="mailto:support@datavault.io" className="hover:text-white transition">
                  support@datavault.io
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <FaPhone className="text-cyan-400" />
                <a href="tel:+972541234567" className="hover:text-white transition">
                  +972 54 123 4567
                </a>
              </div>
            </div>
          </div>

          {/* Map Image */}
      <div className="rounded-2xl overflow-hidden shadow-lg h-[400px] md:h-full max-h-[340px]">
        <img
          src="/location.png"
          alt="DataVault Location Map"
          className="w-full h-full object-cover"
        />
      </div>
      </div>

      <h3 className="text-center text-sm md:text-base font-medium text-white mt-6">
        Your <span className="text-cyan-300">FILES</span> your <span className="text-cyan-300">RULES</span>.
      </h3>
    </section>
    </div>
  );
};

export default Contact;
