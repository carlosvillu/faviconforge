type UploadProgressBarProps = {
  progress: number
}

export function UploadProgressBar({ progress }: UploadProgressBarProps) {
  return (
    <div className="bg-black h-4 relative">
      <div
        className={`bg-yellow-300 h-full ${progress < 100 ? 'border-r-4 border-black' : ''}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
