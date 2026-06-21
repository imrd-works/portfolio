import { reactive, ref } from 'vue'
import { sendContactRequest } from '../api'

export function useContactForm() {
  const form = reactive({ name: '', contact: '', message: '' })
  const loading = ref(false)
  const sent = ref(false)

  async function submit() {
    if (loading.value) return
    loading.value = true
    try {
      await sendContactRequest({ ...form })
      sent.value = true
    } finally {
      loading.value = false
    }
  }

  function reset() {
    form.name = ''
    form.contact = ''
    form.message = ''
    sent.value = false
  }

  return { form, loading, sent, submit, reset }
}
