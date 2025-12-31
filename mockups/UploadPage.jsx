import React, { useState } from 'react';

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  return (
    <div className="min-h-screen bg-white font-mono">
      {/* Header */}
      <header className="border-b-8 border-black bg-yellow-300 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            FaviconForge
          </h1>
          <div className="flex gap-4 items-center">
            <span className="font-bold text-sm">STEP 1/3: UPLOAD</span>
            <button className="bg-black text-yellow-300 px-4 py-2 font-bold uppercase text-sm border-4 border-black hover:bg-white hover:text-black transition-colors">
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-black h-4 relative">
        <div className="bg-yellow-300 h-full w-1/3 border-r-4 border-black"></div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h2 className="text-6xl font-black uppercase mb-4 leading-none">
            Upload Your
            <br />
            <span className="bg-black text-white px-2">Image</span>
          </h2>
          <p className="text-xl font-bold border-l-8 border-black pl-4 mt-6">
            Square images only. Minimum 512×512px. Max 10MB.
          </p>
        </div>

        {/* Upload Area */}
        <div 
          className={`
            border-8 border-black p-12 
            transition-all
            ${dragActive ? 'bg-yellow-300 border-dashed' : 'bg-white'}
            ${uploadedFile ? 'bg-green-200' : ''}
          `}
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            setUploadedFile({ name: 'example-logo.png', size: '2.5 MB' });
          }}
        >
          <div className="text-center space-y-8">
            {!uploadedFile ? (
              <>
                <div className="w-32 h-32 mx-auto border-8 border-black bg-yellow-300 flex items-center justify-center">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                  </svg>
                </div>
                
                <div>
                  <p className="text-3xl font-black uppercase mb-4">
                    {dragActive ? 'DROP IT HERE!' : 'DRAG & DROP'}
                  </p>
                  <p className="text-xl font-bold mb-6">or click to browse</p>
                  
                  <label className="cursor-pointer">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setUploadedFile({ 
                            name: e.target.files[0].name, 
                            size: (e.target.files[0].size / 1024 / 1024).toFixed(2) + ' MB' 
                          });
                        }
                      }}
                    />
                    <span className="bg-black text-white px-8 py-4 font-black uppercase inline-block border-4 border-black hover:bg-yellow-300 hover:text-black transition-colors">
                      Browse Files
                    </span>
                  </label>
                </div>

                <div className="border-t-4 border-black pt-8">
                  <p className="font-bold text-sm uppercase">Accepted formats:</p>
                  <p className="font-black text-2xl mt-2">PNG • JPEG • WebP</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-32 h-32 mx-auto border-8 border-black bg-white flex items-center justify-center">
                  <svg className="w-16 h-16 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                  </svg>
                </div>

                <div>
                  <p className="text-3xl font-black uppercase text-green-600 mb-2">
                    FILE UPLOADED!
                  </p>
                  <p className="text-xl font-bold">{uploadedFile.name}</p>
                  <p className="text-lg font-bold text-gray-600">{uploadedFile.size}</p>
                </div>

                <div className="flex gap-4 justify-center">
                  <button 
                    className="bg-white text-black px-6 py-3 font-black uppercase border-4 border-black hover:bg-yellow-300 transition-colors"
                    onClick={() => setUploadedFile(null)}
                  >
                    Choose Different
                  </button>
                  <button className="bg-black text-white px-8 py-4 font-black uppercase border-4 border-black hover:bg-yellow-300 hover:text-black transition-colors">
                    Continue →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Requirements Checklist */}
        <div className="mt-12 border-8 border-black p-8 bg-yellow-300">
          <h3 className="text-2xl font-black uppercase mb-6">Image Requirements:</h3>
          <ul className="space-y-3">
            {[
              { text: 'Square aspect ratio (1:1)', valid: true },
              { text: 'Minimum 512×512 pixels', valid: true },
              { text: 'Maximum 10MB file size', valid: true },
              { text: 'PNG, JPEG or WebP format', valid: true }
            ].map((req, i) => (
              <li key={i} className="flex items-start gap-3 font-bold text-lg">
                <span className={`text-2xl ${req.valid ? 'text-green-600' : 'text-black'}`}>
                  {req.valid ? '✓' : '○'}
                </span>
                <span>{req.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Error Example */}
        {false && (
          <div className="mt-8 border-8 border-red-600 p-8 bg-red-100">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⚠</div>
              <div>
                <h3 className="text-2xl font-black uppercase text-red-600 mb-2">
                  ERROR: IMAGE TOO SMALL
                </h3>
                <p className="font-bold text-lg">
                  Your image is 256×256px. Minimum required: 512×512px.
                  <br />
                  Please upload a larger image.
                </p>
              </div>
            </div>
          </div>
        )}
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
