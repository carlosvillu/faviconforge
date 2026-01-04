type WindowsTilePreviewProps = {
  faviconUrl: string | null
  isBlurred?: boolean
}

export function WindowsTilePreview({
  faviconUrl,
  isBlurred,
}: WindowsTilePreviewProps) {
  const blurClass = isBlurred ? 'filter blur-[4px]' : ''

  return (
    <div className="bg-blue-600 border-4 border-black p-8">
      <div className="grid grid-cols-2 gap-2">
        <div className={`border-2 border-white h-20 overflow-hidden ${blurClass}`}>
          {faviconUrl ? (
            <img
              src={faviconUrl}
              className="w-full h-full object-cover"
              alt="Windows tile"
            />
          ) : (
            <div className="w-full h-full bg-black" />
          )}
        </div>
        <div className="bg-gray-300 border-2 border-white h-20" />
        <div className="bg-gray-300 border-2 border-white h-20" />
        <div className="bg-gray-300 border-2 border-white h-20" />
      </div>
    </div>
  )
}
