type PreviewCardSkeletonProps = {
  backgroundColor: 'yellow' | 'white'
}

export function PreviewCardSkeleton({
  backgroundColor,
}: PreviewCardSkeletonProps) {
  const bgClass = backgroundColor === 'yellow' ? 'bg-yellow-300' : 'bg-white'

  return (
    <div className={`border-8 border-black p-6 ${bgClass} animate-pulse`}>
      <div className="h-6 bg-black/20 mb-4 w-32" />
      <div className="h-32 bg-black/10 border-4 border-black/20" />
      <div className="h-4 bg-black/20 mt-3 w-24" />
    </div>
  )
}
