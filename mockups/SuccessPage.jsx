import React from 'react';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-yellow-300 font-mono">
      {/* Header */}
      <header className="border-b-8 border-black bg-white p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            FaviconForge
          </h1>
          <div className="flex gap-4 items-center">
            <span className="bg-green-600 text-white px-3 py-1 font-black text-xs uppercase border-2 border-black">
              ✓ PREMIUM
            </span>
            <button className="bg-black text-white px-4 py-2 font-bold uppercase text-sm border-4 border-black hover:bg-yellow-300 hover:text-black transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Success Banner */}
      <div className="bg-green-600 text-white border-b-8 border-black py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="mb-6">
            <svg className="w-32 h-32 mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h2 className="text-6xl font-black uppercase mb-4">
            Payment
            <br />
            Successful!
          </h2>
          <p className="text-2xl font-bold">
            Welcome to FaviconForge Premium! 🎉
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-20">
        {/* What's Next */}
        <div className="border-8 border-black p-8 bg-white mb-8">
          <h3 className="text-4xl font-black uppercase mb-6 border-b-4 border-black pb-4">
            What's Next?
          </h3>
          
          <div className="space-y-6">
            {[
              {
                number: '1',
                title: 'Download Your Premium Package',
                desc: 'Get all 15+ favicon formats, manifest.json, and complete documentation.',
                action: 'Download Premium ZIP',
                actionStyle: 'bg-black text-yellow-300'
              },
              {
                number: '2',
                title: 'Extract & Implement',
                desc: 'Unzip the package and follow the README.md for implementation instructions.',
                action: 'View Quick Start Guide',
                actionStyle: 'bg-white text-black'
              },
              {
                number: '3',
                title: 'Customize Your PWA',
                desc: 'Edit manifest.json to personalize your app name, colors, and display options.',
                action: 'Learn About Manifest',
                actionStyle: 'bg-white text-black'
              }
            ].map((step, i) => (
              <div key={i} className="border-4 border-black p-6 bg-yellow-300">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-black text-yellow-300 border-4 border-black flex items-center justify-center text-3xl font-black">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-black uppercase mb-2">{step.title}</h4>
                    <p className="font-bold text-lg mb-4">{step.desc}</p>
                    <button className={`
                      ${step.actionStyle} px-6 py-3 font-black uppercase text-sm 
                      border-4 border-black hover:scale-105 transition-transform
                    `}>
                      {step.action}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Benefits */}
        <div className="border-8 border-black p-8 bg-black text-yellow-300 mb-8">
          <h3 className="text-4xl font-black uppercase mb-6 border-b-4 border-yellow-300 pb-4">
            Your Premium Benefits
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: '∞', title: 'Lifetime Access', desc: 'Generate unlimited favicons forever' },
              { icon: '🔄', title: 'Multi-Device', desc: 'Works on all your devices automatically' },
              { icon: '📱', title: 'All Platforms', desc: 'iOS, Android, Windows, PWA support' },
              { icon: '⚡', title: 'Priority Support', desc: 'Fast response to your questions' },
              { icon: '📚', title: 'Full Documentation', desc: 'Complete implementation guides' },
              { icon: '🎨', title: 'Customization', desc: 'Edit manifest.json for your brand' }
            ].map((benefit, i) => (
              <div key={i} className="border-4 border-yellow-300 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{benefit.icon}</div>
                  <div>
                    <h4 className="font-black text-lg mb-1">{benefit.title}</h4>
                    <p className="font-bold text-sm">{benefit.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Receipt */}
        <div className="border-8 border-black p-8 bg-white">
          <h3 className="text-3xl font-black uppercase mb-6 border-b-4 border-black pb-4">
            Receipt
          </h3>
          
          <div className="space-y-4 font-mono">
            <div className="flex justify-between font-bold">
              <span>Order ID:</span>
              <span className="font-black">FF-2025-001234</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Date:</span>
              <span className="font-black">December 31, 2025</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Email:</span>
              <span className="font-black">user@example.com</span>
            </div>
            
            <div className="border-t-4 border-black pt-4 mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg">FaviconForge Premium (Lifetime)</span>
                <span className="font-black text-2xl">€5.00</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-600">
                <span>Payment Method:</span>
                <span>Stripe (•••• 4242)</span>
              </div>
            </div>

            <div className="border-t-4 border-black pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-black text-2xl uppercase">Total Paid:</span>
                <span className="font-black text-4xl">€5.00</span>
              </div>
            </div>
          </div>

          <button className="w-full mt-6 bg-white text-black px-6 py-3 font-black uppercase border-4 border-black hover:bg-yellow-300 transition-colors">
            📧 Email Receipt
          </button>
        </div>

        {/* CTA Box */}
        <div className="mt-8 border-8 border-black p-8 bg-yellow-300 text-center">
          <h3 className="text-3xl font-black uppercase mb-4">
            Generate Another Favicon?
          </h3>
          <p className="font-bold text-lg mb-6">
            Your premium access is active. Create unlimited favicons!
          </p>
          <button className="bg-black text-yellow-300 px-12 py-4 font-black uppercase text-xl border-4 border-black hover:scale-105 transition-transform">
            Upload New Image →
          </button>
        </div>

        {/* Support */}
        <div className="mt-8 border-8 border-black p-6 bg-white text-center">
          <p className="font-bold text-lg mb-3">
            Need help? Have questions?
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-white text-black px-6 py-3 font-black uppercase text-sm border-4 border-black hover:bg-yellow-300 transition-colors">
              📖 Documentation
            </button>
            <button className="bg-black text-white px-6 py-3 font-black uppercase text-sm border-4 border-black hover:bg-yellow-300 hover:text-black transition-colors">
              💬 Contact Support
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-yellow-300 border-t-8 border-black py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="font-black text-sm">
            © 2025 FAVICONFORGE • <a href="#" className="hover:text-white">TERMS</a> • <a href="#" className="hover:text-white">PRIVACY</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
