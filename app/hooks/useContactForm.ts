import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { trackFFEvent } from '~/lib/analytics'

const createContactSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(1, t('contact_name_required'))
      .max(100, t('contact_name_too_long')),
    email: z.string().email(t('invalid_email')),
    message: z
      .string()
      .min(10, t('contact_message_too_short'))
      .max(2000, t('contact_message_too_long')),
  })

type ContactFormData = {
  name: string
  email: string
  message: string
}

type UseContactFormResult = {
  form: ReturnType<typeof useForm<ContactFormData>>
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  isSubmitting: boolean
  isSuccess: boolean
  resetSuccess: () => void
}

export function useContactForm(): UseContactFormResult {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const schema = useMemo(() => createContactSchema(t), [t])

  const form = useForm<ContactFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', message: '' },
  })

  async function handleSubmit(data: ContactFormData) {
    trackFFEvent('contact_form_submit', {
      has_email: Boolean(data.email),
    })
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'rate_limited') {
          const minutes = Math.ceil(result.resetIn / 60000)
          toast.error(t('contact_rate_limited', { minutes }))
        } else if (result.error === 'validation_error') {
          toast.error(t('contact_validation_error'))
        } else {
          toast.error(t('contact_error'))
        }
        return
      }

      setIsSuccess(true)
      toast.success(t('contact_success'))
      form.reset()
    } catch {
      toast.error(t('contact_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetSuccess() {
    setIsSuccess(false)
  }

  return {
    form,
    onSubmit: form.handleSubmit(handleSubmit),
    isSubmitting,
    isSuccess,
    resetSuccess,
  }
}
