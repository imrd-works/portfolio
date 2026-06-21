import { ref } from 'vue'

type ToastFn = (typeof import('vue-sonner'))['toast']

let toastFn: ToastFn | null = null
let resolveToasterReady: () => void
export const toasterReadyPromise = new Promise<void>((resolve) => {
  resolveToasterReady = resolve
})

export const toasterMountRequested = ref(false)

export function markToasterMounted(): void {
  resolveToasterReady()
}

async function loadToaster(): Promise<ToastFn> {
  if (toastFn) return toastFn
  toasterMountRequested.value = true
  const [mod] = await Promise.all([import('vue-sonner'), import('vue-sonner/style.css')])
  toastFn = mod.toast
  await toasterReadyPromise
  return toastFn
}

export function useToast() {
  return {
    success: (message: string, description?: string) => {
      loadToaster().then((toast) => {
        toast.success(message, { description })
      })
    },
    error: (message: string, description?: string) => {
      loadToaster().then((toast) => {
        toast.error(message, { description })
      })
    },
    info: (message: string, description?: string) => {
      loadToaster().then((toast) => {
        toast.info(message, { description })
      })
    },
    promise: <T>(
      promise: Promise<T>,
      messages: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((err: unknown) => string)
      }
    ) => {
      return loadToaster().then((toast) => toast.promise(promise, messages))
    },
  }
}
