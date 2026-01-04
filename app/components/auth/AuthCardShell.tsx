import type { ReactNode } from 'react'
import { Card } from '~/components/ui/card'

export function AuthCardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-yellow-300 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md rounded-none border-8 border-black bg-white shadow-none py-8">
        {children}
      </Card>
    </div>
  )
}
