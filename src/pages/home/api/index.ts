export interface ContactPayload {
  name: string
  contact: string
  message: string
}

//   import { api } from '@/api'
//   return api.post<{ id: string }>('/contact', payload, {
//     toast: { error: 'Failed to send request' },
//   })
export async function sendContactRequest(payload: ContactPayload): Promise<{ ok: true }> {
  await new Promise((resolve) => setTimeout(resolve, 700))
  if (import.meta.env.DEV) {
    console.info('[contact] request', payload)
  }
  return { ok: true }
}
