import type { ReactNode } from 'react'
import { PremiumBadge } from './PremiumBadge'

type PreviewCardProps = {
  title: string
  description: string
  isPremium: boolean
  isBlurred: boolean
  backgroundColor: 'yellow' | 'white'
  children: ReactNode
}

export function PreviewCard({
  title,
  description,
  isPremium,
  isBlurred,
  backgroundColor,
  children,
}: PreviewCardProps) {
  const bgClass = backgroundColor === 'yellow' ? 'bg-yellow-300' : 'bg-white'

  return (
    <div className={`border-8 border-black p-6 ${bgClass}`}>
      <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">
        {title}
      </h3>
      <div className={isBlurred ? 'blur-sm' : ''}>{children}</div>
      <p className="text-sm font-bold mt-3">{description}</p>
      {isPremium && <PremiumBadge />}
    </div>
  )
}
