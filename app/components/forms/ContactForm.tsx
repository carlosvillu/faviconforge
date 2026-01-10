import { CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Button } from '~/components/ui/button'
import { useContactForm } from '~/hooks/useContactForm'

export function ContactForm() {
  const { t } = useTranslation()
  const { form, onSubmit, isSubmitting, isSuccess, resetSuccess } =
    useContactForm()

  if (isSuccess) {
    return (
      <div className="text-center space-y-6 py-8">
        <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
        <h2 className="text-2xl font-black uppercase">
          {t('contact_success_title')}
        </h2>
        <p className="text-slate">{t('contact_success_description')}</p>
        <Button onClick={resetSuccess} variant="secondary">
          {t('contact_send_another')}
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-black uppercase text-sm">
                {t('contact_name_label')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('contact_name_placeholder')}
                  className="border-2 border-ink focus:border-yellow-400"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-black uppercase text-sm">
                {t('email_label')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder={t('email_placeholder')}
                  className="border-2 border-ink focus:border-yellow-400"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-black uppercase text-sm">
                {t('contact_message_label')}
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t('contact_message_placeholder')}
                  rows={6}
                  className="border-2 border-ink focus:border-yellow-400"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black text-yellow-300 font-black uppercase text-lg py-6 hover:bg-yellow-300 hover:text-black border-4 border-black transition-colors"
        >
          {isSubmitting ? t('contact_sending') : t('contact_send')}
        </Button>
      </form>
    </Form>
  )
}
