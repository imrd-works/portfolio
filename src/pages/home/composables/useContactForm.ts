import { ref } from 'vue'
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
  message: yup.string().trim().required('home.contact.form.errorAbout'),
})

export function useContactForm() {
  const sent = ref(false)
  const { defineField, errors, handleSubmit, isSubmitting, resetForm } = useForm({
    validationSchema: schema,
    initialValues: { name: '', contact: '', message: '' },
  })

  const [name, nameAttrs] = defineField('name')
  const [contact, contactAttrs] = defineField('contact')
  const [message, messageAttrs] = defineField('message')

  const submit = handleSubmit(async (values) => {
    await sendContactRequest({
      name: values.name.trim(),
      contact: values.contact.trim(),
      message: values.message.trim(),
    })
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
    errors,
    loading: isSubmitting,
    sent,
    submit,
    reset,
  }
}
