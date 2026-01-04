import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'

export function AuthErrorCallout({ message }: { message: string }) {
  return (
    <Alert
      variant="destructive"
      className="rounded-none border-4 border-red-600 bg-white text-red-600"
    >
      <AlertTitle className="font-black uppercase tracking-tight text-red-600">Error</AlertTitle>
      <AlertDescription className="font-bold text-red-600">{message}</AlertDescription>
    </Alert>
  )
}
