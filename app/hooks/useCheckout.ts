import { useState } from 'react'

type UseCheckoutResult = {
    startCheckout: () => Promise<void>
    isLoading: boolean
    error: string | null
}

export function useCheckout(): UseCheckoutResult {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const startCheckout = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
            })

            if (!response.ok) {
                throw new Error('Failed to start checkout session')
            }

            const data = await response.json()

            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error('No checkout URL returned')
            }
        } catch (err) {
            console.error('Checkout error:', err)
            setError(err instanceof Error ? err.message : 'Unknown error')
            setIsLoading(false)
        }
    }

    return { startCheckout, isLoading, error }
}
