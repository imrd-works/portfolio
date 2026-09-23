import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import * as yup from 'yup'
import { contactChannels } from '../model/portfolio'
import { sendContactRequest } from '../api'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Telegram username: 5–32 chars, starts with a letter, letters/digits/underscore.
const TELEGRAM_RE = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/
// Letters (any language), spaces and hyphens — for names like "Anна-Мария".
const NAME_RE = /^[\p{L}\s-]+$/u

function toTelegramHandle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^(?:https?:\/\/)?t\.me\//i, '')
    .replace(/^@/, '')
}

function isEmailOrTelegram(value?: string): boolean {
  if (!value) return false
  const trimmed = value.trim()
  if (EMAIL_RE.test(trimmed)) return true
  // Accept a Telegram login written as @login, login, t.me/login or a URL.
  return TELEGRAM_RE.test(toTelegramHandle(trimmed))
}

// Reject pasting the site owner's own contacts — visitors should leave theirs.
function isOwnContact(value?: string): boolean {
  if (!value) return false
  const trimmed = value.trim().toLowerCase()
  if (trimmed === contactChannels.email.toLowerCase()) return true
  return toTelegramHandle(trimmed) === toTelegramHandle(contactChannels.telegramHandle)
}

const schema = yup.object({
  name: yup
    .string()
    .trim()
    .required('home.contact.form.errorName')
    .min(3, 'home.contact.form.errorName')
    .matches(NAME_RE, {
      message: 'home.contact.form.errorName',
      excludeEmptyString: true,
    }),
  contact: yup
    .string()
    .trim()
    .required('home.contact.form.errorContact')
    .test('email-or-telegram', 'home.contact.form.errorContact', isEmailOrTelegram)
    .test('not-own-contact', 'home.contact.form.errorContactOwn', (value) => !isOwnContact(value)),
  // what it is to be built with: tags picked off the technology shelf
  stack: yup.array().of(yup.string().required()).default([]),
  // a picked tag says enough on its own; without one, a few words are needed
  message: yup
    .string()
    .trim()
    .when('stack', ([stack], text) =>
      stack?.length ? text : text.required('home.contact.form.errorAbout')
    ),
})

export function useContactForm() {
  const { t } = useI18n()
  const sent = ref(false)
  const { defineField, errors, handleSubmit, isSubmitting, resetForm } = useForm({
    validationSchema: schema,
    initialValues: {
      name: '',
      contact: '',
      message: '',
      stack: [] as string[],
    },
  })

  const [name, nameAttrs] = defineField('name')
  const [contact, contactAttrs] = defineField('contact')
  const [message, messageAttrs] = defineField('message')
  const [stack] = defineField('stack')

  /** Pick a technology off the shelf, or put it back. */
  function toggleStack(chip: string) {
    const now = stack.value ?? []
    stack.value = now.includes(chip) ? now.filter((c) => c !== chip) : [...now, chip]
  }

  const submit = handleSubmit(async (values) => {
    // the stack goes first, as one line, so the request says at a glance what it is
    const picked = values.stack ?? []
    const lines = [
      picked.length ? `${t('home.contact.form.stackSent')}: ${picked.join(', ')}` : '',
      (values.message ?? '').trim(),
    ]
    await sendContactRequest(
      {
        name: values.name.trim(),
        contact: values.contact.trim(),
        message: lines.filter(Boolean).join('\n\n'),
      },
      t('home.contact.form.sendError')
    )
    sent.value = true
  })

  function reset() {
    resetForm()
    sent.value = false
  }

  return {
    name,
    nameAttrs,
    contact,
    contactAttrs,
    message,
    messageAttrs,
    stack,
    toggleStack,
    errors,
    loading: isSubmitting,
    sent,
    submit,
    reset,
  }
}
