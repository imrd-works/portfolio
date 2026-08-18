export interface ContactPayload {
  name: string
  contact: string
  message: string
}

/**
 * The error toast copy is passed in rather than pulled from a global i18n
 * singleton: the prerender step creates one i18n instance per locale, so
 * module-level state would be the wrong language (or missing entirely).
 */
export async function sendContactRequest(
  payload: ContactPayload,
  errorMessage: string
): Promise<{ ok: true }> {
  const baseUrl = import.meta.env.VITE_CONTACT_API_URL

  // No backend configured — keep the form working as a demo.
  if (!baseUrl) {
    await new Promise((resolve) => setTimeout(resolve, 700))
    if (import.meta.env.DEV) {
      console.info('[contact] (demo) request', payload)
    }
    return { ok: true }
  }

  // The HTTP client is pulled in on submit, not on page load: nobody pays for
  // axios just to read the portfolio.
  const { api } = await import('@/api')

  await api.post(baseUrl, payload, {
    toast: { error: errorMessage },
  })
  return { ok: true }
}
