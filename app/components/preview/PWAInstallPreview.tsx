type PWAInstallPreviewProps = {
  faviconUrl: string | null
  isBlurred?: boolean
}

export function PWAInstallPreview({
  faviconUrl,
  isBlurred,
}: PWAInstallPreviewProps) {
  const blurClass = isBlurred ? 'filter blur-[4px]' : ''

  return (
    <div className="bg-gradient-to-b from-yellow-300 to-white border-4 border-black p-8 flex items-center justify-center">
      <div className="text-center">
        <div
          className={`w-24 h-24 border-4 border-black mx-auto mb-4 overflow-hidden ${blurClass}`}
        >
          {faviconUrl ? (
            <img
              src={faviconUrl}
              className="w-full h-full object-cover"
              alt="PWA icon"
            />
          ) : (
            <div className="w-full h-full bg-black" />
          )}
        </div>
        <div className="text-sm font-black">My App</div>
        <div className="text-xs font-bold text-gray-600 mt-1">Install</div>
      </div>
    </div>
  )
}
