import * as React from 'react'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'

type TextareaBrutalistProps = React.ComponentProps<typeof Textarea>

export function TextareaBrutalist({
  className,
  ...props
}: TextareaBrutalistProps) {
  return (
    <Textarea
      {...props}
      className={cn(
        '!bg-white border-4 border-black rounded-none font-bold text-black placeholder:text-gray-600 focus-visible:border-black focus-visible:outline focus-visible:outline-4 focus-visible:outline-yellow-300 focus-visible:outline-offset-0 focus-visible:ring-0 transition-none',
        className
      )}
    />
  )
}
