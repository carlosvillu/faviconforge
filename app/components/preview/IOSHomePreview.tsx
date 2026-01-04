type IOSHomePreviewProps = {
  faviconUrl: string | null
  isBlurred?: boolean
}

export function IOSHomePreview({
  faviconUrl,
  isBlurred,
}: IOSHomePreviewProps) {
  const blurClass = isBlurred ? 'filter blur-[4px]' : ''

  return (
    <div className="bg-gradient-to-br from-blue-400 to-purple-500 border-4 border-black p-8">
      <div className="space-y-4">
        <div className="flex gap-4">
          <div
            className={`w-16 h-16 border-4 border-white rounded-2xl overflow-hidden ${blurClass}`}
          >
            {faviconUrl ? (
              <img
                src={faviconUrl}
                className="w-full h-full object-cover"
                alt="iOS icon"
              />
            ) : (
              <div className="w-full h-full bg-black" />
            )}
          </div>
          <div className="w-16 h-16 bg-gray-300 border-4 border-white rounded-2xl" />
        </div>
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-gray-300 border-4 border-white rounded-2xl" />
          <div className="w-16 h-16 bg-gray-300 border-4 border-white rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
