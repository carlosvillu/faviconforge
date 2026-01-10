import * as React from 'react'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'

type InputBrutalistProps = React.ComponentProps<typeof Input>

export function InputBrutalist({ className, ...props }: InputBrutalistProps) {
  return (
    <Input
      {...props}
      className={cn(
        '!bg-white border-4 border-black rounded-none font-bold text-black placeholder:text-gray-600 focus-visible:border-black focus-visible:outline focus-visible:outline-4 focus-visible:outline-yellow-300 focus-visible:outline-offset-0 focus-visible:ring-0 transition-none',
        className
      )}
    />
  )
}
