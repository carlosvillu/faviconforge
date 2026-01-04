import * as React from 'react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

type BrutalistButtonProps = React.ComponentProps<typeof Button>

export function BrutalistButton({ className, ...props }: BrutalistButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        'bg-black text-yellow-300 font-black uppercase border-4 border-black rounded-none hover:bg-yellow-300 hover:text-black transition-colors',
        className
      )}
    />
  )
}
