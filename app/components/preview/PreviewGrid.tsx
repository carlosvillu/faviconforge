import { useTranslation } from 'react-i18next'
import type { UseFaviconGenerationReturn } from '~/hooks/useFaviconGeneration'
import { PreviewCard } from './PreviewCard'
import { PreviewCardSkeleton } from './PreviewCardSkeleton'
import { BrowserTabPreview } from './BrowserTabPreview'
import { IOSHomePreview } from './IOSHomePreview'
import { AndroidHomePreview } from './AndroidHomePreview'
import { WindowsTilePreview } from './WindowsTilePreview'
import { BookmarkPreview } from './BookmarkPreview'
import { PWAInstallPreview } from './PWAInstallPreview'

type PreviewGridProps = Pick<UseFaviconGenerationReturn, 'generationState' | 'getFaviconUrl'> & {
  isUserPremium: boolean
}

type PreviewConfig = {
  title: string
  description: string
  size: number
  tier: 'free' | 'premium'
  component: (props: { faviconUrl: string | null; isBlurred?: boolean }) => React.JSX.Element
  backgroundColor: 'yellow' | 'white'
}

export function PreviewGrid({ generationState, getFaviconUrl, isUserPremium }: PreviewGridProps) {
  const { t } = useTranslation()

  const previews: PreviewConfig[] = [
    {
      title: t('preview_browser_tab'),
      description: t('preview_browser_tab_desc'),
      size: 16,
      tier: 'free',
      component: BrowserTabPreview,
      backgroundColor: 'yellow',
    },
    {
      title: t('preview_ios_home'),
      description: t('preview_ios_home_desc'),
      size: 180,
      tier: 'premium',
      component: IOSHomePreview,
      backgroundColor: 'white',
    },
    {
      title: t('preview_android'),
      description: t('preview_android_desc'),
      size: 192,
      tier: 'premium',
      component: AndroidHomePreview,
      backgroundColor: 'yellow',
    },
    {
      title: t('preview_windows_tile'),
      description: t('preview_windows_tile_desc'),
      size: 150,
      tier: 'premium',
      component: WindowsTilePreview,
      backgroundColor: 'white',
    },
    {
      title: t('preview_bookmark'),
      description: t('preview_bookmark_desc'),
      size: 16,
      tier: 'free',
      component: BookmarkPreview,
      backgroundColor: 'yellow',
    },
    {
      title: t('preview_pwa_install'),
      description: t('preview_pwa_install_desc'),
      size: 512,
      tier: 'premium',
      component: PWAInstallPreview,
      backgroundColor: 'white',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {previews.map((preview) => {
        const faviconUrl = getFaviconUrl(preview.size)
        const isGenerating = generationState === 'generating'

        if (isGenerating && !faviconUrl) {
          return (
            <PreviewCardSkeleton key={preview.title} backgroundColor={preview.backgroundColor} />
          )
        }

        const isPremium = preview.tier === 'premium'
        const isBlurred = isPremium && !isUserPremium

        return (
          <PreviewCard
            key={preview.title}
            title={preview.title}
            description={preview.description}
            isPremium={isPremium}
            isBlurred={isBlurred}
            backgroundColor={preview.backgroundColor}
          >
            <preview.component faviconUrl={faviconUrl} isBlurred={isBlurred} />
          </PreviewCard>
        )
      })}
    </div>
  )
}
