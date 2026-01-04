import { HeroSection, FeaturesSection, PricingSection } from '~/components/landing'
import type { LoaderFunctionArgs } from 'react-router'
import { getCurrentUser } from '~/lib/auth.server'

export function meta() {
  return [
    { title: 'FaviconForge - Generate All Favicon Formats' },
    {
      name: 'description',
      content: 'Generate all required favicon formats from a single image. 15+ formats in under 10 seconds. Free tier available, premium for €5 one-time.',
    },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const authSession = await getCurrentUser(request)
  return { user: authSession?.user ?? null }
}

export default function Home() {
  return (
    <div className="min-h-screen bg-yellow-300">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
    </div>
  )
}
