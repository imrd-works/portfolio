import { api } from '@/api'

export async function fetchExampleBackendError() {
  return api.get<{ message: string }>('/not-found/example-error')
}

export async function fetchExampleOverride() {
  return api.get<{ redirect: string }>('/not-found/check', {
    toast: {
      success: 'Redirect found',
      error: 'No redirect available',
    },
  })
}
