import React from 'react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-yellow-300 font-mono">
      {/* Header */}
      <header className="border-b-8 border-black bg-white p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-4xl font-black uppercase tracking-tight">
            FaviconForge
          </h1>
          <button className="bg-black text-white px-6 py-3 font-bold uppercase text-sm border-4 border-black hover:bg-white hover:text-black transition-colors">
            Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column */}
          <div className="space-y-8">
            <h2 className="text-7xl font-black leading-none uppercase">
              Generate
              <br />
              <span className="bg-black text-yellow-300 px-2">ALL</span>
              <br />
              Favicon
              <br />
              Formats
            </h2>
            
            <p className="text-2xl font-bold border-l-8 border-black pl-4">
              15+ formats in under 10 seconds. No bullshit.
            </p>

            <div className="flex gap-4">
              <button className="bg-black text-yellow-300 px-8 py-4 font-black uppercase text-lg border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-transform">
                Upload Image →
              </button>
              <button className="bg-white text-black px-8 py-4 font-bold uppercase text-lg border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-transform">
                Learn More
              </button>
            </div>
          </div>

          {/* Right Column - Visual Demo */}
          <div className="relative">
            <div className="bg-white border-8 border-black p-8 rotate-1">
              <div className="space-y-4">
                <div className="flex items-center gap-4 border-4 border-black p-4 bg-yellow-300">
                  <div className="w-12 h-12 bg-black"></div>
                  <div>
                    <div className="font-black text-sm">favicon.ico</div>
                    <div className="text-xs font-bold">16×16, 32×32, 48×48</div>
                  </div>
                  <div className="ml-auto font-black text-green-600">FREE</div>
                </div>
                
                <div className="flex items-center gap-4 border-4 border-black p-4 bg-white">
                  <div className="w-12 h-12 bg-black"></div>
                  <div>
                    <div className="font-black text-sm">apple-touch-icon.png</div>
                    <div className="text-xs font-bold">180×180</div>
                  </div>
                  <div className="ml-auto font-black text-red-600">€5</div>
                </div>
                
                <div className="flex items-center gap-4 border-4 border-black p-4 bg-white">
                  <div className="w-12 h-12 bg-black"></div>
                  <div>
                    <div className="font-black text-sm">manifest.json</div>
                    <div className="text-xs font-bold">PWA Ready</div>
                  </div>
                  <div className="ml-auto font-black text-red-600">€5</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-black text-yellow-300 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-5xl font-black uppercase mb-12 border-b-8 border-yellow-300 pb-4">
            Why FaviconForge?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: '< 10 SEC', desc: 'Upload → Process → Download. Done.' },
              { title: '15+ FORMATS', desc: 'ICO, PNG, PWA, Apple, Windows, Safari' },
              { title: '€5 FOREVER', desc: 'One payment. Lifetime access. No subscription.' },
              { title: 'CLIENT-SIDE', desc: 'Your image never touches our servers' },
              { title: 'PRODUCTION READY', desc: 'Standards-compliant. Copy-paste HTML.' },
              { title: 'NO ACCOUNT', desc: 'Free tier works anonymously' }
            ].map((feature, i) => (
              <div 
                key={i}
                className="border-4 border-yellow-300 p-6 hover:bg-yellow-300 hover:text-black transition-colors"
              >
                <h4 className="text-2xl font-black mb-3">{feature.title}</h4>
                <p className="font-bold">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h3 className="text-5xl font-black uppercase mb-12 text-center">
            Pricing
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Tier */}
            <div className="border-8 border-black p-8 bg-yellow-300">
              <div className="text-3xl font-black uppercase mb-4">Free</div>
              <div className="text-6xl font-black mb-6">€0</div>
              <ul className="space-y-3 mb-8 font-bold">
                <li className="flex items-start gap-2">
                  <span className="text-2xl">✓</span>
                  <span>favicon.ico (16, 32, 48px)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-2xl">✓</span>
                  <span>PNG formats (16, 32, 48px)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-2xl">✓</span>
                  <span>HTML snippet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-2xl">✓</span>
                  <span>No account needed</span>
                </li>
              </ul>
              <button className="w-full bg-white border-4 border-black py-4 font-black uppercase hover:bg-black hover:text-white transition-colors">
                Start Free
              </button>
            </div>

            {/* Premium Tier */}
            <div className="border-8 border-black p-8 bg-black text-yellow-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-1 font-black text-sm rotate-12 transform translate-x-4 -translate-y-2">
                POPULAR
              </div>
              <div className="text-3xl font-black uppercase mb-4">Premium</div>
              <div className="text-6xl font-black mb-6">€5</div>
              <div className="text-sm font-bold mb-6 border-l-4 border-yellow-300 pl-2">
                ONE-TIME PAYMENT • LIFETIME ACCESS
              </div>
              <ul className="space-y-3 mb-8 font-bold">
                <li className="flex items-start gap-2">
                  <span className="text-2xl">✓</span>
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-2xl">✓</span>
                  <span>Apple Touch Icons (180px)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-2xl">✓</span>
                  <span>Android/PWA (192, 512px)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-2xl">✓</span>
                  <span>Maskable icons</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-2xl">✓</span>
                  <span>manifest.json + customization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-2xl">✓</span>
                  <span>Windows tiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-2xl">✓</span>
                  <span>Complete documentation</span>
                </li>
              </ul>
              <button className="w-full bg-yellow-300 text-black border-4 border-yellow-300 py-4 font-black uppercase hover:bg-white hover:border-white transition-colors">
                Buy Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-yellow-300 border-t-8 border-yellow-300 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-2xl font-black uppercase mb-4">FaviconForge</h4>
              <p className="font-bold">Generate all favicon formats in seconds.</p>
            </div>
            <div>
              <h4 className="text-xl font-black uppercase mb-4">Links</h4>
              <ul className="space-y-2 font-bold">
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-black uppercase mb-4">Support</h4>
              <p className="font-bold">hello@faviconforge.com</p>
            </div>
          </div>
          <div className="border-t-4 border-yellow-300 pt-8 text-center font-black">
            © 2025 FAVICONFORGE • MADE WITH ☕ AND CODE
          </div>
        </div>
      </footer>
    </div>
  );
}
