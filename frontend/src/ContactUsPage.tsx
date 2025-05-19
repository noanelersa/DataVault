import Navbar from "./components/navbar";

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1128] via-[#1b2a49] to-[#0a1128] text-white font-sans">
      <Navbar />

      <div className="flex flex-col lg:flex-row items-stretch pt-24 px-6 lg:px-20 gap-8">
        
        <div className="lg:w-1/2 bg-white/5 rounded-2xl p-10 backdrop-blur-lg shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/map-overlay.png')] bg-cover opacity-10 pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">Contact DataVault</h1>
            <p className="text-base text-gray-300 mb-10">
              Secure your data. Reach out with questions or requests.
            </p>

            <div className="mb-6">
              <h3 className="font-semibold text-white mb-1">Our Address</h3>
              <p className="text-sm text-gray-300">
                Elie Wiesel St 2<br />
                Rishon LeTsiyon, Israel 
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">Contact</h3>
              <p className="text-sm text-gray-300">
                support@datavault.io<br />
                +972 54 123 4567
              </p>
            </div>
          </div>
        </div>

       
         <div className="lg:w-1/2 w-full bg-white/10 backdrop-blur-lg rounded-2xl p-10 shadow-2xl flex items-center justify-center">
          <form className="w-full max-w-md">
            <img
              src="/location.png"
              alt="Location"
              className="w-full h-full rounded-2xl object-cover"
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
