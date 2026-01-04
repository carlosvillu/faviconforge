type BookmarkPreviewProps = {
  faviconUrl: string | null
}

export function BookmarkPreview({ faviconUrl }: BookmarkPreviewProps) {
  return (
    <div className="bg-gray-200 border-4 border-black p-4">
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-white border-2 border-gray-400 px-2 py-1">
          {faviconUrl ? (
            <img src={faviconUrl} className="w-3 h-3" alt="bookmark favicon" />
          ) : (
            <div className="w-3 h-3 bg-black" />
          )}
          <span className="text-xs font-bold">My Site</span>
        </div>
        <div className="flex items-center gap-1 bg-white border-2 border-gray-400 px-2 py-1">
          <div className="w-3 h-3 bg-gray-400" />
          <span className="text-xs font-bold">GitHub</span>
        </div>
      </div>
    </div>
  )
}
