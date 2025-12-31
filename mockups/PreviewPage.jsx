import React from 'react';

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-white font-mono">
      {/* Header */}
      <header className="border-b-8 border-black bg-yellow-300 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            FaviconForge
          </h1>
          <div className="flex gap-4 items-center">
            <span className="font-bold text-sm">STEP 2/3: PREVIEW</span>
            <button className="bg-black text-yellow-300 px-4 py-2 font-bold uppercase text-sm border-4 border-black hover:bg-white hover:text-black transition-colors">
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-black h-4 relative">
        <div className="bg-yellow-300 h-full w-2/3 border-r-4 border-black"></div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h2 className="text-6xl font-black uppercase mb-4 leading-none">
            Preview Your
            <br />
            <span className="bg-black text-white px-2">Favicons</span>
          </h2>
          <p className="text-xl font-bold border-l-8 border-black pl-4 mt-6">
            See how your favicon looks across different platforms and contexts.
          </p>
        </div>

        {/* Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Browser Tab Preview */}
          <div className="border-8 border-black p-6 bg-yellow-300">
            <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">
              Browser Tab
            </h3>
            <div className="bg-white border-4 border-black p-4">
              <div className="flex items-center gap-3 bg-gray-100 border-2 border-gray-400 px-3 py-2">
                <div className="w-4 h-4 bg-black"></div>
                <span className="text-sm font-bold">My Website</span>
                <span className="ml-auto text-xs font-bold text-gray-500">×</span>
              </div>
            </div>
            <p className="text-sm font-bold mt-3">16×16px favicon.ico</p>
          </div>

          {/* iOS Home Screen */}
          <div className="border-8 border-black p-6 bg-white">
            <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">
              iOS Home Screen
            </h3>
            <div className="bg-gradient-to-br from-blue-400 to-purple-500 border-4 border-black p-8">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-black border-4 border-white rounded-2xl"></div>
                  <div className="w-16 h-16 bg-gray-300 border-4 border-white rounded-2xl"></div>
                </div>
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-300 border-4 border-white rounded-2xl"></div>
                  <div className="w-16 h-16 bg-gray-300 border-4 border-white rounded-2xl"></div>
                </div>
              </div>
            </div>
            <p className="text-sm font-bold mt-3">180×180px apple-touch-icon</p>
            <span className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-black uppercase mt-2">
              PREMIUM
            </span>
          </div>

          {/* Android Home Screen */}
          <div className="border-8 border-black p-6 bg-yellow-300">
            <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">
              Android
            </h3>
            <div className="bg-gradient-to-br from-green-400 to-teal-500 border-4 border-black p-8">
              <div className="space-y-4">
                <div className="flex gap-4 justify-center">
                  <div className="w-16 h-16 bg-black border-4 border-white rounded-2xl"></div>
                  <div className="w-16 h-16 bg-gray-300 border-4 border-white rounded-2xl"></div>
                </div>
                <div className="flex gap-4 justify-center">
                  <div className="w-16 h-16 bg-gray-300 border-4 border-white rounded-2xl"></div>
                  <div className="w-16 h-16 bg-gray-300 border-4 border-white rounded-2xl"></div>
                </div>
              </div>
            </div>
            <p className="text-sm font-bold mt-3">192×192px PWA icon</p>
            <span className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-black uppercase mt-2">
              PREMIUM
            </span>
          </div>

          {/* Windows Tile */}
          <div className="border-8 border-black p-6 bg-white">
            <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">
              Windows Tile
            </h3>
            <div className="bg-blue-600 border-4 border-black p-8">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black border-2 border-white h-20"></div>
                <div className="bg-gray-300 border-2 border-white h-20"></div>
                <div className="bg-gray-300 border-2 border-white h-20"></div>
                <div className="bg-gray-300 border-2 border-white h-20"></div>
              </div>
            </div>
            <p className="text-sm font-bold mt-3">150×150px mstile</p>
            <span className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-black uppercase mt-2">
              PREMIUM
            </span>
          </div>

          {/* Bookmark Bar */}
          <div className="border-8 border-black p-6 bg-yellow-300">
            <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">
              Bookmark Bar
            </h3>
            <div className="bg-gray-200 border-4 border-black p-4">
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 bg-white border-2 border-gray-400 px-2 py-1">
                  <div className="w-3 h-3 bg-black"></div>
                  <span className="text-xs font-bold">My Site</span>
                </div>
                <div className="flex items-center gap-1 bg-white border-2 border-gray-400 px-2 py-1">
                  <div className="w-3 h-3 bg-gray-400"></div>
                  <span className="text-xs font-bold">GitHub</span>
                </div>
              </div>
            </div>
            <p className="text-sm font-bold mt-3">16×16px favicon</p>
          </div>

          {/* PWA Install */}
          <div className="border-8 border-black p-6 bg-white">
            <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">
              PWA Install
            </h3>
            <div className="bg-gradient-to-b from-yellow-300 to-white border-4 border-black p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-black border-4 border-black mx-auto mb-4"></div>
                <div className="text-sm font-black">My App</div>
                <div className="text-xs font-bold text-gray-600 mt-1">Install</div>
              </div>
            </div>
            <p className="text-sm font-bold mt-3">512×512px maskable</p>
            <span className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-black uppercase mt-2">
              PREMIUM
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-16 flex gap-6 justify-center">
          <button className="bg-white text-black px-8 py-4 font-black uppercase text-lg border-4 border-black hover:bg-yellow-300 transition-colors">
            ← Back
          </button>
          <button className="bg-black text-yellow-300 px-12 py-4 font-black uppercase text-lg border-4 border-black hover:bg-yellow-300 hover:text-black transition-colors">
            Download →
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-12 border-8 border-black p-8 bg-yellow-300">
          <div className="flex items-start gap-4">
            <div className="text-4xl">💡</div>
            <div>
              <h3 className="text-2xl font-black uppercase mb-2">Looks Good?</h3>
              <p className="font-bold text-lg">
                These previews show how your favicon will appear across different platforms.
                <br />
                Free tier includes basic formats. Upgrade to Premium for all platforms!
              </p>
            </div>
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
