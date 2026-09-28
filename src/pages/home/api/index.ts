export interface ContactPayload {
  name: string
  contact: string
  message: string
  /** The honeypot: a field people never see, so only a bot fills it in. */
  company?: string
}

/** What the backend takes at most (its own limits, portfolio-backend/src/validation.ts). */
export const CONTACT_LIMITS = {
  name: 80,
  contact: 120,
  // the backend takes 4000 for the whole letter; the picked stack goes in front of the text
  message: 3500,
} as const

/** Why a letter was not sent: the visitor can do something different about each. */
export type ContactFailure = 'invalid' | 'delivery' | 'network'

export class ContactError extends Error {
  readonly kind: ContactFailure

  constructor(kind: ContactFailure) {
    super(`contact: ${kind}`)
    this.kind = kind
  }
}

/**
 * Sends the letter to the backend, which passes it on to Telegram. A plain
 * `fetch`, loaded with nothing: the form needs no HTTP client of its own.
 * Throws a `ContactError` saying why it failed.
 */
export async function sendContactRequest(payload: ContactPayload): Promise<void> {
  const url = import.meta.env.VITE_CONTACT_API_URL

  // No backend configured — keep the form working as a demo.
  if (!url) {
    await new Promise((resolve) => setTimeout(resolve, 700))
    if (import.meta.env.DEV) console.info('[contact] (demo) request', payload)
    return
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw new ContactError('network')
  }
  if (response.ok) return
  // 400/422: the backend turned the letter down; anything else: it could not deliver it
  throw new ContactError(
    response.status === 400 || response.status === 422 ? 'invalid' : 'delivery'
  )
}
