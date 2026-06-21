import { api } from '@/api'
import { i18n } from '@/i18n'

export interface ContactPayload {
  name: string
  contact: string
  message: string
}

export async function sendContactRequest(payload: ContactPayload): Promise<{ ok: true }> {
  const baseUrl = import.meta.env.VITE_CONTACT_API_URL

  // No backend configured — keep the form working as a demo.
  if (!baseUrl) {
    await new Promise((resolve) => setTimeout(resolve, 700))
    if (import.meta.env.DEV) {
      console.info('[contact] (demo) request', payload)
    }
    return { ok: true }
  }

  // Absolute URL -> axios ignores its baseURL and posts straight to the function.
  await api.post(`${baseUrl.replace(/\/$/, '')}/contact`, payload, {
    toast: { error: i18n.global.t('home.contact.form.sendError') },
  })
  return { ok: true }
}
