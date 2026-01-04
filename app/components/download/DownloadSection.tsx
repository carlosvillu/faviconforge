import type { ReactNode } from 'react'

type DownloadSectionProps = {
  children: ReactNode
}

export function DownloadSection({ children }: DownloadSectionProps) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">{children}</div>
}
