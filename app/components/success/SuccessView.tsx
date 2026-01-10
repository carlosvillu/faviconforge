import { Link } from 'react-router'

type SuccessViewProps = {
    title: string
    subtitle: string
    redirectText: string
    manualLinkText: string
}

export function SuccessView({
    title,
    subtitle,
    redirectText,
    manualLinkText,
}: SuccessViewProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="w-full max-w-2xl border-4 border-black bg-[#FFDE00] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                            {title}
                        </h1>
                        <p className="text-xl font-bold font-mono border-t-4 border-black pt-4 mt-4 inline-block">
                            {subtitle}
                        </p>
                    </div>

                    <div className="pt-8 space-y-4">
                        <div className="flex items-center justify-center gap-2 font-mono text-sm font-bold animate-pulse">
                            <div className="w-3 h-3 bg-black rounded-full" />
                            <span>{redirectText}</span>
                            <div className="w-3 h-3 bg-black rounded-full" />
                        </div>

                        <Link
                            to="/download?autoDownload=true"
                            className="inline-block text-sm font-bold underline hover:no-underline decoration-2 underline-offset-4"
                        >
                            {manualLinkText}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
