# FEATURE_7.1_ContactFormEmail.md

## 1. Natural Language Description

### Current State (Before)
- No hay forma de que los usuarios contacten al equipo de FaviconForge
- El footer de la landing page tiene un link "Contact" pero no lleva a ninguna página
- No existe integración con ningún servicio de email

### Expected End State (After)
- Página `/contact` con formulario funcional (nombre, email, mensaje)
- Los mensajes se envían por email via Resend a una dirección configurable
- Rate limiting básico: 3 envíos por hora por IP para evitar spam
- Toast de confirmación tras envío exitoso
- E2E tests que verifican el flujo mockando el servicio de email

---

## 2. Technical Description

### High-Level Approach
1. **Servicio de email**: Crear `app/services/contact.server.ts` con cliente Resend y función para enviar emails. Incluir rate limiting en memoria (Map por IP).
2. **API endpoint**: Crear `app/routes/api.contact.tsx` que recibe POST con datos del formulario, valida con Zod, aplica rate limiting, y llama al servicio.
3. **Página de contacto**: Crear `app/routes/contact.tsx` como página que compone el formulario.
4. **Componente de formulario**: Crear `app/components/forms/ContactForm.tsx` usando React Hook Form + Zod + shadcn/ui.
5. **Feedback**: Usar Sonner (ya instalado) para mostrar toasts de éxito/error.

### Dependencies
- `resend` - SDK oficial de Resend para Node.js
- `CONTACT_EMAIL` - Nueva variable de entorno para el email destino
- `RESEND_API_KEY` - Ya existe en .env.example

### shadcn/ui Components (Already Installed)
El proyecto ya tiene todos los componentes necesarios instalados:

| Component | Location | Usage |
|-----------|----------|-------|
| `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` | `~/components/ui/form` | Form structure with react-hook-form |
| `Input` | `~/components/ui/input` | Text input for name and email |
| `Textarea` | `~/components/ui/textarea` | Multi-line input for message |
| `Button` | `~/components/ui/button` | Submit button |
| `toast` | `sonner` | Success/error feedback |

**Pattern to follow (from shadcn/ui docs):**
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} placeholder="..." />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>
```

### Rate Limiting Strategy
Rate limiting simple en memoria usando un Map<IP, {count, firstRequest}>. Se resetea cada hora. Suficiente para una app de este tamaño. Si escala, migrar a Redis.

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `contact.tsx` solo compone el `<ContactForm />` y contexto de traducción. Sin lógica.
- **Loaders/actions are thin:** `api.contact.tsx` solo parsea request, valida entrada, verifica rate limit, llama servicio, retorna JSON.
- **Business logic is not in components:**
  - Domain logic (envío email, rate limiting) → `app/services/contact.server.ts`
  - UI orchestration (estado del form, submit handler) → `app/hooks/useContactForm.ts`
  - Componente → solo renderiza y conecta hook

### Route Modules

| Route | Services Called | Components Composed |
|-------|-----------------|---------------------|
| `contact.tsx` | None (no loader/action) | `<ContactForm />` |
| `api.contact.tsx` | `sendContactEmail()`, `checkRateLimit()` | None (API only) |

### Components

| Component | Hooks Used | Business Logic Excluded |
|-----------|------------|------------------------|
| `ContactForm.tsx` | `useContactForm` | Email sending, rate limiting |

---

## 3. Files to Change/Create

### `.env.example`
**Objective:** Add CONTACT_EMAIL environment variable

**Pseudocode:**
```pseudocode
ADD new line after RESEND_API_KEY:
  # Email address that receives contact form messages
  CONTACT_EMAIL=
```

---

### `app/services/contact.server.ts`
**Objective:** Handle email sending via Resend and rate limiting logic

**Pseudocode:**
```pseudocode
IMPORT Resend from 'resend'

// Rate limiting state (in-memory)
DECLARE rateLimitMap: Map<string, {count: number, firstRequest: number}>
CONST RATE_LIMIT = 3
CONST RATE_WINDOW_MS = 60 * 60 * 1000  // 1 hour

FUNCTION checkRateLimit(ip: string): { allowed: boolean, remaining: number, resetIn: number }
  GET entry from rateLimitMap for ip
  IF no entry OR entry.firstRequest older than RATE_WINDOW_MS
    CREATE new entry with count=1, firstRequest=now
    RETURN { allowed: true, remaining: RATE_LIMIT - 1, resetIn: RATE_WINDOW_MS }
  END IF

  IF entry.count >= RATE_LIMIT
    CALCULATE resetIn from entry.firstRequest + RATE_WINDOW_MS - now
    RETURN { allowed: false, remaining: 0, resetIn }
  END IF

  INCREMENT entry.count
  RETURN { allowed: true, remaining: RATE_LIMIT - entry.count, resetIn: ... }
END FUNCTION

FUNCTION sendContactEmail(params: { name: string, email: string, message: string }): Promise<void>
  GET resendApiKey from env
  GET contactEmail from env

  IF missing keys
    THROW Error('Missing email configuration')
  END IF

  CREATE resend client

  TRY
    CALL resend.emails.send({
      from: 'FaviconForge Contact <noreply@faviconforge.com>',
      to: contactEmail,
      replyTo: params.email,
      subject: `Contact Form: Message from ${params.name}`,
      text: formatPlainText(params),
      html: formatHtml(params)
    })
  CATCH error
    LOG error
    THROW Error('Failed to send email')
  END TRY
END FUNCTION

// Helper to format email body
FUNCTION formatPlainText(params): string
  RETURN template with name, email, message
END FUNCTION

FUNCTION formatHtml(params): string
  RETURN simple HTML template with name, email, message
END FUNCTION
```

---

### `app/routes/api.contact.tsx`
**Objective:** API endpoint to receive contact form submissions

**Pseudocode:**
```pseudocode
IMPORT { ActionFunctionArgs } from 'react-router'
IMPORT { z } from 'zod'
IMPORT { sendContactEmail, checkRateLimit } from '~/services/contact.server'

CONST contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000)
})

EXPORT ACTION FUNCTION action({ request }: ActionFunctionArgs)
  IF request.method !== 'POST'
    RETURN Response.json({ error: 'Method not allowed' }, { status: 405 })
  END IF

  // Get client IP (check common headers for proxies)
  GET clientIp from request headers (x-forwarded-for, x-real-ip) or 'unknown'

  // Check rate limit
  CONST rateCheck = checkRateLimit(clientIp)
  IF NOT rateCheck.allowed
    RETURN Response.json({
      error: 'rate_limited',
      resetIn: rateCheck.resetIn
    }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(rateCheck.resetIn / 1000)) }
    })
  END IF

  // Parse and validate body
  TRY
    CONST body = await request.json()
    CONST parsed = contactSchema.safeParse(body)

    IF NOT parsed.success
      RETURN Response.json({ error: 'validation_error', details: parsed.error.issues }, { status: 400 })
    END IF

    // Send email
    AWAIT sendContactEmail(parsed.data)

    RETURN Response.json({
      success: true,
      remaining: rateCheck.remaining
    })
  CATCH error
    LOG error
    RETURN Response.json({ error: 'internal_error' }, { status: 500 })
  END TRY
END FUNCTION
```

---

### `app/hooks/useContactForm.ts`
**Objective:** Orchestrate form state, submission, and toast feedback

**Pseudocode:**
```pseudocode
IMPORT { useForm } from 'react-hook-form'
IMPORT { zodResolver } from '@hookform/resolvers/zod'
IMPORT { toast } from 'sonner'
IMPORT { useTranslation } from 'react-i18next'

CONST createContactSchema = (t) => z.object({
  name: z.string().min(1, t('contact_name_required')).max(100, t('contact_name_too_long')),
  email: z.string().email(t('invalid_email')),
  message: z.string().min(10, t('contact_message_too_short')).max(2000, t('contact_message_too_long'))
})

TYPE ContactFormData = { name: string, email: string, message: string }

EXPORT FUNCTION useContactForm()
  CONST { t } = useTranslation()
  CONST [isSubmitting, setIsSubmitting] = useState(false)
  CONST [isSuccess, setIsSuccess] = useState(false)

  CONST schema = useMemo(() => createContactSchema(t), [t])

  CONST form = useForm<ContactFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', message: '' }
  })

  ASYNC FUNCTION onSubmit(data: ContactFormData)
    setIsSubmitting(true)

    TRY
      CONST response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      CONST result = await response.json()

      IF NOT response.ok
        IF result.error === 'rate_limited'
          CONST minutes = Math.ceil(result.resetIn / 60000)
          toast.error(t('contact_rate_limited', { minutes }))
        ELSE IF result.error === 'validation_error'
          toast.error(t('contact_validation_error'))
        ELSE
          toast.error(t('contact_error'))
        END IF
        RETURN
      END IF

      setIsSuccess(true)
      toast.success(t('contact_success'))
      form.reset()
    CATCH error
      toast.error(t('contact_error'))
    FINALLY
      setIsSubmitting(false)
    END TRY
  END FUNCTION

  FUNCTION resetSuccess()
    setIsSuccess(false)
  END FUNCTION

  RETURN { form, onSubmit: form.handleSubmit(onSubmit), isSubmitting, isSuccess, resetSuccess }
END FUNCTION
```

---

### `app/components/forms/ContactForm.tsx`
**Objective:** Render the contact form using shadcn/ui components

**Pseudocode:**
```pseudocode
IMPORT { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '~/components/ui/form'
IMPORT { Input } from '~/components/ui/input'
IMPORT { Textarea } from '~/components/ui/textarea'
IMPORT { Button } from '~/components/ui/button'
IMPORT { useContactForm } from '~/hooks/useContactForm'
IMPORT { useTranslation } from 'react-i18next'

EXPORT FUNCTION ContactForm()
  CONST { t } = useTranslation()
  CONST { form, onSubmit, isSubmitting, isSuccess, resetSuccess } = useContactForm()

  IF isSuccess
    RETURN (
      <div className="text-center space-y-4 py-8">
        <CheckCircle icon className="mx-auto h-16 w-16 text-green-600" />
        <h2 className="text-2xl font-black uppercase">{t('contact_success_title')}</h2>
        <p className="text-slate">{t('contact_success_description')}</p>
        <Button onClick={resetSuccess}>{t('contact_send_another')}</Button>
      </div>
    )
  END IF

  RETURN (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">

        // Name field
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('contact_name_label')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('contact_name_placeholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        // Email field (reuse existing i18n keys)
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('email_label')}</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder={t('email_placeholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        // Message field
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('contact_message_label')}</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder={t('contact_message_placeholder')} rows={6} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        // Submit button
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? t('contact_sending') : t('contact_send')}
        </Button>
      </form>
    </Form>
  )
END FUNCTION
```

---

### `app/routes/contact.tsx`
**Objective:** Contact page that composes the ContactForm component

**Pseudocode:**
```pseudocode
IMPORT { useTranslation } from 'react-i18next'
IMPORT { ContactForm } from '~/components/forms/ContactForm'

// No loader needed - public page, no data fetching

EXPORT DEFAULT FUNCTION ContactPage()
  CONST { t } = useTranslation()

  RENDER:
    <main className="container mx-auto px-4 py-16 max-w-2xl">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-black uppercase tracking-tight">
          {t('contact_title')}
        </h1>
        <p className="mt-4 text-slate">
          {t('contact_description')}
        </p>
      </header>

      <ContactForm />
    </main>
END FUNCTION
```

---

### `app/routes.ts`
**Objective:** Register contact routes

**Pseudocode:**
```pseudocode
ADD to routes array:
  route('contact', 'routes/contact.tsx'),
  route('api/contact', 'routes/api.contact.tsx'),
```

---

### `app/routes/api.__test__.contact.tsx`
**Objective:** Test-only endpoint to mock email service for E2E tests

**Pseudocode:**
```pseudocode
// This endpoint allows E2E tests to:
// 1. Check if an email would have been sent (mock mode)
// 2. Reset rate limit state for testing

IMPORT type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'

// In-memory store for mock emails (only in test mode)
DECLARE mockEmails: Array<{ name, email, message, timestamp }>
DECLARE resetRateLimitForIp: (ip: string) => void  // import from service

EXPORT LOADER ({ request })
  IF NOT process.env.DB_TEST_URL
    RETURN Response 404
  END IF

  // GET /api/__test__/contact - Return mock emails sent
  RETURN Response.json({ emails: mockEmails })
END LOADER

EXPORT ACTION ({ request })
  IF NOT process.env.DB_TEST_URL
    RETURN Response 404
  END IF

  IF request.method === 'DELETE'
    // Clear mock emails and reset rate limits
    CLEAR mockEmails
    // Reset all rate limits (for test isolation)
    RETURN Response.json({ cleared: true })
  END IF

  RETURN Response 405
END ACTION
```

**Note:** The contact service needs a way to be "mocked" in test mode. Add conditional logic to `contact.server.ts` that stores emails in memory instead of sending when `DB_TEST_URL` is set.

---

## 4. I18N Section

### Existing keys to reuse
- `email_label` - "Email"
- `email_placeholder` - "you@email.com"
- `invalid_email` - "Invalid email"

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `contact_title` | Contact Us | Contacto |
| `contact_description` | Have a question or feedback? We'd love to hear from you. | ¿Tienes alguna pregunta o comentario? Nos encantaría saber de ti. |
| `contact_name_label` | Name | Nombre |
| `contact_name_placeholder` | Your name | Tu nombre |
| `contact_name_required` | Name is required | El nombre es obligatorio |
| `contact_name_too_long` | Name is too long (max 100 characters) | El nombre es demasiado largo (máx. 100 caracteres) |
| `contact_message_label` | Message | Mensaje |
| `contact_message_placeholder` | Your message... | Tu mensaje... |
| `contact_message_too_short` | Message must be at least 10 characters | El mensaje debe tener al menos 10 caracteres |
| `contact_message_too_long` | Message is too long (max 2000 characters) | El mensaje es demasiado largo (máx. 2000 caracteres) |
| `contact_send` | Send Message | Enviar Mensaje |
| `contact_sending` | Sending... | Enviando... |
| `contact_success` | Message sent successfully! | ¡Mensaje enviado con éxito! |
| `contact_success_title` | Thank You! | ¡Gracias! |
| `contact_success_description` | We've received your message and will get back to you soon. | Hemos recibido tu mensaje y te responderemos pronto. |
| `contact_send_another` | Send Another Message | Enviar Otro Mensaje |
| `contact_error` | Failed to send message. Please try again. | Error al enviar el mensaje. Por favor, inténtalo de nuevo. |
| `contact_validation_error` | Please check the form fields and try again. | Por favor, revisa los campos del formulario e inténtalo de nuevo. |
| `contact_rate_limited` | Too many messages. Please try again in {{minutes}} minutes. | Demasiados mensajes. Por favor, inténtalo en {{minutes}} minutos. |

---

## 5. E2E Test Plan

**File:** `tests/e2e/contact-form.spec.ts`

### Test 1: Contact page loads correctly
- **Preconditions:** None
- **Steps:**
  1. Navigate to `/contact`
- **Expected:**
  - Page title "Contact Us" is visible
  - Form has name, email, and message fields
  - Send button is visible

### Test 2: Form validation - empty fields
- **Preconditions:** On contact page
- **Steps:**
  1. Click "Send Message" without filling any fields
- **Expected:**
  - Form shows validation errors
  - No API request is made

### Test 3: Form validation - invalid email
- **Preconditions:** On contact page
- **Steps:**
  1. Fill name: "Test User"
  2. Fill email: "not-an-email"
  3. Fill message: "This is a test message for the contact form"
  4. Click "Send Message"
- **Expected:**
  - Email field shows "Invalid email" error
  - No API request is made

### Test 4: Form validation - message too short
- **Preconditions:** On contact page
- **Steps:**
  1. Fill name: "Test User"
  2. Fill email: "test@example.com"
  3. Fill message: "Short"
  4. Click "Send Message"
- **Expected:**
  - Message field shows "at least 10 characters" error
  - No API request is made

### Test 5: Successful form submission (mocked email)
- **Preconditions:**
  - On contact page
  - Test endpoint `/api/__test__/contact` available (DB_TEST_URL set)
- **Steps:**
  1. Clear test state via DELETE `/api/__test__/contact`
  2. Fill name: "Test User"
  3. Fill email: "test@example.com"
  4. Fill message: "This is a test message that is long enough to pass validation."
  5. Click "Send Message"
- **Expected:**
  - Button shows "Sending..." during submission
  - Success toast appears
  - Success state shows "Thank You!" message
  - GET `/api/__test__/contact` returns the mock email in the array

### Test 6: Rate limiting (3 requests, then blocked)
- **Preconditions:**
  - On contact page
  - Test state cleared
- **Steps:**
  1. Clear test state via DELETE `/api/__test__/contact`
  2. Submit valid form 3 times successfully
  3. Submit valid form a 4th time
- **Expected:**
  - First 3 submissions succeed
  - 4th submission shows rate limit error toast
  - Toast mentions waiting time in minutes

### Test 7: Contact link from footer works
- **Preconditions:** On landing page
- **Steps:**
  1. Scroll to footer
  2. Click "Contact" link
- **Expected:**
  - Navigates to `/contact`
  - Contact form is visible

---

## 6. Definition of Done

A task is **NOT complete** unless ALL of the following pass:

1. **ALL tests pass:**
   - [ ] `npm run test:e2e -- --retries=1` passes (contact-form.spec.ts)
2. [ ] `npm run typecheck` passes
3. [ ] `npm run lint` passes
4. **Acceptance criteria met:**
   - [ ] `/contact` page renders with form
   - [ ] Form validates name, email, message
   - [ ] Valid submission sends email via Resend (or mock in tests)
   - [ ] Success toast appears after submission
   - [ ] Rate limiting blocks after 3 requests/hour from same IP
   - [ ] i18n keys work in both English and Spanish
   - [ ] Footer "Contact" link navigates to `/contact`

---

_Document created: 2025-01-10_
_Based on PLANNING.md Task 7.1_
