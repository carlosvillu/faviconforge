type BrowserTabPreviewProps = {
  faviconUrl: string | null
}

export function BrowserTabPreview({ faviconUrl }: BrowserTabPreviewProps) {
  return (
    <div className="bg-white border-4 border-black p-4">
      <div className="flex items-center gap-3 bg-gray-100 border-2 border-gray-400 px-3 py-2">
        {faviconUrl ? (
          <img src={faviconUrl} className="w-4 h-4" alt="favicon" />
        ) : (
          <div className="w-4 h-4 bg-black" />
        )}
        <span className="text-sm font-bold">My Website</span>
        <span className="ml-auto text-xs font-bold text-gray-500">x</span>
      </div>
    </div>
  )
}
