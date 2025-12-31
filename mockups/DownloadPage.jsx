import React, { useState } from 'react';

export default function DownloadPage() {
  const [selectedTier, setSelectedTier] = useState('free');

  return (
    <div className="min-h-screen bg-white font-mono">
      {/* Header */}
      <header className="border-b-8 border-black bg-yellow-300 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            FaviconForge
          </h1>
          <div className="flex gap-4 items-center">
            <span className="font-bold text-sm">STEP 3/3: DOWNLOAD</span>
            <button className="bg-black text-yellow-300 px-4 py-2 font-bold uppercase text-sm border-4 border-black hover:bg-white hover:text-black transition-colors">
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-black h-4 relative">
        <div className="bg-yellow-300 h-full w-full"></div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h2 className="text-6xl font-black uppercase mb-4 leading-none">
            Choose Your
            <br />
            <span className="bg-black text-white px-2">Package</span>
          </h2>
          <p className="text-xl font-bold border-l-8 border-black pl-4 mt-6">
            Download your favicons in the format that suits your needs.
          </p>
        </div>

        {/* Tier Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Free Tier */}
          <div 
            className={`
              border-8 p-8 cursor-pointer transition-all
              ${selectedTier === 'free' 
                ? 'border-black bg-yellow-300 scale-105' 
                : 'border-gray-400 bg-white hover:border-black'
              }
            `}
            onClick={() => setSelectedTier('free')}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-3xl font-black uppercase mb-2">Free</h3>
                <p className="text-5xl font-black">€0</p>
              </div>
              <div className={`
                w-8 h-8 border-4 flex items-center justify-center
                ${selectedTier === 'free' ? 'border-black bg-black' : 'border-gray-400'}
              `}>
                {selectedTier === 'free' && (
                  <svg className="w-6 h-6 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                  </svg>
                )}
              </div>
            </div>

            <div className="border-t-4 border-black pt-6 mb-6">
              <p className="font-black text-sm uppercase mb-4">Included:</p>
              <ul className="space-y-2">
                {[
                  'favicon.ico (16, 32, 48px)',
                  'favicon-16x16.png',
                  'favicon-32x32.png',
                  'favicon-48x48.png',
                  'HTML snippet with code'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 font-bold">
                    <span className="text-green-600 font-black">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border-4 border-black p-4 font-bold text-sm">
              <span className="font-black">ZIP SIZE:</span> ~15 KB • <span className="font-black">FILES:</span> 5
            </div>
          </div>

          {/* Premium Tier */}
          <div 
            className={`
              border-8 p-8 cursor-pointer transition-all relative
              ${selectedTier === 'premium' 
                ? 'border-black bg-black text-yellow-300 scale-105' 
                : 'border-gray-400 bg-white hover:border-black'
              }
            `}
            onClick={() => setSelectedTier('premium')}
          >
            <div className="absolute -top-4 -right-4 bg-red-600 text-white px-6 py-2 font-black text-sm rotate-3 border-4 border-black">
              BEST VALUE
            </div>

            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-3xl font-black uppercase mb-2">Premium</h3>
                <p className="text-5xl font-black">€5</p>
                <p className="text-sm font-bold mt-1">ONE-TIME • FOREVER</p>
              </div>
              <div className={`
                w-8 h-8 border-4 flex items-center justify-center
                ${selectedTier === 'premium' 
                  ? 'border-yellow-300 bg-yellow-300' 
                  : 'border-gray-400'
                }
              `}>
                {selectedTier === 'premium' && (
                  <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                  </svg>
                )}
              </div>
            </div>

            <div className={`
              border-t-4 pt-6 mb-6
              ${selectedTier === 'premium' ? 'border-yellow-300' : 'border-black'}
            `}>
              <p className="font-black text-sm uppercase mb-4">Everything in Free, plus:</p>
              <ul className="space-y-2">
                {[
                  'Apple Touch Icon (180×180)',
                  'Android Icons (192, 512px)',
                  'Maskable Icons (192, 512px)',
                  'Windows Tile (150×150)',
                  'manifest.json (customizable)',
                  'browserconfig.xml',
                  'Safari Pinned Tab SVG',
                  'Complete README documentation'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 font-bold">
                    <span className="text-green-400 font-black">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`
              border-4 p-4 font-bold text-sm
              ${selectedTier === 'premium' 
                ? 'bg-yellow-300 text-black border-yellow-300' 
                : 'bg-white border-black'
              }
            `}>
              <span className="font-black">ZIP SIZE:</span> ~150 KB • <span className="font-black">FILES:</span> 15+
            </div>
          </div>
        </div>

        {/* Download Action */}
        <div className="border-8 border-black p-8 bg-yellow-300">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-3xl font-black uppercase mb-2">
                Ready to Download
              </h3>
              <p className="font-bold text-lg">
                {selectedTier === 'free' 
                  ? 'Your basic favicon package is ready. No account required!'
                  : 'Login with Google to purchase premium access and unlock all formats.'}
              </p>
            </div>

            <div className="flex gap-4">
              {selectedTier === 'free' ? (
                <button className="bg-black text-yellow-300 px-12 py-6 font-black uppercase text-xl border-4 border-black hover:bg-white hover:text-black transition-all hover:scale-105">
                  Download Free
                  <div className="text-xs font-bold mt-1">↓ ZIP • 15 KB</div>
                </button>
              ) : (
                <>
                  <button className="bg-white text-black px-8 py-6 font-black uppercase text-lg border-4 border-black hover:bg-yellow-300 transition-colors">
                    Login with Google
                  </button>
                  <button className="bg-black text-yellow-300 px-12 py-6 font-black uppercase text-xl border-4 border-black hover:bg-yellow-300 hover:text-black transition-all hover:scale-105">
                    Buy Premium
                    <div className="text-xs font-bold mt-1">€5 • ONE-TIME</div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Package Contents Preview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Package */}
          <div className="border-8 border-black p-6 bg-white">
            <h4 className="text-2xl font-black uppercase mb-4 border-b-4 border-black pb-2">
              Free Package Contents
            </h4>
            <div className="font-mono text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">📁</span>
                <span className="font-bold">faviconforge-output/</span>
              </div>
              <div className="ml-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600">📁</span>
                  <span className="font-bold">web/</span>
                </div>
                <div className="ml-8 space-y-0.5 text-xs">
                  <div>├── favicon.ico</div>
                  <div>├── favicon-16x16.png</div>
                  <div>├── favicon-32x32.png</div>
                  <div>└── favicon-48x48.png</div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-blue-600">📄</span>
                  <span className="font-bold">snippet.html</span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Package */}
          <div className="border-8 border-black p-6 bg-black text-yellow-300">
            <h4 className="text-2xl font-black uppercase mb-4 border-b-4 border-yellow-300 pb-2">
              Premium Package Contents
            </h4>
            <div className="font-mono text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span>📁</span>
                <span className="font-bold">faviconforge-output/</span>
              </div>
              <div className="ml-4 space-y-1 text-xs">
                <div>📁 web/ (5 files)</div>
                <div>📁 ios/ (1 file)</div>
                <div>📁 android/ (4 files)</div>
                <div>📁 windows/ (2 files)</div>
                <div>📁 pwa/ (manifest.json)</div>
                <div className="text-green-400 font-black">+ Complete docs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <button className="bg-white text-black px-8 py-3 font-black uppercase border-4 border-black hover:bg-yellow-300 transition-colors">
            ← Back to Preview
          </button>
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
