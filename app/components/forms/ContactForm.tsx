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
import { InputBrutalist } from '~/components/InputBrutalist'
import { TextareaBrutalist } from '~/components/TextareaBrutalist'
import { BrutalistButton } from '~/components/BrutalistButton'
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
        <p className="font-bold">{t('contact_success_description')}</p>
        <BrutalistButton onClick={resetSuccess}>
          {t('contact_send_another')}
        </BrutalistButton>
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
                <InputBrutalist
                  {...field}
                  placeholder={t('contact_name_placeholder')}
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
                <InputBrutalist
                  {...field}
                  type="email"
                  placeholder={t('email_placeholder')}
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
                <TextareaBrutalist
                  {...field}
                  placeholder={t('contact_message_placeholder')}
                  rows={6}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <BrutalistButton
          type="submit"
          disabled={isSubmitting}
          className="w-full text-lg py-6"
        >
          {isSubmitting ? t('contact_sending') : t('contact_send')}
        </BrutalistButton>
      </form>
    </Form>
  )
}
