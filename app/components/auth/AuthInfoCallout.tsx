import { Link } from 'react-router'
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'

export function AuthInfoCallout({
  title,
  message,
  actionHref,
  actionLabel,
}: {
  title?: string
  message: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <Alert className="rounded-none border-4 border-black bg-yellow-300 text-black">
      {title ? (
        <AlertTitle className="font-black uppercase tracking-tight text-black">{title}</AlertTitle>
      ) : null}
      <AlertDescription className="text-black font-bold">
        <p>{message}</p>
        {actionHref && actionLabel ? (
          <Link
            to={actionHref}
            className="inline-block mt-3 font-black uppercase underline decoration-4 underline-offset-4"
          >
            {actionLabel}
          </Link>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
