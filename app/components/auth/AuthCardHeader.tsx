import { CardHeader, CardTitle, CardDescription } from '~/components/ui/card'

export function AuthCardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <CardHeader className="px-8 gap-4">
      <CardTitle className="text-4xl font-black uppercase leading-none text-black">
        {title}
      </CardTitle>
      {subtitle ? (
        <CardDescription className="text-black font-bold text-lg border-l-8 border-black pl-4">
          {subtitle}
        </CardDescription>
      ) : null}
    </CardHeader>
  )
}
